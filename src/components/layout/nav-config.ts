import {
  LayoutDashboard,
  MessageSquare,
  Users,
  KanbanSquare,
  Calendar,
  Workflow,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  segment: string; // appended to /location/[id]
  icon: LucideIcon;
};

/** Module navigation inside a location workspace. */
export const locationNav: NavItem[] = [
  { label: "Dashboard", segment: "", icon: LayoutDashboard },
  { label: "Conversations", segment: "conversations", icon: MessageSquare },
  { label: "Contacts", segment: "contacts", icon: Users },
  { label: "Opportunities", segment: "opportunities", icon: KanbanSquare },
  { label: "Calendars", segment: "calendars", icon: Calendar },
  { label: "Automation", segment: "automation", icon: Workflow },
  { label: "Settings", segment: "settings", icon: Settings },
];
