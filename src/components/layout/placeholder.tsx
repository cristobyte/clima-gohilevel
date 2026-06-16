import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function Placeholder({ note }: { note?: string }) {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Construction className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            {note ?? "This module is coming soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
