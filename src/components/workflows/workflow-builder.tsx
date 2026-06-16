"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveWorkflow,
  deleteWorkflow,
  enrollAllContacts,
} from "@/server/actions/workflow-actions";

type Step = { actionType: string; config: Record<string, string> };

const TRIGGERS = [
  ["CONTACT_CREATED", "Contact created"],
  ["APPOINTMENT_BOOKED", "Appointment booked"],
  ["OPPORTUNITY_STAGE_CHANGED", "Opportunity stage changed"],
  ["INBOUND_MESSAGE", "Inbound message"],
  ["MANUAL", "Manual / on enroll"],
] as const;

const ACTIONS = [
  ["SEND_SMS", "Send SMS"],
  ["SEND_EMAIL", "Send Email"],
  ["WAIT", "Wait"],
  ["ADD_TAG", "Add tag"],
  ["MOVE_OPPORTUNITY_STAGE", "Move opportunity stage"],
  ["CREATE_TASK", "Create task"],
  ["IF_ELSE", "If / Else"],
] as const;

const ACTION_LABEL: Record<string, string> = Object.fromEntries(ACTIONS);

function StepConfig({
  step,
  onChange,
}: {
  step: Step;
  onChange: (config: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...step.config, [k]: v });

  switch (step.actionType) {
    case "SEND_SMS":
      return (
        <Textarea
          rows={2}
          placeholder="Message body — use {{contact.firstName}}"
          value={step.config.body ?? ""}
          onChange={(e) => set("body", e.target.value)}
        />
      );
    case "SEND_EMAIL":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Subject"
            value={step.config.subject ?? ""}
            onChange={(e) => set("subject", e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="Email body"
            value={step.config.body ?? ""}
            onChange={(e) => set("body", e.target.value)}
          />
        </div>
      );
    case "WAIT":
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            className="w-28"
            value={step.config.minutes ?? "60"}
            onChange={(e) => set("minutes", e.target.value)}
          />
          <span className="text-muted-foreground text-sm">minutes</span>
        </div>
      );
    case "ADD_TAG":
      return (
        <Input
          placeholder="Tag name"
          value={step.config.tag ?? ""}
          onChange={(e) => set("tag", e.target.value)}
        />
      );
    case "MOVE_OPPORTUNITY_STAGE":
      return (
        <Input
          placeholder="Target stage name (e.g. Qualified)"
          value={step.config.stageName ?? ""}
          onChange={(e) => set("stageName", e.target.value)}
        />
      );
    case "CREATE_TASK":
      return (
        <Input
          placeholder="Task title"
          value={step.config.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
        />
      );
    default:
      return (
        <Input
          placeholder="Condition / note"
          value={step.config.note ?? ""}
          onChange={(e) => set("note", e.target.value)}
        />
      );
  }
}

export function WorkflowBuilder({
  locationId,
  workflowId,
  initial,
}: {
  locationId: string;
  workflowId: string;
  initial: {
    name: string;
    status: string;
    triggerType: string;
    steps: Step[];
  };
}) {
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [triggerType, setTriggerType] = useState(initial.triggerType);
  const [steps, setSteps] = useState<Step[]>(initial.steps);
  const [saving, startSave] = useTransition();
  const [busy, startBusy] = useTransition();

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }
  function addStep() {
    setSteps((prev) => [...prev, { actionType: "SEND_SMS", config: {} }]);
  }
  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    startSave(async () => {
      const res = await saveWorkflow(locationId, workflowId, {
        name,
        status,
        triggerType,
        steps,
      });
      if (res?.ok) toast.success("Workflow saved");
      else toast.error(res?.error ?? "Save failed");
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      {/* Settings */}
      <div className="space-y-4 rounded-xl border bg-background p-4">
        <div className="space-y-2">
          <Label htmlFor="wf-name">Workflow name</Label>
          <Input
            id="wf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERS.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trigger node */}
      <div className="flex flex-col items-center">
        <div className="w-full rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Zap className="size-4" />
            When: {TRIGGERS.find((t) => t[0] === triggerType)?.[1]}
          </div>
        </div>

        {/* Steps */}
        {steps.map((step, i) => (
          <div key={i} className="flex w-full flex-col items-center">
            <ArrowDown className="text-muted-foreground my-1 size-4" />
            <div className="w-full rounded-xl border bg-background p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <GripVertical className="text-muted-foreground/40 size-4" />
                <Select
                  value={step.actionType}
                  onValueChange={(v) =>
                    updateStep(i, { actionType: v, config: {} })
                  }
                >
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive size-8"
                  onClick={() => removeStep(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <StepConfig
                step={step}
                onChange={(config) => updateStep(i, { config })}
              />
            </div>
          </div>
        ))}

        <ArrowDown className="text-muted-foreground my-1 size-4" />
        <Button variant="outline" onClick={addStep} className="w-full border-dashed">
          <Plus className="size-4" /> Add step
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              startBusy(async () => {
                await enrollAllContacts(locationId, workflowId);
                toast.success("Enrolled contacts — run the engine to process");
              })
            }
          >
            Enroll contacts
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            disabled={busy}
            onClick={() => {
              if (!confirm("Delete this workflow?")) return;
              startBusy(() => deleteWorkflow(locationId, workflowId));
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="size-4" /> {saving ? "Saving…" : "Save workflow"}
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        {steps.length} step{steps.length === 1 ? "" : "s"} ·{" "}
        {ACTION_LABEL[steps[0]?.actionType] ?? "no actions yet"}
      </p>
    </div>
  );
}
