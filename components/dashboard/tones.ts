import type { Tone } from "@/src/metrics.ts";

/** Solid fill for bars and dots. Readable on both light and dark. */
export const TONE_BAR: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  zinc: "bg-zinc-300 dark:bg-zinc-700",
};

/** Soft tinted square/chip with a foreground that keeps contrast in both themes. */
export const TONE_SOFT: Record<Tone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  zinc: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

/** Foreground text tone. */
export const TONE_TEXT: Record<Tone, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  blue: "text-blue-600 dark:text-blue-400",
  zinc: "text-muted-foreground",
};
