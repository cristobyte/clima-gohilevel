import type { Role } from "@prisma/client";
import type { MembershipClaim } from "@/lib/types";

export function isAgencyRole(role: Role) {
  return role === "AGENCY_ADMIN" || role === "AGENCY_USER";
}

export function isAdminRole(role: Role) {
  return role === "AGENCY_ADMIN" || role === "LOCATION_ADMIN";
}

/**
 * Resolve the effective role a user has for a given location.
 * Agency-level memberships grant access to every location within that agency.
 * Returns null if the user has no access to the location.
 */
export function roleForLocation(
  memberships: MembershipClaim[],
  agencyId: string,
  locationId: string,
): Role | null {
  // Exact location membership wins.
  const direct = memberships.find(
    (m) => m.locationId === locationId && m.agencyId === agencyId,
  );
  if (direct) return direct.role;

  // Agency-wide membership (locationId === null) grants access to all locations.
  const agencyWide = memberships.find(
    (m) => m.agencyId === agencyId && m.locationId === null,
  );
  return agencyWide?.role ?? null;
}

export function accessibleAgencyIds(memberships: MembershipClaim[]): string[] {
  return Array.from(new Set(memberships.map((m) => m.agencyId)));
}
