"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AccessibleLocation } from "@/server/locations";

export function LocationSwitcher({
  locations,
  currentId,
}: {
  locations: AccessibleLocation[];
  currentId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const current = locations.find((l) => l.id === currentId);

  function switchTo(id: string) {
    // Preserve the active module segment when switching locations.
    const rest = pathname.replace(`/location/${currentId}`, "");
    router.push(`/location/${id}${rest}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-56 justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <Building className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{current?.name ?? "Select location"}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search locations…" />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {locations.map((loc) => (
                <CommandItem
                  key={loc.id}
                  value={loc.name}
                  onSelect={() => switchTo(loc.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      loc.id === currentId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {loc.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
