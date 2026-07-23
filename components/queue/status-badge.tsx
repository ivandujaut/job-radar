import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QueueStatus } from "@/src/types.ts";

const STATUS_META: Record<QueueStatus, { label: string; dot: string; text: string }> = {
  pending_rank: { label: "Sin rankear", dot: "bg-zinc-400", text: "text-muted-foreground" },
  pending_review: { label: "En revisión", dot: "bg-blue-400", text: "text-muted-foreground" },
  approved: { label: "Aprobado", dot: "bg-emerald-400", text: "text-emerald-400" },
  sent: { label: "Enviado", dot: "bg-violet-400", text: "text-violet-400" },
  rejected: { label: "Rechazado", dot: "bg-zinc-400", text: "text-muted-foreground" },
  discarded: { label: "Descartado", dot: "bg-zinc-400", text: "text-muted-foreground" },
};

/**
 * Outcome pill rendered *inside* a queue card header, so the status is grouped
 * with the item it belongs to (Gestalt: common region + proximity). The colored
 * dot lets the eye scan outcomes pre-attentively before reading the label.
 */
export function StatusBadge({ status }: { status: QueueStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className={meta.text}>{meta.label}</span>
    </Badge>
  );
}
