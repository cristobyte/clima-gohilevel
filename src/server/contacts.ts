import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

export type ContactListParams = {
  locationId: string;
  search?: string;
  tag?: string;
  page?: number;
};

export async function listContacts({
  locationId,
  search,
  tag,
  page = 1,
}: ContactListParams) {
  const where: Prisma.ContactWhereInput = { locationId };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (tag) where.tags = { has: tag };

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.contact.count({ where }),
  ]);

  return {
    contacts,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getContact(locationId: string, contactId: string) {
  return db.contact.findFirst({
    where: { id: contactId, locationId },
    include: {
      opportunities: {
        include: { stage: true, pipeline: true },
        orderBy: { updatedAt: "desc" },
      },
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      },
      appointments: {
        orderBy: { startTime: "desc" },
        include: { calendar: true },
        take: 10,
      },
    },
  });
}

/** Distinct tags used across this location's contacts, for filtering. */
export async function getContactTags(locationId: string): Promise<string[]> {
  const rows = await db.contact.findMany({
    where: { locationId },
    select: { tags: true },
  });
  const set = new Set<string>();
  for (const r of rows) for (const t of r.tags) set.add(t);
  return Array.from(set).sort();
}
