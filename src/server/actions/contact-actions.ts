"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireLocation } from "@/lib/tenant";
import { enrollContactTriggers } from "@/server/workflow-engine";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  notes: z.string().optional(),
});

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export type ContactFormState = { error?: string; ok?: boolean } | undefined;

export async function createContact(
  locationId: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await requireLocation(locationId);

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const contact = await db.contact.create({
    data: {
      locationId,
      firstName: d.firstName,
      lastName: d.lastName || null,
      email: d.email || null,
      phone: d.phone || null,
      companyName: d.companyName || null,
      source: d.source || "Manual",
      tags: parseTags(d.tags),
      notes: d.notes || null,
    },
  });

  // Fire CONTACT_CREATED workflow triggers.
  await enrollContactTriggers(locationId, contact.id, "CONTACT_CREATED");

  revalidatePath(`/location/${locationId}/contacts`);
  return { ok: true };
}

export async function updateContact(
  locationId: string,
  contactId: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await requireLocation(locationId);

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  await db.contact.updateMany({
    where: { id: contactId, locationId },
    data: {
      firstName: d.firstName,
      lastName: d.lastName || null,
      email: d.email || null,
      phone: d.phone || null,
      companyName: d.companyName || null,
      source: d.source || null,
      tags: parseTags(d.tags),
      notes: d.notes || null,
    },
  });

  revalidatePath(`/location/${locationId}/contacts/${contactId}`);
  revalidatePath(`/location/${locationId}/contacts`);
  return { ok: true };
}

export async function deleteContact(locationId: string, contactId: string) {
  await requireLocation(locationId);
  await db.contact.deleteMany({ where: { id: contactId, locationId } });
  revalidatePath(`/location/${locationId}/contacts`);
}
