import { requireLocation } from "@/lib/tenant";
import { ModuleHeader } from "@/components/layout/module-header";
import { Placeholder } from "@/components/layout/placeholder";

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  return (
    <div>
      <ModuleHeader title="Conversations" />
      <Placeholder />
    </div>
  );
}
