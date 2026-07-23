"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/src/auth.ts";
import { loadSettings, saveSettings } from "@/src/settings.ts";

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export async function updateAutonomy(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await loadSettings(session.userId);

  const threshold = Number(formData.get("threshold"));
  const reviewFloor = Number(formData.get("reviewFloor"));
  const maxPerDay = Number(formData.get("maxPerDay"));

  settings.autonomy.autoApplyEnabled = formData.get("autoApplyEnabled") === "on";
  if (!Number.isNaN(threshold)) settings.autonomy.autoApplyThreshold = clamp(threshold, 55, 100);
  if (!Number.isNaN(reviewFloor)) settings.autonomy.reviewFloor = clamp(reviewFloor, 30, 90);
  if (!Number.isNaN(maxPerDay)) settings.autonomy.maxAutoAppliesPerDay = clamp(maxPerDay, 1, 50);

  await saveSettings(settings);
  revalidatePath("/settings");
  revalidatePath("/");
}

/** Quick pause/resume used from the dashboard header. */
export async function toggleAutoApply() {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await loadSettings(session.userId);
  settings.autonomy.autoApplyEnabled = !settings.autonomy.autoApplyEnabled;
  await saveSettings(settings);
  revalidatePath("/");
  revalidatePath("/settings");
}
