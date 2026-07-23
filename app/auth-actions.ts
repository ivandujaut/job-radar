"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/src/auth.ts";
import { loadSettings, onboardingComplete, saveSettings } from "@/src/settings.ts";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) redirect("/login?error=email");
  await signIn(email);
  const settings = await loadSettings(emailToUserId(email));
  // Persist the user record on first login so later steps have a baseline.
  await saveSettings(settings);
  redirect(onboardingComplete(settings) ? "/" : "/onboarding");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

function emailToUserId(email: string): string {
  return email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "me";
}
