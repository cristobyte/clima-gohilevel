"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { locationNav } from "./nav-config";
import type { AccessibleLocation } from "@/server/locations";

export function CommandPalette({
  locationId,
  locations,
}: {
  locationId: string;
  locations: AccessibleLocation[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const base = `/location/${locationId}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:bg-muted hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors md:flex"
      >
        <Search className="size-4" />
        <span>Search…</span>
        <kbd className="bg-muted ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a module or switch location…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {locationNav.map((item) => {
              const Icon = item.icon;
              const href = item.segment ? `${base}/${item.segment}` : base;
              return (
                <CommandItem
                  key={item.label}
                  value={`go ${item.label}`}
                  onSelect={() => go(href)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Switch location">
            {locations.map((loc) => (
              <CommandItem
                key={loc.id}
                value={`location ${loc.name}`}
                onSelect={() => go(`/location/${loc.id}`)}
              >
                {loc.name}
              </CommandItem>
            ))}
            <CommandItem value="agency dashboard" onSelect={() => go("/agency")}>
              Agency dashboard
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
