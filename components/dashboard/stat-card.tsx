import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "blue" | "green" | "violet" | "zinc";

const ACCENTS: Record<Accent, string> = {
  blue: "bg-blue-500/10 text-blue-400",
  green: "bg-emerald-500/10 text-emerald-400",
  violet: "bg-violet-500/10 text-violet-400",
  zinc: "bg-zinc-500/10 text-zinc-300",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "zinc",
  hint,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  accent?: Accent;
  hint?: string;
}) {
  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between px-(--card-spacing)">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", ACCENTS[accent])}>
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
