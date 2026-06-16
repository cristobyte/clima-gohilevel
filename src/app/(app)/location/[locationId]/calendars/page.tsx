import Link from "next/link";
import {
  addDays,
  format,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { db } from "@/lib/db";
import { listCalendars, getAppointmentsInRange } from "@/server/calendars";
import { ModuleHeader } from "@/components/layout/module-header";
import { Placeholder } from "@/components/layout/placeholder";
import { AppointmentFormDialog } from "@/components/calendars/appointment-form-dialog";
import { CalendarFormDialog } from "@/components/calendars/calendar-form-dialog";
import { WeekView, type WeekAppointment } from "@/components/calendars/week-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fullName } from "@/lib/utils";

export default async function CalendarsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const sp = await searchParams;

  const anchor = sp.date ? new Date(sp.date) : new Date();
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const [calendars, appts, contacts] = await Promise.all([
    listCalendars(locationId),
    getAppointmentsInRange(locationId, weekStart, weekEnd),
    db.contact.findMany({
      where: { locationId },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const weekAppts: WeekAppointment[] = appts.map((a) => ({
    id: a.id,
    title: a.title,
    startISO: a.startTime.toISOString(),
    endISO: a.endTime.toISOString(),
    color: a.calendar.color ?? "#6366f1",
    contactName: a.contact
      ? fullName(a.contact.firstName, a.contact.lastName)
      : null,
    status: a.status,
    calendarName: a.calendar.name,
  }));

  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
  const prevHref = `?date=${fmtDate(addDays(weekStart, -7))}`;
  const nextHref = `?date=${fmtDate(addDays(weekStart, 7))}`;
  const todayHref = `?date=${fmtDate(new Date())}`;

  if (calendars.length === 0) {
    return (
      <div>
        <ModuleHeader
          title="Calendars"
          actions={<CalendarFormDialog locationId={locationId} />}
        />
        <Placeholder note="No calendars yet. Create one to start booking appointments." />
      </div>
    );
  }

  return (
    <div>
      <ModuleHeader
        title="Calendars"
        description={`Week of ${format(weekStart, "MMM d, yyyy")}`}
        actions={
          <div className="flex items-center gap-2">
            <CalendarFormDialog locationId={locationId} />
            <AppointmentFormDialog
              locationId={locationId}
              calendars={calendars.map((c) => ({
                id: c.id,
                name: c.name,
                durationMinutes: c.durationMinutes,
              }))}
              contacts={contacts.map((c) => ({
                id: c.id,
                name: fullName(c.firstName, c.lastName),
              }))}
              defaultDate={fmtDate(weekStart)}
            />
          </div>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="icon">
              <Link href={prevHref}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={todayHref}>Today</Link>
            </Button>
            <Button asChild variant="outline" size="icon">
              <Link href={nextHref}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {calendars.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: c.color ?? "#6366f1" }}
                />
                {c.name} · {c._count.appointments}
              </Badge>
            ))}
          </div>
        </div>

        <WeekView
          locationId={locationId}
          weekStartISO={weekStart.toISOString()}
          appointments={weekAppts}
        />
      </div>
    </div>
  );
}
