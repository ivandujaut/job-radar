"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/src/auth.ts";
import { loadSettings, saveSettings } from "@/src/settings.ts";

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function completeProfileStep(formData: FormData) {
  const session = await requireUser();
  const settings = await loadSettings(session.userId);
  // The CV/rules content still lives in config/*.yaml for now; this step just
  // records that the user confirmed their profile during onboarding.
  settings.onboarding.profileComplete = true;
  settings.email = session.email;
  await saveSettings(settings);
  redirect("/onboarding?step=rules");
}

export async function completeRulesStep(formData: FormData) {
  const session = await requireUser();
  const settings = await loadSettings(session.userId);
  settings.onboarding.rulesComplete = true;
  await saveSettings(settings);
  redirect("/onboarding?step=connect");
}

export async function skipConnectStep() {
  await requireUser();
  redirect("/onboarding?step=autonomy");
}

export async function completeAutonomyStep(formData: FormData) {
  const session = await requireUser();
  const settings = await loadSettings(session.userId);
  const threshold = Number(formData.get("threshold"));
  const enabled = formData.get("autoApplyEnabled") === "on";
  const maxPerDay = Number(formData.get("maxPerDay"));

  if (!Number.isNaN(threshold)) settings.autonomy.autoApplyThreshold = clamp(threshold, 55, 100);
  settings.autonomy.autoApplyEnabled = enabled;
  if (!Number.isNaN(maxPerDay)) settings.autonomy.maxAutoAppliesPerDay = clamp(maxPerDay, 1, 50);
  settings.onboarding.autonomySet = true;
  await saveSettings(settings);
  revalidatePath("/");
  redirect("/");
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
