"use client";

import { useEffect, useOptimistic, useRef, useState, startTransition } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/server/actions/conversation-actions";

export type ThreadMessage = {
  id: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
};

export function MessageThread({
  locationId,
  conversationId,
  messages,
}: {
  locationId: string;
  conversationId: string;
  messages: ThreadMessage[];
}) {
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (state, next: ThreadMessage) => [...state, next],
  );
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimistic.length]);

  async function onSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    setValue("");
    startTransition(() => {
      addOptimistic({
        id: `tmp-${Date.now()}`,
        body,
        direction: "OUTBOUND",
        createdAt: new Date().toISOString(),
      });
    });
    const res = await sendMessage(locationId, conversationId, undefined, formData);
    if (res?.error) toast.error(res.error);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {optimistic.map((m) => {
          const outbound = m.direction === "OUTBOUND";
          return (
            <div
              key={m.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-3.5 py-2 text-sm",
                  outbound
                    ? "rounded-br-sm bg-emerald-500 text-white"
                    : "rounded-bl-sm bg-muted",
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    outbound ? "text-emerald-50/80" : "text-muted-foreground",
                  )}
                >
                  {format(new Date(m.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        action={onSubmit}
        className="flex items-end gap-2 border-t bg-background p-3"
      >
        <Textarea
          name="body"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          className="max-h-32 min-h-10 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" size="icon" className="shrink-0">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
