"use client";

import { useState } from "react";
import { ApplicationCard } from "@/components/queue/application-card";
import { ConnectionCard } from "@/components/queue/connection-card";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "@/src/types.ts";

function Row({
  item,
  readonly,
  showStatus,
}: {
  item: QueueItem;
  readonly?: boolean;
  showStatus?: boolean;
}) {
  return item.kind === "connection" ? (
    <ConnectionCard item={item} readonly={readonly} showStatus={showStatus} />
  ) : (
    <ApplicationCard item={item} readonly={readonly} showStatus={showStatus} />
  );
}

/**
 * Paginated queue list. Renders `pageSize` collapsed cards at a time with a
 * "load more" control so the page never grows unbounded, regardless of how many
 * items are pending.
 */
export function QueueList({
  items,
  readonly,
  showStatus,
  pageSize = 6,
}: {
  items: QueueItem[];
  readonly?: boolean;
  showStatus?: boolean;
  pageSize?: number;
}) {
  const [visible, setVisible] = useState(pageSize);
  const shown = items.slice(0, visible);
  const remaining = items.length - shown.length;

  return (
    <div className="space-y-3">
      {shown.map((item) => (
        <Row
          key={item.id}
          item={item}
          readonly={readonly ?? item.status !== "pending_review"}
          showStatus={showStatus}
        />
      ))}
      {remaining > 0 && (
        <div className="flex justify-center pt-1">
          <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + pageSize)}>
            Cargar más ({remaining} {remaining === 1 ? "restante" : "restantes"})
          </Button>
        </div>
      )}
    </div>
  );
}
