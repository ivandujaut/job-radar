"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

/**
 * Dark/light switch backed by next-themes. Renders a neutral placeholder until
 * mounted so the button never mismatches the server-rendered markup (theme is
 * only known on the client).
 */
export function ThemeToggle({ expanded }: { expanded?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={mounted ? `Cambiar a modo ${next === "dark" ? "oscuro" : "claro"}` : "Cambiar tema"}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        expanded ? "justify-start" : "justify-center",
      )}
    >
      <HugeiconsIcon
        icon={mounted && isDark ? Sun03Icon : Moon02Icon}
        size={20}
        strokeWidth={1.8}
        aria-hidden
      />
      {expanded && <span className="flex-1 text-left">{mounted && isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
