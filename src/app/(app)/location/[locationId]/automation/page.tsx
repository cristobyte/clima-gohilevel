import Link from "next/link";
import { Workflow as WorkflowIcon, Users, Zap } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { listWorkflows } from "@/server/workflows";
import { ModuleHeader } from "@/components/layout/module-header";
import { CreateWorkflowButton } from "@/components/workflows/create-workflow-button";
import { RunEngineButton } from "@/components/workflows/run-engine-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-600",
  DRAFT: "bg-zinc-500/10 text-zinc-600",
  PAUSED: "bg-amber-500/10 text-amber-600",
};

export default async function AutomationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const workflows = await listWorkflows(locationId);

  return (
    <div>
      <ModuleHeader
        title="Automation"
        description="Build workflows that run when things happen."
        actions={
          <div className="flex items-center gap-2">
            <RunEngineButton locationId={locationId} />
            <CreateWorkflowButton locationId={locationId} />
          </div>
        }
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.length === 0 && (
          <p className="text-muted-foreground col-span-full py-10 text-center text-sm">
            No workflows yet. Create your first automation.
          </p>
        )}
        {workflows.map((w) => (
          <Link key={w.id} href={`/location/${locationId}/automation/${w.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 py-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                    <WorkflowIcon className="size-5" />
                  </span>
                  <Badge className={STATUS_STYLES[w.status] ?? ""}>
                    {w.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                    <Zap className="size-3" /> {w.triggerType.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <span>{w._count.steps} steps</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" /> {w._count.enrollments} enrolled
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
