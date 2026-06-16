"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignConversation,
  setConversationStatus,
} from "@/server/actions/conversation-actions";

const STATUSES = ["OPEN", "SNOOZED", "CLOSED"] as const;
const UNASSIGNED = "__unassigned__";

export function ConversationActions({
  locationId,
  conversationId,
  status,
  assignedUserId,
  users,
}: {
  locationId: string;
  conversationId: string;
  status: string;
  assignedUserId: string | null;
  users: { id: string; name: string | null }[];
}) {
  const [pending, start] = useTransition();

  function changeStatus(s: (typeof STATUSES)[number]) {
    start(async () => {
      await setConversationStatus(locationId, conversationId, s);
      toast.success(`Marked ${s.toLowerCase()}`);
    });
  }

  function changeAssignee(userId: string) {
    start(async () => {
      await assignConversation(
        locationId,
        conversationId,
        userId === UNASSIGNED ? null : userId,
      );
      toast.success("Assignment updated");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={assignedUserId ?? UNASSIGNED}
        onValueChange={changeAssignee}
        disabled={pending}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name ?? "User"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            {status} <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {STATUSES.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => changeStatus(s)}>
              {s === status && <Check className="size-4" />}
              <span className={s === status ? "" : "ml-6"}>{s}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
