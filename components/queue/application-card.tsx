import { approveItem, rejectItem } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QueueItem } from "@/src/types.ts";

function scoreVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 55) return "secondary";
  return "outline";
}

export function ApplicationCard({ item, readonly }: { item: QueueItem; readonly?: boolean }) {
  const job = item.job;
  const ranking = item.ranking;
  if (!job) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {job.title} <span className="text-muted-foreground">@ {job.company}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{job.location}</p>
        </div>
        {ranking && (
          <Badge variant={scoreVariant(ranking.score)} className="shrink-0 font-mono">
            {ranking.score}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {ranking && ranking.reasons.length > 0 && (
          <ul className="space-y-1">
            {ranking.reasons.map((r) => (
              <li key={r} className="text-muted-foreground">
                <span className="mr-1.5 text-foreground">+</span>
                {r}
              </li>
            ))}
          </ul>
        )}
        {ranking && ranking.warnings.length > 0 && (
          <ul className="space-y-1 border-l-2 border-destructive/50 pl-3">
            {ranking.warnings.map((w) => (
              <li key={w} className="text-muted-foreground">
                <span className="mr-1.5 text-destructive">!</span>
                {w}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver vacante
        </a>
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
