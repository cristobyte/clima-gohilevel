import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { requireLocation } from "@/lib/tenant";
import { db } from "@/lib/db";
import {
  getConversation,
  listLocationUsers,
} from "@/server/conversations";
import { MessageThread } from "@/components/conversations/message-thread";
import { ConversationActions } from "@/components/conversations/conversation-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fullName, initials } from "@/lib/utils";

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ locationId: string; conversationId: string }>;
}) {
  const { locationId, conversationId } = await params;
  await requireLocation(locationId);

  const [conversation, users] = await Promise.all([
    getConversation(locationId, conversationId),
    listLocationUsers(locationId),
  ]);
  if (!conversation) notFound();

  // Clear unread on open (direct write — avoid revalidate during render).
  if (conversation.unreadCount > 0) {
    await db.conversation.updateMany({
      where: { id: conversationId, locationId },
      data: { unreadCount: 0 },
    });
  }

  const name = fullName(
    conversation.contact.firstName,
    conversation.contact.lastName,
  );

  return (
    <div className="flex h-full">
      {/* Thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b bg-background px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-muted text-xs">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <Badge variant="outline" className="text-[10px]">
                {conversation.channel}
              </Badge>
            </div>
          </div>
          <ConversationActions
            locationId={locationId}
            conversationId={conversation.id}
            status={conversation.status}
            assignedUserId={conversation.assignedUserId}
            users={users}
          />
        </div>

        <div className="min-h-0 flex-1">
          <MessageThread
            locationId={locationId}
            conversationId={conversation.id}
            messages={conversation.messages.map((m) => ({
              id: m.id,
              body: m.body,
              direction: m.direction,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>

      {/* Contact panel */}
      <aside className="hidden w-72 shrink-0 border-l bg-background p-4 lg:block">
        <div className="flex flex-col items-center gap-2 border-b pb-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-emerald-500 text-lg text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <p className="font-semibold">{name}</p>
          <Link
            href={`/location/${locationId}/contacts/${conversation.contactId}`}
            className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
          >
            View contact <ExternalLink className="size-3" />
          </Link>
        </div>
        <div className="space-y-3 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4" />
            {conversation.contact.email ?? "—"}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground size-4" />
            {conversation.contact.phone ?? "—"}
          </div>
          {conversation.contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {conversation.contact.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
