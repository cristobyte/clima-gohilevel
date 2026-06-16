import { MessageSquare } from "lucide-react";

export default function ConversationsEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-6" />
      </div>
      <div>
        <p className="font-medium">Select a conversation</p>
        <p className="text-muted-foreground text-sm">
          Choose a thread from the list to start messaging.
        </p>
      </div>
    </div>
  );
}
