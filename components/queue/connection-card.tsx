"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { approveItem, rejectItem, saveDraft } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/queue/status-badge";
import { cn } from "@/lib/utils";
import type { QueueItem } from "@/src/types.ts";

export function ConnectionCard({
  item,
  readonly,
  showStatus,
}: {
  item: QueueItem;
  readonly?: boolean;
  showStatus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const person = item.person;
  if (!person) return null;

  const draft = item.draft ?? "";

  return (
    <Card size="sm">
      <div className="flex items-start justify-between gap-3 px-(--card-spacing)">
        <div className="min-w-0 space-y-1.5">
          <div className="space-y-0.5">
            <p className="truncate font-medium">{person.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {person.role} @ {person.company}
            </p>
          </div>
          {showStatus && <StatusBadge status={item.status} />}
        </div>
        <Badge variant="outline" className="shrink-0">
          conexión
        </Badge>
      </div>

      <form>
        {!open && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {draft || "Sin nota redactada."}
            </p>
          </CardContent>
        )}

        {open && (
          <CardContent className="space-y-2">
            <Textarea
              name="draft"
              defaultValue={draft}
              maxLength={300}
              rows={4}
              readOnly={readonly}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {draft.length}/300 caracteres. La nota se envía junto con la solicitud de conexión.
            </p>
          </CardContent>
        )}

        <CardFooter className="justify-between gap-2">
          <div className="flex items-center gap-4">
            <a
              href={person.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ver perfil
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {open ? "Ocultar" : readonly ? "Ver nota" : "Editar nota"}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                className={cn("transition-transform", open && "rotate-180")}
                aria-hidden
              />
            </button>
          </div>
          {!readonly && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                formAction={rejectItem.bind(null, item.id)}
              >
                Rechazar
              </Button>
              {open && (
                <Button
                  variant="secondary"
                  size="sm"
                  type="submit"
                  formAction={saveDraft.bind(null, item.id)}
                >
                  Guardar nota
                </Button>
              )}
              <Button size="sm" type="submit" formAction={approveItem.bind(null, item.id)}>
                Aprobar
              </Button>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
