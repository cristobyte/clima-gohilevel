import type { Role } from "@prisma/client";

export type MembershipClaim = {
  agencyId: string;
  locationId: string | null;
  role: Role;
};

export type TenantContext = {
  userId: string;
  agencyId: string;
  locationId: string;
  role: Role;
};
