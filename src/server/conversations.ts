import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type ConversationFilter = {
  locationId: string;
  status?: "OPEN" | "CLOSED" | "SNOOZED";
  channel?: string;
};

export async function listConversations({
  locationId,
  status,
  channel,
}: ConversationFilter) {
  const where: Prisma.ConversationWhereInput = { locationId };
  if (status) where.status = status;
  if (channel) where.channel = channel as Prisma.ConversationWhereInput["channel"];

  return db.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getConversation(locationId: string, conversationId: string) {
  return db.conversation.findFirst({
    where: { id: conversationId, locationId },
    include: {
      contact: true,
      assignedUser: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listLocationUsers(locationId: string) {
  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { agencyId: true },
  });
  if (!location) return [];

  const memberships = await db.membership.findMany({
    where: {
      agencyId: location.agencyId,
      OR: [{ locationId }, { locationId: null }],
    },
    include: { user: { select: { id: true, name: true } } },
  });
  const seen = new Map<string, { id: string; name: string | null }>();
  for (const m of memberships) seen.set(m.user.id, m.user);
  return Array.from(seen.values());
}
