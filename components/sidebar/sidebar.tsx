"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RadarIcon,
  SidebarLeftIcon,
  SidebarRightIcon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { MENU, OPTIONS, type NavItem } from "./nav-config";

function Item({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        expanded ? "justify-start" : "justify-center",
        active
          ? "bg-primary text-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.8} aria-hidden />
      {expanded && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  activeTab,
  onSignOut,
}: {
  activeTab: string;
  onSignOut: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-all duration-200",
        expanded ? "w-60" : "w-16"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <div className={cn("flex items-center gap-2", !expanded && "justify-center")}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={RadarIcon} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          {expanded && <span className="font-semibold tracking-tight">job-radar</span>}
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Colapsar menú" : "Expandir menú"}
        >
          <HugeiconsIcon icon={expanded ? SidebarLeftIcon : SidebarRightIcon} size={20} aria-hidden />
        </button>
      </div>

      <nav className="flex flex-1 flex-col justify-between px-2 pb-4">
        <div className="flex flex-col gap-1">
          {expanded && (
            <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Menú</p>
          )}
          {MENU.map((item) => (
            <Item key={item.key} item={item} active={item.tab === activeTab} expanded={expanded} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {expanded && (
            <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
              Opciones
            </p>
          )}
          {OPTIONS.map((item) => (
            <Item key={item.key} item={item} active={false} expanded={expanded} />
          ))}
          <div className={cn("mt-1", !expanded && "flex justify-center")}>{onSignOut}</div>
        </div>
      </nav>
    </aside>
  );
}

export { Logout01Icon };
