import type { QueueItem, QueueStatus } from "./types.ts";

/**
 * Pure dashboard aggregations over the queue. No IO: callers load the queue and
 * settings, pass them in, and render the result. Everything here is computed
 * from real QueueItem data (status, ranking.score, history timestamps), so the
 * dashboard never shows numbers that are not backed by the store.
 */

export type Tone = "emerald" | "amber" | "violet" | "blue" | "zinc";

export interface MetricsInput {
  autoApplyThreshold: number;
  reviewFloor: number;
}

export interface Kpi {
  key: string;
  label: string;
  value: number;
  tone: Tone;
  hint?: string;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** Share of discovered items that reached this stage (0-1). */
  ratio: number;
  tone: Tone;
}

export interface DistributionBand {
  key: string;
  label: string;
  range: string;
  count: number;
  pct: number;
  tone: Tone;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "3 feb"
  discovered: number;
  decided: number;
}

export interface RecentEntry {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  tone: Tone;
  at: string;
  score?: number;
}

export interface Metrics {
  total: number;
  kpis: Kpi[];
  funnel: FunnelStage[];
  exits: { rejected: number; discarded: number };
  distribution: { rankedTotal: number; bands: DistributionBand[] };
  activity: ActivityDay[];
  recent: RecentEntry[];
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  pending_rank: "Sin rankear",
  pending_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  sent: "Enviada",
  discarded: "Descartada",
};

const STATUS_TONE: Record<QueueStatus, Tone> = {
  pending_rank: "zinc",
  pending_review: "blue",
  approved: "emerald",
  rejected: "zinc",
  sent: "violet",
  discarded: "zinc",
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function lastActivityAt(item: QueueItem): string {
  let latest = item.job?.discoveredAt ?? "";
  for (const h of item.history) if (h.at > latest) latest = h.at;
  return latest;
}

function titleFor(item: QueueItem): { title: string; subtitle: string } {
  if (item.kind === "connection" && item.person) {
    return { title: item.person.name, subtitle: `${item.person.role} · ${item.person.company}` };
  }
  if (item.job) return { title: item.job.title, subtitle: item.job.company };
  return { title: item.id.slice(0, 8), subtitle: "" };
}

export function computeMetrics(items: QueueItem[], input: MetricsInput): Metrics {
  const { autoApplyThreshold, reviewFloor } = input;
  const by = (s: QueueStatus) => items.filter((i) => i.status === s).length;

  const ranked = items.filter((i) => typeof i.ranking?.score === "number");
  const avgScore = ranked.length
    ? Math.round(ranked.reduce((a, i) => a + (i.ranking?.score ?? 0), 0) / ranked.length)
    : 0;

  const inPipeline = items.filter((i) =>
    ["pending_rank", "pending_review", "approved", "sent"].includes(i.status),
  ).length;
  const autoApplicable = ranked.filter((i) => (i.ranking?.score ?? 0) >= autoApplyThreshold).length;

  const kpis: Kpi[] = [
    {
      key: "pipeline",
      label: "En pipeline",
      value: inPipeline,
      tone: "blue",
      hint: ranked.length ? `Match promedio ${avgScore}` : undefined,
    },
    { key: "review", label: "En revisión", value: by("pending_review"), tone: "amber" },
    {
      key: "auto",
      label: "Auto-aplicables",
      value: autoApplicable,
      tone: "emerald",
      hint: `Match ${autoApplyThreshold}+`,
    },
    { key: "sent", label: "Enviadas", value: by("sent"), tone: "violet" },
  ];

  // Funnel: cumulative reach, monotonic decreasing. Discarded items are filtered
  // pre/at ranking, so they never count as having "reached review".
  const total = items.length;
  const reachedReview = items.filter((i) =>
    ["pending_review", "approved", "sent", "rejected"].includes(i.status),
  ).length;
  const approvedPlus = by("approved") + by("sent");
  const sent = by("sent");
  const denom = total || 1;
  const funnel: FunnelStage[] = [
    { key: "discovered", label: "Descubiertas", count: total, ratio: 1, tone: "zinc" },
    { key: "ranked", label: "Rankeadas", count: ranked.length, ratio: ranked.length / denom, tone: "blue" },
    { key: "review", label: "En revisión o más", count: reachedReview, ratio: reachedReview / denom, tone: "amber" },
    { key: "approved", label: "Aprobadas o más", count: approvedPlus, ratio: approvedPlus / denom, tone: "emerald" },
    { key: "sent", label: "Enviadas", count: sent, ratio: sent / denom, tone: "violet" },
  ];

  // Match distribution across ranked items, aligned to the color bands.
  const weak = ranked.filter((i) => (i.ranking?.score ?? 0) < reviewFloor).length;
  const mid = ranked.filter((i) => {
    const s = i.ranking?.score ?? 0;
    return s >= reviewFloor && s < autoApplyThreshold;
  }).length;
  const strong = autoApplicable;
  const rankedTotal = ranked.length || 1;
  const bands: DistributionBand[] = [
    { key: "strong", label: "Auto-aplicable", range: `${autoApplyThreshold}+`, count: strong, pct: strong / rankedTotal, tone: "emerald" },
    { key: "mid", label: "Encaje medio", range: `${reviewFloor}-${autoApplyThreshold - 1}`, count: mid, pct: mid / rankedTotal, tone: "amber" },
    { key: "weak", label: "Débil", range: `<${reviewFloor}`, count: weak, pct: weak / rankedTotal, tone: "zinc" },
  ];

  // Activity over the last 30 days: discovered (by discoveredAt) vs decided
  // (terminal-status items, by their last history timestamp).
  const days = 30;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const activity: ActivityDay[] = [];
  const index: Record<string, ActivityDay> = {};
  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const iso = day.toISOString().slice(0, 10);
    const entry: ActivityDay = {
      date: iso,
      label: `${day.getDate()} ${MONTHS[day.getMonth()]}`,
      discovered: 0,
      decided: 0,
    };
    activity.push(entry);
    index[iso] = entry;
  }
  const isTerminal = (s: QueueStatus) => ["approved", "rejected", "sent", "discarded"].includes(s);
  for (const item of items) {
    const discIso = (item.job?.discoveredAt ?? "").slice(0, 10);
    if (index[discIso]) index[discIso].discovered += 1;
    if (isTerminal(item.status)) {
      const decIso = lastActivityAt(item).slice(0, 10);
      if (index[decIso]) index[decIso].decided += 1;
    }
  }

  // Recent activity feed: latest items by last activity, most recent first.
  const recent: RecentEntry[] = [...items]
    .sort((a, b) => (lastActivityAt(a) < lastActivityAt(b) ? 1 : -1))
    .slice(0, 8)
    .map((item) => {
      const { title, subtitle } = titleFor(item);
      return {
        id: item.id,
        title,
        subtitle,
        statusLabel: STATUS_LABEL[item.status],
        tone: STATUS_TONE[item.status],
        at: lastActivityAt(item),
        score: item.ranking?.score,
      };
    });

  return {
    total,
    kpis,
    funnel,
    exits: { rejected: by("rejected"), discarded: by("discarded") },
    distribution: { rankedTotal: ranked.length, bands },
    activity,
    recent,
  };
}
