"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/src/auth.ts";
import { runEngine } from "@/src/engine.ts";

/**
 * Trigger one engine pass for the signed-in user, from the UI. Always dry-run:
 * real application submission stays gated behind the scheduler's CRON_LIVE flag
 * and a per-board confirmation, never a dashboard button.
 */
export async function runEngineNow() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  await runEngine(session.userId, { live: false });
  revalidatePath("/");
}
