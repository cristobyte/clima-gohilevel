import { db } from "@/lib/db";

export async function listPipelines(locationId: string) {
  return db.pipeline.findMany({
    where: { locationId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
}

/**
 * Load a pipeline with its stages and opportunities (ordered by fractional
 * position within each stage), for the Kanban board.
 */
export async function getPipelineBoard(locationId: string, pipelineId?: string) {
  const pipeline = pipelineId
    ? await db.pipeline.findFirst({ where: { id: pipelineId, locationId } })
    : await db.pipeline.findFirst({
        where: { locationId },
        orderBy: { order: "asc" },
      });
  if (!pipeline) return null;

  const stages = await db.pipelineStage.findMany({
    where: { pipelineId: pipeline.id },
    orderBy: { order: "asc" },
  });

  const opportunities = await db.opportunity.findMany({
    where: { pipelineId: pipeline.id, locationId },
    orderBy: { position: "asc" },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      assignedUser: { select: { name: true } },
    },
  });

  const byStage: Record<string, typeof opportunities> = {};
  for (const s of stages) byStage[s.id] = [];
  for (const o of opportunities) (byStage[o.stageId] ??= []).push(o);

  const stageTotals: Record<string, number> = {};
  for (const s of stages) {
    stageTotals[s.id] = (byStage[s.id] ?? []).reduce(
      (sum, o) => sum + Number(o.monetaryValue),
      0,
    );
  }

  return { pipeline, stages, byStage, stageTotals };
}

export type BoardData = NonNullable<
  Awaited<ReturnType<typeof getPipelineBoard>>
>;
