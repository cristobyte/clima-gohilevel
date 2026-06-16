"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runEngineNow } from "@/server/actions/workflow-actions";

export function RunEngineButton({ locationId }: { locationId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await runEngineNow(locationId);
          toast.success(
            `Engine ran — ${r.processed} processed, ${r.actions} actions, ${r.completed} completed`,
          );
        })
      }
    >
      <Play className="size-4" /> {pending ? "Running…" : "Run engine"}
    </Button>
  );
}
