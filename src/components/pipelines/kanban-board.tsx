"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { moveOpportunity } from "@/server/actions/opportunity-actions";
import { OpportunityCard } from "./opportunity-card";
import type { BoardCard, BoardStage } from "./board-types";

type Columns = Record<string, BoardCard[]>;

function Column({
  stage,
  cards,
  children,
}: {
  stage: BoardStage;
  cards: BoardCard[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: "column" },
  });
  const total = cards.reduce((s, c) => s + c.value, 0);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: stage.color ?? "#94a3b8" }}
          />
          <span className="text-sm font-semibold">{stage.name}</span>
          <span className="text-muted-foreground text-xs">{cards.length}</span>
        </div>
        <span className="text-muted-foreground text-xs font-medium">
          {formatCurrency(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-24 flex-1 space-y-2 rounded-b-xl p-2 transition-colors ${
          isOver ? "bg-emerald-500/5" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function KanbanBoard({
  locationId,
  stages,
  initialColumns,
}: {
  locationId: string;
  stages: BoardStage[];
  initialColumns: Columns;
}) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const cardIndex = useMemo(() => {
    const map: Record<string, string> = {}; // cardId -> stageId
    for (const [stageId, cards] of Object.entries(columns))
      for (const c of cards) map[c.id] = stageId;
    return map;
  }, [columns]);

  function containerOf(id: string): string | undefined {
    if (columns[id]) return id; // id is a column
    return cardIndex[id];
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    const stageId = cardIndex[id];
    const card = columns[stageId]?.find((c) => c.id === id) ?? null;
    setActiveCard(card);
  }

  function onDragOver(e: DragOverEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    const from = containerOf(activeId);
    const to = containerOf(overId);
    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const fromCards = [...prev[from]];
      const toCards = [...prev[to]];
      const idx = fromCards.findIndex((c) => c.id === activeId);
      if (idx < 0) return prev;
      const [moved] = fromCards.splice(idx, 1);

      // Insert at the position of the over-card, or append if over the column.
      const overIdx = toCards.findIndex((c) => c.id === overId);
      const insertAt = overIdx >= 0 ? overIdx : toCards.length;
      toCards.splice(insertAt, 0, moved);

      return { ...prev, [from]: fromCards, [to]: toCards };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActiveCard(null);
    if (!overId) return;

    const to = containerOf(overId);
    if (!to) return;

    // Reorder within the destination column locally.
    let finalIndex = 0;
    setColumns((prev) => {
      const toCards = [...prev[to]];
      const activeIdx = toCards.findIndex((c) => c.id === activeId);
      const overIdx = toCards.findIndex((c) => c.id === overId);
      if (activeIdx < 0) return prev;
      const target = overIdx >= 0 ? overIdx : toCards.length - 1;
      const [moved] = toCards.splice(activeIdx, 1);
      toCards.splice(target, 0, moved);
      finalIndex = target;
      return { ...prev, [to]: toCards };
    });

    try {
      await moveOpportunity(locationId, activeId, to, finalIndex);
    } catch {
      toast.error("Failed to move opportunity");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const cards = columns[stage.id] ?? [];
          return (
            <Column key={stage.id} stage={stage} cards={cards}>
              <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {cards.map((card) => (
                  <OpportunityCard key={card.id} card={card} />
                ))}
                {cards.length === 0 && (
                  <p className="text-muted-foreground/60 px-2 py-6 text-center text-xs">
                    Drop here
                  </p>
                )}
              </SortableContext>
            </Column>
          );
        })}
      </div>

      <DragOverlay>
        {activeCard ? <OpportunityCard card={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
