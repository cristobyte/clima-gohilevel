"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/tenant";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  timezone: z.string().default("America/New_York"),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createLocation(formData: FormData) {
  const ctx = await getSessionContext();

  // Only agency-level admins may create sub-accounts.
  const agencyMembership = ctx.memberships.find(
    (m) => m.locationId === null && m.role === "AGENCY_ADMIN",
  );
  if (!agencyMembership) {
    throw new Error("Not authorized to create sub-accounts.");
  }

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    timezone: formData.get("timezone") || "America/New_York",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const agencyId = agencyMembership.agencyId;
  let slug = slugify(parsed.data.name) || "location";
  // Ensure unique slug within the agency.
  const existing = await db.location.findMany({
    where: { agencyId, slug: { startsWith: slug } },
    select: { slug: true },
  });
  if (existing.some((l) => l.slug === slug)) {
    slug = `${slug}-${existing.length + 1}`;
  }

  await db.location.create({
    data: {
      agencyId,
      name: parsed.data.name,
      slug,
      phone: parsed.data.phone,
      timezone: parsed.data.timezone,
    },
  });

  revalidatePath("/agency");
  revalidatePath("/agency/locations");
}
