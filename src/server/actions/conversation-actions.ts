"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireLocation } from "@/lib/tenant";

export type SendState = { error?: string; ok?: boolean } | undefined;

const sendSchema = z.object({ body: z.string().min(1) });

export async function sendMessage(
  locationId: string,
  conversationId: string,
  _prev: SendState,
  formData: FormData,
): Promise<SendState> {
  const ctx = await requireLocation(locationId);

  const parsed = sendSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "Message cannot be empty" };

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, locationId },
    select: { channel: true },
  });
  if (!conversation) return { error: "Conversation not found" };

  await db.$transaction([
    db.message.create({
      data: {
        conversationId,
        direction: "OUTBOUND",
        channel: conversation.channel,
        body: parsed.data.body,
        senderUserId: ctx.userId,
        status: "SENT",
      },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), unreadCount: 0, status: "OPEN" },
    }),
  ]);

  revalidatePath(`/location/${locationId}/conversations/${conversationId}`);
  revalidatePath(`/location/${locationId}/conversations`);
  return { ok: true };
}

export async function setConversationStatus(
  locationId: string,
  conversationId: string,
  status: "OPEN" | "CLOSED" | "SNOOZED",
) {
  await requireLocation(locationId);
  await db.conversation.updateMany({
    where: { id: conversationId, locationId },
    data: { status },
  });
  revalidatePath(`/location/${locationId}/conversations/${conversationId}`);
  revalidatePath(`/location/${locationId}/conversations`);
}

export async function assignConversation(
  locationId: string,
  conversationId: string,
  userId: string | null,
) {
  await requireLocation(locationId);
  await db.conversation.updateMany({
    where: { id: conversationId, locationId },
    data: { assignedUserId: userId },
  });
  revalidatePath(`/location/${locationId}/conversations/${conversationId}`);
}

export async function markConversationRead(
  locationId: string,
  conversationId: string,
) {
  await requireLocation(locationId);
  await db.conversation.updateMany({
    where: { id: conversationId, locationId, unreadCount: { gt: 0 } },
    data: { unreadCount: 0 },
  });
  revalidatePath(`/location/${locationId}/conversations`);
}
