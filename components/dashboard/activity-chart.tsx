"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics01Icon } from "@hugeicons/core-free-icons";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityDay } from "@/src/metrics.ts";

const DISCOVERED = "#3b82f6"; // blue-500
const DECIDED = "#8b5cf6"; // violet-500

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

export function ActivityChart({ data, className }: { data: ActivityDay[]; className?: string }) {
  return (
    <Card className={cn("gap-4", className)}>
      <div className="flex items-center justify-between px-(--card-spacing)">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={1.8} aria-hidden className="text-muted-foreground" />
          <h3 className="font-medium">Actividad</h3>
          <span className="text-xs text-muted-foreground">últimos 30 días</span>
        </div>
        <div className="flex items-center gap-3">
          <LegendDot color={DISCOVERED} label="Descubiertas" />
          <LegendDot color={DECIDED} label="Decisiones" />
        </div>
      </div>

      <div className="h-56 w-full px-(--card-spacing)">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillDiscovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DISCOVERED} stopOpacity={0.35} />
                <stop offset="100%" stopColor={DISCOVERED} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillDecided" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DECIDED} stopOpacity={0.3} />
                <stop offset="100%" stopColor={DECIDED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={5}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="discovered"
              name="Descubiertas"
              stroke={DISCOVERED}
              strokeWidth={2}
              fill="url(#fillDiscovered)"
            />
            <Area
              type="monotone"
              dataKey="decided"
              name="Decisiones"
              stroke={DECIDED}
              strokeWidth={2}
              fill="url(#fillDecided)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
