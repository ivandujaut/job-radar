import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Time04Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { TONE_SOFT, TONE_TEXT } from "@/components/dashboard/tones";
import { cn } from "@/lib/utils";
import type { RecentEntry } from "@/src/metrics.ts";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function RecentActivity({
  items,
  className,
}: {
  items: RecentEntry[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-3", className)}>
      <div className="flex items-center justify-between px-(--card-spacing)">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Time04Icon} size={18} strokeWidth={1.8} aria-hidden className="text-muted-foreground" />
          <h3 className="font-medium">Actividad reciente</h3>
        </div>
        <Link href="/review?tab=history" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Ver historial
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="px-(--card-spacing) text-sm text-muted-foreground">Todavía no hay actividad.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-(--card-spacing) py-2.5">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg text-sm font-medium",
                  TONE_SOFT[it.tone],
                )}
                aria-hidden
              >
                {it.title.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.title}</p>
                <p className="truncate text-xs text-muted-foreground">{it.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("text-sm font-medium", TONE_TEXT[it.tone])}>{it.statusLabel}</p>
                <p className="text-xs text-muted-foreground">{shortDate(it.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
