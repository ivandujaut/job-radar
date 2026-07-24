"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/src/auth.ts";
import { loadSettings, saveSettings } from "@/src/settings.ts";

/**
 * Pause or resume a search source (an ATS board or the contact finder). Paused
 * sources stay connected but the engine skips them on its next run.
 */
export async function setSourceEnabled(key: string, enabled: boolean) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const settings = await loadSettings(session.userId);
  const disabled = new Set(settings.disabledSources);
  if (enabled) disabled.delete(key);
  else disabled.add(key);
  settings.disabledSources = [...disabled];

  await saveSettings(settings);
  revalidatePath("/integrations");
  revalidatePath("/");
}
