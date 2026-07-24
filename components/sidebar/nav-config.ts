import {
  DashboardSquare01Icon,
  InboxIcon,
  JobSearchIcon,
  UserGroupIcon,
  Time04Icon,
  PlugSocketIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Nav sections. The icons here are Hugeicons free "stroke rounded". To switch
 * to "bulk rounded" (a Hugeicons Pro style), install the pro package and swap
 * each imported constant for its `...BulkRoundedIcon` equivalent — the JSX
 * using them does not change.
 */
export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: typeof DashboardSquare01Icon;
  /** For counting badges: which queue metric to show, if any. */
  badge?: "review";
}

export const MENU: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: DashboardSquare01Icon },
  { key: "review", label: "Revisión", href: "/review?tab=review", icon: InboxIcon, badge: "review" },
  { key: "applications", label: "Aplicaciones", href: "/review?tab=applications", icon: JobSearchIcon },
  { key: "connections", label: "Conexiones", href: "/review?tab=connections", icon: UserGroupIcon },
  { key: "history", label: "Historial", href: "/review?tab=history", icon: Time04Icon },
  { key: "integrations", label: "Integraciones", href: "/integrations", icon: PlugSocketIcon },
];

export const OPTIONS: NavItem[] = [
  { key: "settings", label: "Ajustes", href: "/settings", icon: Settings01Icon },
];
