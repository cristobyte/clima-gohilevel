"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn, formatCurrency, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BoardCard } from "./board-types";

export function OpportunityCard({
  card,
  overlay = false,
}: {
  card: BoardCard;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card" } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-background p-3 shadow-sm",
        isDragging && "opacity-40",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{card.name}</p>
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{card.contactName}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-600">
          {formatCurrency(card.value)}
        </span>
        {card.assignee && (
          <Avatar className="size-6">
            <AvatarFallback className="bg-muted text-[10px]">
              {initials(card.assignee)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
