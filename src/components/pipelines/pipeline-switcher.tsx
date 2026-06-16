"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PipelineSwitcher({
  pipelines,
  currentId,
}: {
  pipelines: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      value={currentId}
      onValueChange={(v) => router.replace(`${pathname}?pipeline=${v}`)}
    >
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pipelines.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
