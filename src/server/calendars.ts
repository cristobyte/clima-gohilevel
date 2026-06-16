import { db } from "@/lib/db";

export async function listCalendars(locationId: string) {
  return db.calendar.findMany({
    where: { locationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
}

export async function getAppointmentsInRange(
  locationId: string,
  start: Date,
  end: Date,
  calendarId?: string,
) {
  return db.appointment.findMany({
    where: {
      locationId,
      calendarId: calendarId || undefined,
      startTime: { gte: start, lt: end },
    },
    orderBy: { startTime: "asc" },
    include: {
      calendar: { select: { name: true, color: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
  });
}
