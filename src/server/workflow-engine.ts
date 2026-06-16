import { db } from "@/lib/db";
import type { TriggerType } from "@prisma/client";

/**
 * Enroll a contact into every PUBLISHED workflow in the location whose trigger
 * matches `trigger`. Enrollments start at step 0 and become due immediately.
 */
export async function enrollContactTriggers(
  locationId: string,
  contactId: string,
  trigger: TriggerType,
) {
  const workflows = await db.workflow.findMany({
    where: { locationId, status: "PUBLISHED", triggerType: trigger },
    select: { id: true },
  });
  if (workflows.length === 0) return;

  await db.workflowEnrollment.createMany({
    data: workflows.map((w) => ({
      workflowId: w.id,
      contactId,
      currentOrder: 0,
      status: "ACTIVE" as const,
      nextRunAt: new Date(),
    })),
  });
}
