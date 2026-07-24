"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Linkedin01Icon,
  Building06Icon,
  Globe02Icon,
  CpuIcon,
  Database01Icon,
  UserCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationIcon, IntegrationStatus } from "@/src/integrations.ts";

const ICONS: Record<IntegrationIcon, React.ComponentProps<typeof HugeiconsIcon>["icon"]> = {
  linkedin: Linkedin01Icon,
  board: Building06Icon,
  search: Globe02Icon,
  ai: CpuIcon,
  db: Database01Icon,
  auth: UserCircleIcon,
};

const STATUS_META: Record<
  IntegrationStatus,
  { label: string; className: string; dot: string }
> = {
  connected: {
    label: "Conectado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  available: {
    label: "Disponible",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  soon: {
    label: "Próximamente",
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-zinc-400",
  },
};

export function IntegrationCard({ integration }: { integration: Integration }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_META[integration.status];
  const hasSteps = Boolean(integration.steps?.length);

  return (
    <Card size="sm" className="gap-3">
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            <HugeiconsIcon icon={ICONS[integration.icon]} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{integration.name}</p>
            <p className="truncate text-xs text-muted-foreground">{integration.category}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 gap-1.5 font-normal", status.className)}>
          <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
          {status.label}
        </Badge>
      </div>

      <p className="px-(--card-spacing) text-sm text-muted-foreground">{integration.description}</p>

      <div className="flex items-center justify-between gap-2 px-(--card-spacing)">
        {integration.status === "connected" && integration.detail ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden />
            {integration.detail}
          </span>
        ) : integration.status === "soon" && !hasSteps ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={2} aria-hidden />
            En el roadmap
          </span>
        ) : (
          <span />
        )}

        {hasSteps && (
          <Button
            variant={integration.status === "available" ? "default" : "outline"}
            size="sm"
            onClick={() => setOpen((o) => !o)}
          >
            {integration.status === "available" ? "Conectar" : "Ver cómo"}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              className={cn("transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </Button>
        )}
      </div>

      {open && hasSteps && (
        <ol className="mx-(--card-spacing) space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          {integration.steps!.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-background text-xs font-medium text-foreground tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
