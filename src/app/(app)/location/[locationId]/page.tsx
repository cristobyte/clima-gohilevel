import Link from "next/link";
import { format } from "date-fns";
import { Users, DollarSign, MessageSquare, CalendarClock } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { getLocationDashboard } from "@/server/dashboard";
import { ModuleHeader } from "@/components/layout/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, fullName } from "@/lib/utils";

export default async function LocationDashboard({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const data = await getLocationDashboard(locationId);

  const kpis = [
    {
      label: "Total Contacts",
      value: data.contactCount.toLocaleString(),
      icon: Users,
      color: "text-sky-500",
    },
    {
      label: "Open Pipeline Value",
      value: formatCurrency(data.openOppValue),
      sub: `${data.openOppCount} open deals`,
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      label: "Unread Messages",
      value: data.unreadCount.toLocaleString(),
      icon: MessageSquare,
      color: "text-violet-500",
    },
    {
      label: "Appointments Today",
      value: data.appointmentsToday.toLocaleString(),
      icon: CalendarClock,
      color: "text-amber-500",
    },
  ];

  return (
    <div>
      <ModuleHeader
        title="Dashboard"
        description="A snapshot of this sub-account's activity."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {kpi.label}
                  </CardTitle>
                  <Icon className={`size-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{kpi.value}</div>
                  {kpi.sub && (
                    <p className="text-muted-foreground mt-1 text-xs">{kpi.sub}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentContacts.length === 0 && (
                <p className="text-muted-foreground text-sm">No contacts yet.</p>
              )}
              {data.recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/location/${locationId}/contacts/${c.id}`}
                  className="hover:bg-muted/60 -mx-2 flex items-center justify-between rounded-md px-2 py-1.5"
                >
                  <span className="text-sm font-medium">
                    {fullName(c.firstName, c.lastName)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(c.createdAt, "MMM d")}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingAppointments.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No upcoming appointments.
                </p>
              )}
              {data.upcomingAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">
                    {fullName(a.contact?.firstName, a.contact?.lastName)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(a.startTime, "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
