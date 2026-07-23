import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@/components/ui/card";
import { TONE_SOFT } from "@/components/dashboard/tones";
import { cn } from "@/lib/utils";
import type { Tone } from "@/src/metrics.ts";

export function StatCard({
  label,
  value,
  icon,
  accent = "zinc",
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  accent?: Tone;
  hint?: string;
}) {
  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between px-(--card-spacing)">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", TONE_SOFT[accent])}>
          <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <div className="px-(--card-spacing)">
        <span className="font-mono text-3xl font-semibold tabular-nums">{value}</span>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
