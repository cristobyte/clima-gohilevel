import { db } from "@/lib/db";
import type { TriggerType, Channel } from "@prisma/client";

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

type StepConfig = Record<string, unknown>;

function str(config: StepConfig, key: string, fallback = ""): string {
  const v = config[key];
  return typeof v === "string" ? v : fallback;
}

/** Render {{contact.firstName}} style tokens in a message body. */
function renderTemplate(
  body: string,
  contact: { firstName: string; lastName: string | null },
) {
  return body
    .replaceAll("{{contact.firstName}}", contact.firstName)
    .replaceAll("{{contact.lastName}}", contact.lastName ?? "");
}

async function appendOutboundMessage(
  locationId: string,
  contactId: string,
  channel: Channel,
  body: string,
) {
  let conversation = await db.conversation.findFirst({
    where: { locationId, contactId, channel },
    orderBy: { lastMessageAt: "desc" },
  });
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { locationId, contactId, channel, status: "OPEN" },
    });
  }
  await db.$transaction([
    db.message.create({
      data: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        channel,
        body,
        status: "SENT",
      },
    }),
    db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);
}

/**
 * Process all due enrollments. Each enrollment runs its steps in order until it
 * hits a WAIT (which schedules the next run) or finishes. Returns a summary.
 */
export async function processDueEnrollments(limit = 50) {
  const due = await db.workflowEnrollment.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: new Date() } },
    take: limit,
    include: {
      contact: true,
      workflow: { include: { steps: { orderBy: { order: "asc" } } } },
    },
  });

  let processed = 0;
  let completed = 0;
  let actions = 0;

  for (const enrollment of due) {
    const { workflow, contact } = enrollment;
    const steps = workflow.steps;
    let order = enrollment.currentOrder;
    let waited = false;

    // Run consecutive instant steps; stop at a WAIT or the end.
    for (let guard = 0; guard < 50; guard++) {
      const step = steps[order];
      if (!step) break; // finished
      const config = (step.config ?? {}) as StepConfig;

      if (step.actionType === "WAIT") {
        const minutes = Number(config.minutes ?? 60);
        await db.workflowEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentOrder: order + 1,
            nextRunAt: new Date(Date.now() + minutes * 60_000),
          },
        });
        waited = true;
        break;
      }

      // Execute the action.
      try {
        switch (step.actionType) {
          case "SEND_SMS":
            await appendOutboundMessage(
              workflow.locationId,
              contact.id,
              "SMS",
              renderTemplate(str(config, "body", "(no message)"), contact),
            );
            actions++;
            break;
          case "SEND_EMAIL":
            await appendOutboundMessage(
              workflow.locationId,
              contact.id,
              "EMAIL",
              renderTemplate(
                `${str(config, "subject", "")}\n${str(config, "body", "")}`.trim(),
                contact,
              ),
            );
            actions++;
            break;
          case "ADD_TAG": {
            const tag = str(config, "tag").trim().toLowerCase();
            if (tag && !contact.tags.includes(tag)) {
              await db.contact.update({
                where: { id: contact.id },
                data: { tags: { push: tag } },
              });
            }
            actions++;
            break;
          }
          case "MOVE_OPPORTUNITY_STAGE": {
            const stageName = str(config, "stageName").trim();
            if (stageName) {
              const opp = await db.opportunity.findFirst({
                where: { locationId: workflow.locationId, contactId: contact.id },
                orderBy: { updatedAt: "desc" },
              });
              if (opp) {
                const stage = await db.pipelineStage.findFirst({
                  where: { pipelineId: opp.pipelineId, name: stageName },
                });
                if (stage) {
                  await db.opportunity.update({
                    where: { id: opp.id },
                    data: { stageId: stage.id },
                  });
                }
              }
            }
            actions++;
            break;
          }
          // CREATE_TASK / IF_ELSE: recorded but no side effect in this build.
          default:
            break;
        }
      } catch {
        // Skip a failing step but keep the enrollment moving.
      }

      order += 1;
    }

    if (!waited) {
      await db.workflowEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentOrder: order,
          status: "COMPLETED",
          nextRunAt: null,
        },
      });
      completed++;
    }
    processed++;
  }

  return { processed, completed, actions };
}
