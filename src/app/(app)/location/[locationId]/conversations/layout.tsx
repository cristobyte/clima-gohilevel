import { requireLocation } from "@/lib/tenant";
import { listConversations } from "@/server/conversations";
import { fullName } from "@/lib/utils";
import {
  ConversationList,
  type ConversationSummary,
} from "@/components/conversations/conversation-list";

export default async function ConversationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  await requireLocation(locationId);
  const conversations = await listConversations({ locationId });

  const summaries: ConversationSummary[] = conversations.map((c) => ({
    id: c.id,
    contactName: fullName(c.contact.firstName, c.contact.lastName),
    channel: c.channel,
    status: c.status,
    preview: c.messages[0]?.body ?? "No messages yet",
    lastMessageAt: c.lastMessageAt.toISOString(),
    unreadCount: c.unreadCount,
  }));

  return (
    <div className="flex h-full">
      <ConversationList locationId={locationId} conversations={summaries} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
