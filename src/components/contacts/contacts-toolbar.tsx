"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function ContactsToolbar({ tags }: { tags: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-64">
        <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
        <Input
          placeholder="Search contacts…"
          defaultValue={params.get("search") ?? ""}
          onChange={(e) => update("search", e.target.value || null)}
          className="pl-8"
        />
      </div>
      <Select
        value={params.get("tag") ?? ALL}
        onValueChange={(v) => update("tag", v === ALL ? null : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All tags" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All tags</SelectItem>
          {tags.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && (
        <span className="text-muted-foreground text-xs">Updating…</span>
      )}
    </div>
  );
}
