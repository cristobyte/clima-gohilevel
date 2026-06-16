import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/tenant";
import { accessibleAgencyIds } from "@/lib/rbac";

export type AccessibleLocation = {
  id: string;
  name: string;
  slug: string;
  agencyId: string;
};

/** All locations the current user can access, for the location switcher. */
export async function getAccessibleLocations(): Promise<AccessibleLocation[]> {
  const ctx = await getSessionContext();
  const agencyIds = accessibleAgencyIds(ctx.memberships);
  if (agencyIds.length === 0) return [];

  // Agency-level memberships → all locations in those agencies.
  const agencyWideAgencyIds = ctx.memberships
    .filter((m) => m.locationId === null)
    .map((m) => m.agencyId);
  // Location-level memberships → specific locations.
  const explicitLocationIds = ctx.memberships
    .filter((m) => m.locationId)
    .map((m) => m.locationId as string);

  const locations = await db.location.findMany({
    where: {
      OR: [
        { agencyId: { in: agencyWideAgencyIds } },
        { id: { in: explicitLocationIds } },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, agencyId: true },
  });
  return locations;
}

export async function getAgencyForUser() {
  const ctx = await getSessionContext();
  const agencyIds = accessibleAgencyIds(ctx.memberships);
  if (agencyIds.length === 0) return null;
  return db.agency.findFirst({
    where: { id: { in: agencyIds } },
    select: { id: true, name: true, slug: true },
  });
}
