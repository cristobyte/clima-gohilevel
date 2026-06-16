import { requireLocation, getSessionContext } from "@/lib/tenant";
import { getAccessibleLocations } from "@/server/locations";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const ctx = await requireLocation(locationId); // 404s if no access
  const session = await getSessionContext();

  const [locations, agency] = await Promise.all([
    getAccessibleLocations(),
    db.agency.findUnique({
      where: { id: ctx.agencyId },
      select: { name: true },
    }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar locationId={locationId} agencyName={agency?.name ?? "Agency"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          locations={locations}
          currentLocationId={locationId}
          userName={session.name}
          userEmail={session.email}
        />
        <main className="min-h-0 flex-1 overflow-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
