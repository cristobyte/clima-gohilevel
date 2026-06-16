"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionType, TriggerType, WorkflowStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireLocation } from "@/lib/tenant";
import { processDueEnrollments } from "@/server/workflow-engine";

export async function createWorkflow(locationId: string, formData: FormData) {
  await requireLocation(locationId);
  const name = String(formData.get("name") ?? "").trim() || "Untitled workflow";
  const workflow = await db.workflow.create({
    data: { locationId, name, status: "DRAFT", triggerType: "MANUAL" },
  });
  redirect(`/location/${locationId}/automation/${workflow.id}`);
}

const stepSchema = z.object({
  actionType: z.string(),
  config: z.record(z.string(), z.unknown()),
});

const saveSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED"]),
  triggerType: z.enum([
    "CONTACT_CREATED",
    "OPPORTUNITY_STAGE_CHANGED",
    "APPOINTMENT_BOOKED",
    "INBOUND_MESSAGE",
    "MANUAL",
  ]),
  steps: z.array(stepSchema),
});

export type SaveWorkflowState = { error?: string; ok?: boolean } | undefined;

export async function saveWorkflow(
  locationId: string,
  workflowId: string,
  payload: unknown,
): Promise<SaveWorkflowState> {
  await requireLocation(locationId);

  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid workflow" };
  }
  const { name, status, triggerType, steps } = parsed.data;

  await db.$transaction([
    db.workflow.updateMany({
      where: { id: workflowId, locationId },
      data: {
        name,
        status: status as WorkflowStatus,
        triggerType: triggerType as TriggerType,
      },
    }),
    db.workflowStep.deleteMany({ where: { workflowId } }),
    db.workflowStep.createMany({
      data: steps.map((s, i) => ({
        workflowId,
        order: i,
        actionType: s.actionType as ActionType,
        config: s.config as object,
      })),
    }),
  ]);

  revalidatePath(`/location/${locationId}/automation/${workflowId}`);
  revalidatePath(`/location/${locationId}/automation`);
  return { ok: true };
}

export async function deleteWorkflow(locationId: string, workflowId: string) {
  await requireLocation(locationId);
  await db.workflow.deleteMany({ where: { id: workflowId, locationId } });
  revalidatePath(`/location/${locationId}/automation`);
  redirect(`/location/${locationId}/automation`);
}

/** Manually run the engine (process due enrollments) — handy for demos. */
export async function runEngineNow(locationId: string) {
  await requireLocation(locationId);
  const result = await processDueEnrollments();
  revalidatePath(`/location/${locationId}/automation`);
  revalidatePath(`/location/${locationId}/conversations`);
  return result;
}

/** Enroll the first N contacts into a MANUAL workflow for demoing. */
export async function enrollAllContacts(locationId: string, workflowId: string) {
  await requireLocation(locationId);
  const contacts = await db.contact.findMany({
    where: { locationId },
    select: { id: true },
    take: 25,
  });
  await db.workflowEnrollment.createMany({
    data: contacts.map((c) => ({
      workflowId,
      contactId: c.id,
      currentOrder: 0,
      status: "ACTIVE" as const,
      nextRunAt: new Date(),
    })),
  });
  revalidatePath(`/location/${locationId}/automation/${workflowId}`);
}
