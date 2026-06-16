import { LocationSwitcher } from "./location-switcher";
import { CommandPalette } from "./command-palette";
import { UserMenu } from "./user-menu";
import type { AccessibleLocation } from "@/server/locations";

export function TopBar({
  locations,
  currentLocationId,
  userName,
  userEmail,
}: {
  locations: AccessibleLocation[];
  currentLocationId: string;
  userName: string | null;
  userEmail: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <LocationSwitcher locations={locations} currentId={currentLocationId} />
      </div>

      <div className="flex items-center gap-3">
        <CommandPalette locationId={currentLocationId} locations={locations} />
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
