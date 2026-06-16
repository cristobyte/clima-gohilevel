import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { getWorkflow } from "@/server/workflows";
import { WorkflowBuilder } from "@/components/workflows/workflow-builder";
import { Button } from "@/components/ui/button";

export default async function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ locationId: string; workflowId: string }>;
}) {
  const { locationId, workflowId } = await params;
  await requireLocation(locationId);
  const workflow = await getWorkflow(locationId, workflowId);
  if (!workflow) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 border-b bg-background px-6 py-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/location/${locationId}/automation`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">{workflow.name}</h1>
      </div>
      <WorkflowBuilder
        locationId={locationId}
        workflowId={workflow.id}
        initial={{
          name: workflow.name,
          status: workflow.status,
          triggerType: workflow.triggerType,
          steps: workflow.steps.map((s) => ({
            actionType: s.actionType,
            config: (s.config as Record<string, string>) ?? {},
          })),
        }}
      />
    </div>
  );
}
