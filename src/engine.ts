import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { fetchGreenhouseJobs } from "./adapters/greenhouse.ts";
import { submitGreenhouseApplication, type Applicant } from "./apply/greenhouse.ts";
import { rankJob } from "./rank.ts";
import { loadSettings } from "./settings.ts";
import { loadQueue, log, upsert } from "./store.ts";
import { AUTO_APPLY_SOURCES, type Job, type QueueItem } from "./types.ts";

interface AtsConfig {
  greenhouse: { token: string; note?: string }[];
  lever: unknown[];
  ashby: unknown[];
  applicant: Applicant;
}

function atsConfig(): AtsConfig {
  return parse(readFileSync(join(process.cwd(), "config", "ats-boards.yaml"), "utf8")) as AtsConfig;
}

/** Auto-applies performed today, to enforce the daily cap. */
function autoAppliesToday(items: QueueItem[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter(
    (i) =>
      i.kind === "application" &&
      i.history.some((h) => h.event.startsWith("auto-applied") && h.at.slice(0, 10) === today)
  ).length;
}

export interface EngineRunResult {
  scanned: number;
  ranked: number;
  autoApplied: number;
  queued: number;
  discarded: number;
  skippedByCap: number;
  log: string[];
}

/**
 * One background pass: scan configured ATS boards, rank new jobs, and route
 * each by the user's autonomy settings.
 *  - score >= autoApplyThreshold  and auto-apply on and under daily cap -> apply
 *  - score >= reviewFloor                                              -> queue for review
 *  - otherwise                                                          -> discard
 *
 * `live` (default false) controls whether applications are actually submitted.
 * When false, submissions are dry-run: everything is decided and recorded, but
 * nothing is sent to a real company.
 */
export async function runEngine(
  userId: string,
  opts: { live?: boolean; maxPerRun?: number } = {}
): Promise<EngineRunResult> {
  const live = opts.live ?? false;
  const maxPerRun = opts.maxPerRun ?? 12;
  const settings = loadSettings(userId);
  const { autonomy } = settings;
  const cfg = atsConfig();
  const out: EngineRunResult = {
    scanned: 0,
    ranked: 0,
    autoApplied: 0,
    queued: 0,
    discarded: 0,
    skippedByCap: 0,
    log: [],
  };
  const say = (m: string) => {
    out.log.push(m);
    console.log(m);
  };

  // 1. Scan ATS boards for candidate jobs.
  const jobs: Job[] = [];
  for (const b of cfg.greenhouse) {
    try {
      const found = await fetchGreenhouseJobs(b.token);
      jobs.push(...found);
      say(`scan greenhouse:${b.token} -> ${found.length} vacantes`);
    } catch (e) {
      say(`scan greenhouse:${b.token} FALLO: ${(e as Error).message}`);
    }
  }
  out.scanned = jobs.length;

  // 2. Pre-filter by role keywords (cheap) before spending LLM calls, and
  //    dedup against the queue.
  const keywords = (parse(readFileSync(join(process.cwd(), "config", "rules.yaml"), "utf8")) as {
    search: { keywords: string[] };
  }).search.keywords.map((k) => k.toLowerCase());
  const matchesRole = (title: string) => {
    const t = title.toLowerCase();
    return keywords.some((k) => t.includes(k)) || t.includes("product");
  };
  const existing = new Set(loadQueue().map((i) => i.id));
  const allFresh = jobs.filter((j) => !existing.has(j.id) && matchesRole(j.title));
  const fresh = allFresh.slice(0, maxPerRun);
  say(`${allFresh.length} vacantes nuevas y relevantes tras filtro de rol + dedup`);
  if (allFresh.length > fresh.length) {
    say(`limite de ${maxPerRun} por corrida: ${allFresh.length - fresh.length} quedan para la proxima`);
  }

  let appliedThisRun = autoAppliesToday(loadQueue());
  const capRemaining = () => Math.max(0, autonomy.maxAutoAppliesPerDay - appliedThisRun);

  for (const job of fresh) {
    const ranking = await rankJob(job);
    out.ranked++;
    const item: QueueItem = { id: job.id, kind: "application", status: "pending_rank", job, ranking, history: [] };
    log(item, `ranked ${ranking.score}`);

    const canAutoApply =
      autonomy.autoApplyEnabled &&
      AUTO_APPLY_SOURCES.includes(job.source) &&
      ranking.score >= autonomy.autoApplyThreshold;

    if (canAutoApply && capRemaining() <= 0) {
      item.status = "pending_review";
      log(item, `auto-apply salteado: tope diario (${autonomy.maxAutoAppliesPerDay}) alcanzado -> pending_review`);
      out.skippedByCap++;
      upsert(item);
      say(`  [${ranking.score}] ${job.title} @ ${job.company}: tope alcanzado, a revision`);
      continue;
    }

    if (canAutoApply) {
      const result = await submitGreenhouseApplication(job, cfg.applicant, { dryRun: !live });
      if (result.ok) {
        item.status = "sent";
        appliedThisRun++;
        log(item, `auto-applied${result.dryRun ? " (dry-run)" : ""}: ${result.detail}`);
        out.autoApplied++;
        say(`  [${ranking.score}] ${job.title} @ ${job.company}: AUTO-APPLY${result.dryRun ? " (dry-run)" : ""}`);
      } else {
        item.status = "pending_review";
        log(item, `auto-apply fallo (${result.detail}) -> pending_review`);
        out.queued++;
        say(`  [${ranking.score}] ${job.title} @ ${job.company}: fallo apply, a revision`);
      }
    } else if (ranking.score >= autonomy.reviewFloor) {
      item.status = "pending_review";
      log(item, `-> pending_review`);
      out.queued++;
      say(`  [${ranking.score}] ${job.title} @ ${job.company}: a revision`);
    } else {
      item.status = "discarded";
      log(item, `${ranking.score} < ${autonomy.reviewFloor} -> discarded`);
      out.discarded++;
    }
    upsert(item);
  }

  say(
    `resumen: ${out.autoApplied} auto-apply${live ? "" : " (dry-run)"}, ${out.queued} a revision, ${out.discarded} descartadas, ${out.skippedByCap} frenadas por tope`
  );
  return out;
}
