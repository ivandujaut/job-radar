import { NextResponse, type NextRequest } from "next/server";
import { runScheduledPass } from "@/src/engine.ts";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // background pass can be slow (scan + LLM ranking)

/**
 * Scheduler endpoint. Vercel Cron calls this on a schedule; it also accepts a
 * manual trigger. Protected by CRON_SECRET so no one can run it (or spend LLM
 * tokens / submit applications) from the open internet.
 *
 * Applications are DRY-RUN unless CRON_LIVE=true is explicitly set in the
 * environment. Live submission of real applications is never the default.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const live = process.env.CRON_LIVE === "true";
  const results = await runScheduledPass({ live });
  return NextResponse.json({ ranAt: new Date().toISOString(), live, results });
}

export const GET = handle;
export const POST = handle;
