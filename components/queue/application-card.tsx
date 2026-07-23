"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { approveItem, rejectItem } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QueueItem } from "@/src/types.ts";

function scoreVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 55) return "secondary";
  return "outline";
}

export function ApplicationCard({ item, readonly }: { item: QueueItem; readonly?: boolean }) {
  const [open, setOpen] = useState(false);
  const job = item.job;
  const ranking = item.ranking;
  if (!job) return null;

  const reasons = ranking?.reasons ?? [];
  const warnings = ranking?.warnings ?? [];
  const extraReasons = reasons.slice(1);
  const detailCount = extraReasons.length + warnings.length;

  return (
    <Card size="sm">
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">
            {job.title} <span className="text-muted-foreground">@ {job.company}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{job.location}</p>
        </div>
        {ranking && (
          <Badge variant={scoreVariant(ranking.score)} className="shrink-0 font-mono tabular-nums">
            {ranking.score}
          </Badge>
        )}
      </div>

      {reasons[0] && (
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            <span className="mr-1.5 text-foreground">+</span>
            {reasons[0]}
          </p>
        </CardContent>
      )}

      {open && detailCount > 0 && (
        <CardContent className="space-y-3 text-sm">
          {extraReasons.length > 0 && (
            <ul className="space-y-1">
              {extraReasons.map((r) => (
                <li key={r} className="text-muted-foreground">
                  <span className="mr-1.5 text-foreground">+</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <ul className="space-y-1 border-l-2 border-destructive/50 pl-3">
              {warnings.map((w) => (
                <li key={w} className="text-muted-foreground">
                  <span className="mr-1.5 text-destructive">!</span>
                  {w}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}

      <CardFooter className="justify-between gap-2">
        <div className="flex items-center gap-4">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver vacante
          </a>
          {detailCount > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {open ? "Ocultar" : `Ver detalles (${detailCount})`}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className={cn("transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          )}
        </div>
        {!readonly && (
          <div className="flex gap-2">
            <form action={rejectItem.bind(null, item.id)}>
              <Button variant="ghost" size="sm" type="submit">
                Rechazar
              </Button>
            </form>
            <form action={approveItem.bind(null, item.id)}>
              <Button size="sm" type="submit">
                Aprobar
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
