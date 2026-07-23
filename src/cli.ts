import { fetchGuestDescription, searchGuestJobs, sleep } from "./adapters/linkedin-guest.ts";
import { rules } from "./config.ts";
import { rankJob } from "./rank.ts";
import { findById, loadQueue, log, saveQueue, upsert } from "./store.ts";
import type { QueueItem } from "./types.ts";

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "scan": {
      const r = rules();
      const keywords = args[0] ?? r.search.keywords[0];
      const locFlag = args.indexOf("--location");
      const location = locFlag >= 0 ? args[locFlag + 1] : r.search.locations[0];
      console.log(`scan: "${keywords}" en ${location}`);
      const jobs = await searchGuestJobs(keywords, location);
      const existing = new Set(loadQueue().map((i) => i.id));
      let added = 0;
      for (const job of jobs) {
        if (existing.has(job.id)) continue;
        await sleep(2000 + Math.random() * 3000); // polite pacing between detail fetches
        job.description = await fetchGuestDescription(job.url);
        const item: QueueItem = { id: job.id, kind: "application", status: "pending_rank", job, history: [] };
        upsert(log(item, `discovered via ${job.source}${job.description ? " (with description)" : " (title only)"}`));
        added++;
      }
      console.log(`${jobs.length} vacantes encontradas, ${added} nuevas en cola (pending_rank)`);
      break;
    }
    case "rank": {
      const r = rules();
      const pending = loadQueue().filter((i) => i.status === "pending_rank");
      console.log(`rankeando ${pending.length} vacantes...`);
      for (const item of pending) {
        if (!item.job) continue;
        item.ranking = await rankJob(item.job);
        if (item.ranking.score >= r.filters.min_match_score) {
          item.status = "pending_review";
          log(item, `ranked ${item.ranking.score} -> pending_review`);
        } else {
          item.status = "discarded";
          log(item, `ranked ${item.ranking.score} < ${r.filters.min_match_score} -> discarded`);
        }
        upsert(item);
        console.log(`  [${item.ranking.score}] ${item.job.title} @ ${item.job.company}`);
      }
      break;
    }
    case "rethreshold": {
      // Re-apply min_match_score to already-ranked items (both directions).
      const r = rules();
      const min = r.filters.min_match_score;
      let moved = 0;
      for (const item of loadQueue()) {
        if (!item.ranking) continue;
        const target = item.ranking.score >= min ? "pending_review" : "discarded";
        if ((item.status === "discarded" || item.status === "pending_review") && item.status !== target) {
          item.status = target;
          upsert(log(item, `rethreshold(${min}) -> ${target}`));
          moved++;
        }
      }
      console.log(`umbral ${min}: ${moved} items movidos`);
      break;
    }
    case "queue": {
      const items = loadQueue().filter((i) => i.status === "pending_review");
      if (!items.length) {
        console.log("cola vacia");
        break;
      }
      for (const i of items) {
        console.log(`\n■ ${i.id}  [${i.ranking?.score ?? "-"}] ${i.kind}`);
        console.log(`  ${i.job?.title} @ ${i.job?.company} (${i.job?.location})`);
        console.log(`  ${i.job?.url}`);
        for (const reason of i.ranking?.reasons ?? []) console.log(`  + ${reason}`);
        for (const w of i.ranking?.warnings ?? []) console.log(`  ! ${w}`);
        if (i.draft) console.log(`  draft: ${i.draft}`);
      }
      break;
    }
    case "approve":
    case "reject": {
      const item = findById(args[0] ?? "");
      if (!item) throw new Error(`no encontrado: ${args[0]}`);
      item.status = cmd === "approve" ? "approved" : "rejected";
      upsert(log(item, cmd));
      console.log(`${item.id} -> ${item.status}`);
      break;
    }
    case "edit": {
      const item = findById(args[0] ?? "");
      if (!item) throw new Error(`no encontrado: ${args[0]}`);
      item.draft = args.slice(1).join(" ");
      upsert(log(item, "draft edited"));
      console.log(`${item.id} draft actualizado`);
      break;
    }
    default:
      console.log("uso: cli.ts <scan|rank|queue|approve|reject|edit> [args]");
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
