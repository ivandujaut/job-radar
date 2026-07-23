import { createHash } from "node:crypto";
import { fetchGuestDescription, searchGuestJobs, sleep } from "./adapters/linkedin-guest.ts";
import { loadHitsFile, searchPeopleHits } from "./adapters/people-search.ts";
import { rules, targets } from "./config.ts";
import { runEngine } from "./engine.ts";
import { draftNote, triagePeople } from "./people.ts";
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
      const existing = new Set((await loadQueue()).map((i) => i.id));
      let added = 0;
      for (const job of jobs) {
        if (existing.has(job.id)) continue;
        await sleep(2000 + Math.random() * 3000); // polite pacing between detail fetches
        job.description = await fetchGuestDescription(job.url);
        const item: QueueItem = { id: job.id, kind: "application", status: "pending_rank", job, history: [] };
        await upsert(log(item, `discovered via ${job.source}${job.description ? " (with description)" : " (title only)"}`));
        added++;
      }
      console.log(`${jobs.length} vacantes encontradas, ${added} nuevas en cola (pending_rank)`);
      break;
    }
    case "rank": {
      const r = rules();
      const all = args.includes("--all"); // re-rank discarded and pending_review too (e.g. after a profile update)
      const statuses = all ? ["pending_rank", "discarded", "pending_review"] : ["pending_rank"];
      const pending = (await loadQueue()).filter((i) => statuses.includes(i.status));
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
        await upsert(item);
        console.log(`  [${item.ranking.score}] ${item.job.title} @ ${item.job.company}`);
      }
      break;
    }
    case "engine": {
      // engine [userId] [--live] — one background auto-apply pass.
      // Without --live, applications are dry-run (nothing is sent to companies).
      const live = args.includes("--live");
      const userId = args.find((a) => !a.startsWith("--")) ?? "dujautivan";
      if (live) console.log("MODO LIVE: se enviaran aplicaciones reales.\n");
      await runEngine(userId, { live });
      break;
    }
    case "people": {
      // people [company] [--hits-file path] — discover hiring-relevant people
      // at target companies, draft connection notes, queue for review.
      const hitsFlag = args.indexOf("--hits-file");
      const hitsFile = hitsFlag >= 0 ? args[hitsFlag + 1] : undefined;
      const companyArg = args.find((a) => !a.startsWith("--") && a !== hitsFile);
      const all = targets().companies;
      const companies = companyArg
        ? all.filter((c) => c.name.toLowerCase() === companyArg.toLowerCase())
        : all;
      if (!companies.length) throw new Error(`empresa no encontrada en targets.yaml: ${companyArg}`);

      const existing = new Set((await loadQueue()).map((i) => i.id));
      for (const c of companies) {
        console.log(`\n${c.name}:`);
        const hits = hitsFile ? loadHitsFile(hitsFile) : await searchPeopleHits(c.name);
        console.log(`  ${hits.length} resultados de buscador`);
        const people = await triagePeople(c.name, c.why, hits);
        console.log(`  ${people.length} personas relevantes tras triage`);
        for (const p of people) {
          // A connection request needs an actual profile URL, not a press
          // article that mentions the person.
          if (!/linkedin\.com\/in\//.test(p.url)) {
            console.log(`  ~ ${p.name} (${p.role}): sin perfil de LinkedIn verificado, lead para busqueda posterior`);
            continue;
          }
          const id = createHash("sha1").update(p.url).digest("hex").slice(0, 10);
          if (existing.has(id)) continue;
          const draft = await draftNote(p);
          const item: QueueItem = {
            id,
            kind: "connection",
            status: "pending_review",
            person: { name: p.name, role: p.role, company: p.company, url: p.url },
            draft,
            history: [],
          };
          await upsert(log(item, `discovered (${p.relevance}) hook: ${p.hook}`));
          console.log(`  + ${p.name} (${p.role}) -> nota en cola`);
        }
        if (!hitsFile) await sleep(1500);
      }
      break;
    }
    case "rethreshold": {
      // Re-apply min_match_score to already-ranked items (both directions).
      const r = rules();
      const min = r.filters.min_match_score;
      let moved = 0;
      for (const item of await loadQueue()) {
        if (!item.ranking) continue;
        const target = item.ranking.score >= min ? "pending_review" : "discarded";
        if ((item.status === "discarded" || item.status === "pending_review") && item.status !== target) {
          item.status = target;
          await upsert(log(item, `rethreshold(${min}) -> ${target}`));
          moved++;
        }
      }
      console.log(`umbral ${min}: ${moved} items movidos`);
      break;
    }
    case "queue": {
      const items = (await loadQueue()).filter((i) => i.status === "pending_review");
      if (!items.length) {
        console.log("cola vacia");
        break;
      }
      for (const i of items) {
        if (i.kind === "connection" && i.person) {
          console.log(`\n■ ${i.id}  [connection] ${i.person.name}`);
          console.log(`  ${i.person.role} @ ${i.person.company}`);
          console.log(`  ${i.person.url}`);
          if (i.draft) console.log(`  nota (${i.draft.length} chars): "${i.draft}"`);
          continue;
        }
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
      const item = await findById(args[0] ?? "");
      if (!item) throw new Error(`no encontrado: ${args[0]}`);
      item.status = cmd === "approve" ? "approved" : "rejected";
      await upsert(log(item, cmd));
      console.log(`${item.id} -> ${item.status}`);
      break;
    }
    case "edit": {
      const item = await findById(args[0] ?? "");
      if (!item) throw new Error(`no encontrado: ${args[0]}`);
      item.draft = args.slice(1).join(" ");
      await upsert(log(item, "draft edited"));
      console.log(`${item.id} draft actualizado`);
      break;
    }
    default:
      console.log("uso: cli.ts <scan|rank|rethreshold|engine|people|queue|approve|reject|edit> [args]");
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
