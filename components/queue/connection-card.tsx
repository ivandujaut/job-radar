import { approveItem, rejectItem, saveDraft } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { QueueItem } from "@/src/types.ts";

export function ConnectionCard({ item, readonly }: { item: QueueItem; readonly?: boolean }) {
  const person = item.person;
  if (!person) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{person.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {person.role} @ {person.company}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          conexión
        </Badge>
      </CardHeader>
      <form>
        <CardContent className="space-y-2">
          <Textarea
            name="draft"
            defaultValue={item.draft ?? ""}
            maxLength={300}
            rows={4}
            readOnly={readonly}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {item.draft?.length ?? 0}/300 caracteres. La nota se envía junto con la solicitud de
            conexión.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <a
            href={person.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver perfil
          </a>
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
              <Button
                variant="secondary"
                size="sm"
                type="submit"
                formAction={saveDraft.bind(null, item.id)}
              >
                Guardar nota
              </Button>
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
