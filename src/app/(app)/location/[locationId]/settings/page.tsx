import { requireLocation } from "@/lib/tenant";
import { db } from "@/lib/db";
import { ModuleHeader } from "@/components/layout/module-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const location = await db.location.findUnique({ where: { id: locationId } });

  return (
    <div>
      <ModuleHeader title="Settings" description="Sub-account configuration." />
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Location details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{location?.name}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Timezone</span>
              <span className="font-medium">{location?.timezone}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{location?.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Location ID</span>
              <span className="font-mono text-xs">{location?.id}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
