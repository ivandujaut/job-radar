"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Linkedin01Icon,
  Building06Icon,
  Globe02Icon,
  CpuIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ArrowUpRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkedInConnect } from "@/components/integrations/linkedin-connect";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationIcon, IntegrationStatus } from "@/src/integrations.ts";

const ICONS: Record<IntegrationIcon, React.ComponentProps<typeof HugeiconsIcon>["icon"]> = {
  linkedin: Linkedin01Icon,
  board: Building06Icon,
  search: Globe02Icon,
  ai: CpuIcon,
};

const STATUS_META: Record<IntegrationStatus, { label: string; className: string; dot: string }> = {
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
    label: "En camino",
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-zinc-400",
  },
};

export function IntegrationCard({ integration }: { integration: Integration }) {
  const status = STATUS_META[integration.status];

  return (
    <Card size="sm" className={cn("gap-3", integration.featured && "ring-2 ring-primary/25")}>
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
            <HugeiconsIcon icon={ICONS[integration.icon]} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              <span className="truncate">{integration.name}</span>
              {integration.featured && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <HugeiconsIcon icon={SparklesIcon} size={11} strokeWidth={2} aria-hidden />
                  Recomendado
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{integration.category}</p>
          </div>
        </div>
        {!integration.action && (
          <Badge variant="outline" className={cn("shrink-0 gap-1.5 font-normal", status.className)}>
            <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
            {status.label}
          </Badge>
        )}
      </div>

      <p className="px-(--card-spacing) text-sm text-muted-foreground">{integration.blurb}</p>

      <div className="flex min-h-8 items-center justify-between gap-2 px-(--card-spacing)">
        {integration.status === "connected" && integration.detail ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} aria-hidden />
            {integration.detail}
          </span>
        ) : integration.status === "soon" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={2} aria-hidden />
            En el roadmap
          </span>
        ) : (
          <span />
        )}

        {integration.action === "linkedin" && <LinkedInConnect />}
        {integration.action === "claude" && (
          <Button
            size="sm"
            onClick={() =>
              window.open(integration.href ?? "https://claude.ai/settings/connectors", "_blank", "noopener")
            }
          >
            {integration.cta ?? "Conectar"}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={2} aria-hidden />
          </Button>
        )}
      </div>
    </Card>
  );
}
