import { HugeiconsIcon } from "@hugeicons/react";
import { FilterHorizontalIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { TONE_BAR } from "@/components/dashboard/tones";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/src/metrics.ts";

export function PipelineFunnel({
  funnel,
  exits,
  className,
}: {
  funnel: FunnelStage[];
  exits: { rejected: number; discarded: number };
  className?: string;
}) {
  return (
    <Card className={cn("gap-4", className)}>
      <div className="flex items-center gap-2 px-(--card-spacing)">
        <HugeiconsIcon icon={FilterHorizontalIcon} size={18} strokeWidth={1.8} aria-hidden className="text-muted-foreground" />
        <h3 className="font-medium">Embudo de pipeline</h3>
      </div>

      <div className="space-y-3 px-(--card-spacing)">
        {funnel.map((stage) => (
          <div key={stage.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{stage.label}</span>
              <span className="tabular-nums">
                <span className="font-mono font-medium text-foreground">{stage.count}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {Math.round(stage.ratio * 100)}%
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", TONE_BAR[stage.tone])}
                style={{ width: `${Math.max(stage.ratio * 100, stage.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-(--card-spacing) border-t pt-3 text-xs text-muted-foreground">
        Salidas: {exits.discarded} descartadas por score bajo · {exits.rejected} rechazadas por vos.
      </div>
    </Card>
  );
}
