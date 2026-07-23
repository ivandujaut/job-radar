"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { runEngineNow } from "@/app/(app)/run-actions";
import { Button } from "@/components/ui/button";

export function RunEngineButton({ label = "Buscar ahora" }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await runEngineNow();
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        })
      }
    >
      <HugeiconsIcon
        icon={pending ? Loading03Icon : Search01Icon}
        size={16}
        strokeWidth={1.8}
        className={pending ? "animate-spin" : ""}
        aria-hidden
      />
      {pending ? "Buscando..." : done ? "Listo" : label}
    </Button>
  );
}
