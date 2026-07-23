/**
 * Local 24/7 scheduler: runs one engine pass, then sleeps and repeats. Use this
 * to run the background loop on your own machine without deploying to Vercel.
 *
 *   bun run scripts/scheduler.ts              # dry-run, every 6h
 *   INTERVAL_MIN=30 bun run scripts/scheduler.ts
 *   CRON_LIVE=true bun run scripts/scheduler.ts   # actually submit (guarded)
 *
 * Ctrl+C to stop.
 */
import { runScheduledPass } from "../src/engine.ts";

const intervalMin = Number(process.env.INTERVAL_MIN ?? 360);
const live = process.env.CRON_LIVE === "true";

async function tick() {
  const at = new Date().toISOString();
  console.log(`\n[${at}] corrida del scheduler (live=${live})`);
  try {
    const results = await runScheduledPass({ live });
    console.log(`[${at}] usuarios procesados:`, Object.keys(results).length);
  } catch (e) {
    console.error(`[${at}] la corrida fallo:`, (e as Error).message);
  }
}

console.log(`scheduler local arrancado: cada ${intervalMin} min, live=${live}`);
await tick();
setInterval(tick, intervalMin * 60_000);
