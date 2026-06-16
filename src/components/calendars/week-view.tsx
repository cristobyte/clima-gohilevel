"use client";

import { useState, useTransition } from "react";
import {
  addDays,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  setAppointmentStatus,
  deleteAppointment,
} from "@/server/actions/appointment-actions";

export type WeekAppointment = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  color: string;
  contactName: string | null;
  status: string;
  calendarName: string;
};

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 48;
const STATUSES = ["BOOKED", "CONFIRMED", "SHOWED", "NO_SHOW", "CANCELLED"] as const;

export function WeekView({
  locationId,
  weekStartISO,
  appointments,
}: {
  locationId: string;
  weekStartISO: string;
  appointments: WeekAppointment[];
}) {
  const weekStart = startOfDay(new Date(weekStartISO));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  const [selected, setSelected] = useState<WeekAppointment | null>(null);
  const [pending, start] = useTransition();

  function blockStyle(appt: WeekAppointment) {
    const s = new Date(appt.startISO);
    const e = new Date(appt.endISO);
    const top =
      (s.getHours() - START_HOUR + s.getMinutes() / 60) * HOUR_HEIGHT;
    const height = Math.max(
      18,
      ((e.getTime() - s.getTime()) / 3_600_000) * HOUR_HEIGHT,
    );
    return { top, height };
  }

  function changeStatus(s: (typeof STATUSES)[number]) {
    if (!selected) return;
    start(async () => {
      await setAppointmentStatus(locationId, selected.id, s);
      toast.success(`Marked ${s.replace("_", " ").toLowerCase()}`);
      setSelected(null);
    });
  }

  function remove() {
    if (!selected) return;
    start(async () => {
      await deleteAppointment(locationId, selected.id);
      toast.success("Appointment deleted");
      setSelected(null);
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-background">
        {/* Day headers */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))] border-b">
          <div />
          {days.map((d) => {
            const today = isSameDay(d, new Date());
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "border-l px-2 py-2 text-center",
                  today && "bg-emerald-500/5",
                )}
              >
                <div className="text-muted-foreground text-xs">
                  {format(d, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    today && "text-emerald-600",
                  )}
                >
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-[56px_repeat(7,minmax(120px,1fr))]">
          {/* Hour labels */}
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="text-muted-foreground relative border-b pr-1 text-right text-[10px]"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 right-1">
                  {format(new Date().setHours(h, 0), "ha")}
                </span>
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayAppts = appointments.filter((a) =>
              isSameDay(new Date(a.startISO), d),
            );
            return (
              <div key={d.toISOString()} className="relative border-l">
                {hours.map((h) => (
                  <div key={h} className="border-b" style={{ height: HOUR_HEIGHT }} />
                ))}
                {dayAppts.map((a) => {
                  const { top, height } = blockStyle(a);
                  const cancelled = a.status === "CANCELLED";
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      style={{
                        top,
                        height,
                        borderLeftColor: a.color,
                      }}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-md border-l-4 bg-background px-1.5 py-0.5 text-left text-[11px] shadow-sm ring-1 ring-border transition-shadow hover:shadow-md",
                        cancelled && "opacity-50 line-through",
                      )}
                    >
                      <div className="truncate font-medium">{a.title}</div>
                      <div className="text-muted-foreground truncate">
                        {format(new Date(a.startISO), "h:mm a")}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">When: </span>
                  {format(new Date(selected.startISO), "EEE MMM d, h:mm a")} –{" "}
                  {format(new Date(selected.endISO), "h:mm a")}
                </p>
                <p>
                  <span className="text-muted-foreground">Calendar: </span>
                  {selected.calendarName}
                </p>
                {selected.contactName && (
                  <p>
                    <span className="text-muted-foreground">Contact: </span>
                    {selected.contactName}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status: </span>
                  <Badge variant="outline">{selected.status}</Badge>
                </p>
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Set status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={s === selected.status ? "default" : "outline"}
                      disabled={pending}
                      onClick={() => changeStatus(s)}
                    >
                      {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t pt-3">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={remove}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
