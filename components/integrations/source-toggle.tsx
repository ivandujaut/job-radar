"use client";

import { useOptimistic, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setSourceEnabled } from "@/app/(app)/integrations/actions";
import { cn } from "@/lib/utils";

/**
 * Pause/resume a search source. Optimistic so the flip feels instant; the
 * server action persists it and revalidates, which settles the real state.
 */
export function SourceToggle({ sourceKey, enabled }: { sourceKey: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled);

  return (
    <label className="flex items-center gap-2">
      <span className={cn("text-xs", optimistic ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
        {optimistic ? "Activa" : "Pausada"}
      </span>
      <Switch
        checked={optimistic}
        disabled={pending}
        onCheckedChange={(next) =>
          startTransition(async () => {
            setOptimistic(next);
            await setSourceEnabled(sourceKey, next);
          })
        }
        aria-label={optimistic ? "Pausar esta fuente en las búsquedas" : "Activar esta fuente en las búsquedas"}
      />
    </label>
  );
}
