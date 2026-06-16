import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/tenant";
import { accessibleAgencyIds } from "@/lib/rbac";

export async function getAgencyOverview() {
  const ctx = await getSessionContext();
  const agencyIds = accessibleAgencyIds(ctx.memberships);
  if (agencyIds.length === 0) return null;

  const agency = await db.agency.findFirst({
    where: { id: { in: agencyIds } },
  });
  if (!agency) return null;

  // Restrict to locations the user can actually see.
  const agencyWide = ctx.memberships.some(
    (m) => m.agencyId === agency.id && m.locationId === null,
  );
  const explicitIds = ctx.memberships
    .filter((m) => m.agencyId === agency.id && m.locationId)
    .map((m) => m.locationId as string);

  const locations = await db.location.findMany({
    where: agencyWide
      ? { agencyId: agency.id }
      : { id: { in: explicitIds } },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { contacts: true, opportunities: true, appointments: true },
      },
    },
  });

  const totalContacts = locations.reduce((s, l) => s + l._count.contacts, 0);

  return { agency, locations, totalContacts, canManage: agencyWide };
}
