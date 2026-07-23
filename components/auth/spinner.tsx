import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" aria-hidden />
      Cargando...
    </div>
  );
}
