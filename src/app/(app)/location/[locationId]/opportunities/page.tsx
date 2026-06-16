import { requireLocation } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getPipelineBoard, listPipelines } from "@/server/opportunities";
import { ModuleHeader } from "@/components/layout/module-header";
import { Placeholder } from "@/components/layout/placeholder";
import { KanbanBoard } from "@/components/pipelines/kanban-board";
import { PipelineSwitcher } from "@/components/pipelines/pipeline-switcher";
import { OpportunityFormDialog } from "@/components/pipelines/opportunity-form-dialog";
import { fullName } from "@/lib/utils";
import type { BoardCard } from "@/components/pipelines/board-types";

export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const { pipeline: pipelineId } = await searchParams;

  const [board, pipelines, contacts] = await Promise.all([
    getPipelineBoard(locationId, pipelineId),
    listPipelines(locationId),
    db.contact.findMany({
      where: { locationId },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  if (!board) {
    return (
      <div>
        <ModuleHeader title="Opportunities" />
        <Placeholder note="No pipelines yet for this sub-account." />
      </div>
    );
  }

  const initialColumns: Record<string, BoardCard[]> = {};
  for (const stage of board.stages) {
    initialColumns[stage.id] = (board.byStage[stage.id] ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      value: Number(o.monetaryValue),
      contactName: fullName(o.contact.firstName, o.contact.lastName),
      assignee: o.assignedUser?.name ?? null,
      status: o.status,
    }));
  }

  const contactOptions = contacts.map((c) => ({
    id: c.id,
    name: fullName(c.firstName, c.lastName),
  }));

  return (
    <div className="flex h-full flex-col">
      <ModuleHeader
        title="Opportunities"
        description={board.pipeline.name}
        actions={
          <div className="flex items-center gap-2">
            <PipelineSwitcher pipelines={pipelines} currentId={board.pipeline.id} />
            <OpportunityFormDialog
              locationId={locationId}
              pipelineId={board.pipeline.id}
              stages={board.stages.map((s) => ({ id: s.id, name: s.name }))}
              contacts={contactOptions}
            />
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <KanbanBoard
          locationId={locationId}
          stages={board.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
          }))}
          initialColumns={initialColumns}
        />
      </div>
    </div>
  );
}
