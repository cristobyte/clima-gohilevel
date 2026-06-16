"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type ConversationSummary = {
  id: string;
  contactName: string;
  channel: string;
  status: string;
  preview: string;
  lastMessageAt: string;
  unreadCount: number;
};

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "CLOSED", label: "Closed" },
];

export function ConversationList({
  locationId,
  conversations,
}: {
  locationId: string;
  conversations: ConversationSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const activeStatus = params.get("status") ?? "";

  function setStatus(status: string) {
    const next = new URLSearchParams(params.toString());
    if (status) next.set("status", status);
    else next.delete("status");
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const visible = activeStatus
    ? conversations.filter((c) => c.status === activeStatus)
    : conversations;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r bg-background">
      <div className="border-b p-3">
        <h2 className="mb-2 px-1 text-sm font-semibold">Conversations</h2>
        <div className="bg-muted flex gap-1 rounded-lg p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                activeStatus === t.key
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-muted-foreground p-4 text-center text-sm">
            No conversations.
          </p>
        )}
        {visible.map((c) => {
          const active = pathname.endsWith(`/conversations/${c.id}`);
          return (
            <Link
              key={c.id}
              href={`/location/${locationId}/conversations/${c.id}`}
              className={cn(
                "flex gap-3 border-b px-3 py-3 transition-colors",
                active ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-muted text-xs">
                  {initials(c.contactName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {c.contactName}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {formatDistanceToNow(new Date(c.lastMessageAt), {
                      addSuffix: false,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground truncate text-xs">
                    {c.preview}
                  </p>
                  {c.unreadCount > 0 && (
                    <Badge className="h-4 min-w-4 justify-center bg-emerald-500 px-1 text-[10px] text-white">
                      {c.unreadCount}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {c.channel}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
