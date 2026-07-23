import {
  DashboardSquare01Icon,
  JobSearchIcon,
  UserGroupIcon,
  Time04Icon,
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
  { key: "review", label: "Revisión", href: "/?tab=review", icon: DashboardSquare01Icon, badge: "review" },
  { key: "applications", label: "Aplicaciones", href: "/?tab=applications", icon: JobSearchIcon },
  { key: "connections", label: "Conexiones", href: "/?tab=connections", icon: UserGroupIcon },
  { key: "history", label: "Historial", href: "/?tab=history", icon: Time04Icon },
];

export const OPTIONS: NavItem[] = [
  { key: "settings", label: "Ajustes", href: "/settings", icon: Settings01Icon },
];
