import { db } from "@/lib/db";

export async function listWorkflows(locationId: string) {
  return db.workflow.findMany({
    where: { locationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { steps: true, enrollments: true } },
    },
  });
}

export async function getWorkflow(locationId: string, workflowId: string) {
  return db.workflow.findFirst({
    where: { id: workflowId, locationId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function countActiveEnrollments(workflowId: string) {
  return db.workflowEnrollment.count({
    where: { workflowId, status: "ACTIVE" },
  });
}
