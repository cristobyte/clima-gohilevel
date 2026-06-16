import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { roleForLocation } from "@/lib/rbac";
import type { MembershipClaim, TenantContext } from "@/lib/types";

export type SessionContext = {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  memberships: MembershipClaim[];
};

/** Returns the current session context or redirects to /login. */
export async function getSessionContext(): Promise<SessionContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return {
    userId: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    memberships: session.user.memberships ?? [],
  };
}

/**
 * Validate that the current user may access `locationId`.
 * Server-enforced tenancy: never trust the URL alone.
 * Returns a typed TenantContext, or 404s if there is no access.
 */
export async function requireLocation(
  locationId: string,
): Promise<TenantContext & { sessionUserId: string }> {
  const ctx = await getSessionContext();

  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { id: true, agencyId: true },
  });
  if (!location) notFound();

  const role = roleForLocation(ctx.memberships, location.agencyId, location.id);
  if (!role) notFound();

  return {
    userId: ctx.userId,
    sessionUserId: ctx.userId,
    agencyId: location.agencyId,
    locationId: location.id,
    role,
  };
}

/** First location the user can access, used for default redirects. */
export async function defaultLocationId(): Promise<string | null> {
  const ctx = await getSessionContext();
  const agencyIds = Array.from(new Set(ctx.memberships.map((m) => m.agencyId)));
  if (agencyIds.length === 0) return null;

  // Prefer an explicit location membership.
  const explicit = ctx.memberships.find((m) => m.locationId);
  if (explicit?.locationId) return explicit.locationId;

  // Otherwise pick the first location in an accessible agency.
  const location = await db.location.findFirst({
    where: { agencyId: { in: agencyIds } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return location?.id ?? null;
}
