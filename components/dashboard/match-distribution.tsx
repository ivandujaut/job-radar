import { HugeiconsIcon } from "@hugeicons/react";
import { ChartHistogramIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { TONE_BAR, TONE_TEXT } from "@/components/dashboard/tones";
import { cn } from "@/lib/utils";
import type { DistributionBand } from "@/src/metrics.ts";

export function MatchDistribution({
  rankedTotal,
  bands,
  className,
}: {
  rankedTotal: number;
  bands: DistributionBand[];
  className?: string;
}) {
  const strong = bands.find((b) => b.key === "strong");

  return (
    <Card className={cn("gap-4", className)}>
      <div className="flex items-center gap-2 px-(--card-spacing)">
        <HugeiconsIcon icon={ChartHistogramIcon} size={18} strokeWidth={1.8} aria-hidden className="text-muted-foreground" />
        <h3 className="font-medium">Distribución de match</h3>
      </div>

      <div className="px-(--card-spacing)">
        <p className="font-mono text-3xl font-semibold tabular-nums">{strong?.count ?? 0}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          auto-aplicables de {rankedTotal} vacantes rankeadas
        </p>
      </div>

      {/* Stacked band bar */}
      <div className="px-(--card-spacing)">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {bands.map((b) =>
            b.count > 0 ? (
              <div
                key={b.key}
                className={cn("h-full", TONE_BAR[b.tone])}
                style={{ width: `${b.pct * 100}%` }}
                title={`${b.label}: ${b.count}`}
              />
            ) : null,
          )}
        </div>
      </div>

      <div className="space-y-2 px-(--card-spacing)">
        {bands.map((b) => (
          <div key={b.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", TONE_BAR[b.tone])} aria-hidden />
              <span className="text-muted-foreground">{b.label}</span>
              <span className="text-xs text-muted-foreground/70">{b.range}</span>
            </span>
            <span className={cn("font-mono tabular-nums", TONE_TEXT[b.tone])}>{b.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
