"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { locationNav } from "./nav-config";

export function Sidebar({
  locationId,
  agencyName,
}: {
  locationId: string;
  agencyName: string;
}) {
  const pathname = usePathname();
  const base = `/location/${locationId}`;

  function isActive(segment: string) {
    const href = segment ? `${base}/${segment}` : base;
    if (segment === "") return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-zinc-950 text-zinc-300">
      <div className="flex h-14 items-center gap-2 px-4 text-white">
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
          <Zap className="size-4" />
        </span>
        <span className="text-base font-semibold">Clima</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {locationNav.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const active = isActive(item.segment);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <Link
          href="/agency"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <Building2 className="size-4" />
          <span className="truncate">{agencyName}</span>
        </Link>
      </div>
    </aside>
  );
}
