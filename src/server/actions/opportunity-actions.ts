"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireLocation } from "@/lib/tenant";

/**
 * Move an opportunity to a target stage at a target index. We recompute a
 * fractional `position` between the neighbours so reordering never renumbers
 * the whole column.
 */
export async function moveOpportunity(
  locationId: string,
  opportunityId: string,
  toStageId: string,
  toIndex: number,
) {
  await requireLocation(locationId);

  const siblings = await db.opportunity.findMany({
    where: { locationId, stageId: toStageId, id: { not: opportunityId } },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  const before = siblings[toIndex - 1]?.position;
  const after = siblings[toIndex]?.position;

  let position: number;
  if (before == null && after == null) position = 1000;
  else if (before == null) position = (after as number) - 1000;
  else if (after == null) position = (before as number) + 1000;
  else position = (before + after) / 2;

  await db.opportunity.updateMany({
    where: { id: opportunityId, locationId },
    data: { stageId: toStageId, position },
  });

  revalidatePath(`/location/${locationId}/opportunities`);
}

const oppSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactId: z.string().min(1, "Contact is required"),
  stageId: z.string().min(1, "Stage is required"),
  monetaryValue: z.coerce.number().min(0).default(0),
});

export type OppFormState = { error?: string; ok?: boolean } | undefined;

export async function createOpportunity(
  locationId: string,
  pipelineId: string,
  _prev: OppFormState,
  formData: FormData,
): Promise<OppFormState> {
  await requireLocation(locationId);

  const parsed = oppSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // Place at the bottom of its stage.
  const last = await db.opportunity.findFirst({
    where: { locationId, stageId: d.stageId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.opportunity.create({
    data: {
      locationId,
      pipelineId,
      stageId: d.stageId,
      contactId: d.contactId,
      name: d.name,
      monetaryValue: new Prisma.Decimal(d.monetaryValue),
      position: (last?.position ?? 0) + 1000,
    },
  });

  revalidatePath(`/location/${locationId}/opportunities`);
  return { ok: true };
}

export async function deleteOpportunity(
  locationId: string,
  opportunityId: string,
) {
  await requireLocation(locationId);
  await db.opportunity.deleteMany({ where: { id: opportunityId, locationId } });
  revalidatePath(`/location/${locationId}/opportunities`);
}
