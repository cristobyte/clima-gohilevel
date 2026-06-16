import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function getLocationDashboard(locationId: string) {
  const now = new Date();
  const [
    contactCount,
    openOpps,
    unreadAgg,
    appointmentsToday,
    recentContacts,
    upcomingAppointments,
  ] = await Promise.all([
    db.contact.count({ where: { locationId } }),
    db.opportunity.aggregate({
      where: { locationId, status: "OPEN" },
      _sum: { monetaryValue: true },
      _count: true,
    }),
    db.conversation.aggregate({
      where: { locationId },
      _sum: { unreadCount: true },
    }),
    db.appointment.count({
      where: {
        locationId,
        startTime: { gte: startOfDay(now), lte: endOfDay(now) },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    db.contact.findMany({
      where: { locationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    }),
    db.appointment.findMany({
      where: { locationId, startTime: { gte: now }, status: { notIn: ["CANCELLED"] } },
      orderBy: { startTime: "asc" },
      take: 5,
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  return {
    contactCount,
    openOppValue: Number(openOpps._sum.monetaryValue ?? 0),
    openOppCount: openOpps._count,
    unreadCount: unreadAgg._sum.unreadCount ?? 0,
    appointmentsToday,
    recentContacts,
    upcomingAppointments,
  };
}
