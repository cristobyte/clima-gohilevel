import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Plus, Users } from "lucide-react";
import { getAgencyOverview } from "@/server/agency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AgencyOverviewPage() {
  const data = await getAgencyOverview();
  if (!data) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {data.agency.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {data.locations.length} sub-account
            {data.locations.length === 1 ? "" : "s"} ·{" "}
            {data.totalContacts.toLocaleString()} total contacts
          </p>
        </div>
        {data.canManage && (
          <Button asChild>
            <Link href="/agency/locations">
              <Plus className="size-4" /> Manage sub-accounts
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.locations.map((loc) => (
          <Card key={loc.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Building2 className="size-5" />
              </span>
              <CardTitle className="text-base">{loc.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="size-4" /> {loc._count.contacts}
                </span>
                <span>{loc._count.opportunities} deals</span>
                <span>{loc._count.appointments} appts</span>
              </div>
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/location/${loc.id}`}>
                  Open workspace <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {data.locations.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="text-muted-foreground py-12 text-center text-sm">
              No sub-accounts yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
