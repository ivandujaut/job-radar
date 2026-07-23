import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dbEnabled, getDb } from "./db.ts";

const TABLE = "user_settings";

/**
 * Per-user product settings, written by the onboarding flow. This is the
 * web-app replacement for the single-user config/*.yaml files (which the CLI
 * still uses). One JSON per user; today there is a single "me" user until
 * real auth lands.
 */
export interface AutonomySettings {
  /** Auto-apply on ATS sources only when match score >= this. */
  autoApplyThreshold: number;
  /** Master switch for background auto-apply. */
  autoApplyEnabled: boolean;
  /** Below the threshold (but >= reviewFloor) items wait in the review queue. */
  reviewFloor: number;
  /** Connection notes ALWAYS require review; this is not configurable. */
  connectionNotesAlwaysReview: true;
  /** Daily caps, protecting the user from burning opportunities. */
  maxAutoAppliesPerDay: number;
}

export interface OnboardingState {
  profileComplete: boolean;
  rulesComplete: boolean;
  linkedinConnected: boolean; // via extension, phase 2 — false for now
  autonomySet: boolean;
}

export interface EngineRunSummary {
  at: string;
  autoApplied: number;
  queued: number;
  discarded: number;
  live: boolean;
}

export interface UserSettings {
  userId: string;
  email?: string;
  autonomy: AutonomySettings;
  onboarding: OnboardingState;
  /** Result of the most recent scheduler pass, shown on the dashboard. */
  lastRun?: EngineRunSummary;
  updatedAt: string;
}

export const DEFAULT_SETTINGS = (userId: string): UserSettings => ({
  userId,
  autonomy: {
    autoApplyThreshold: 80,
    autoApplyEnabled: false,
    reviewFloor: 55,
    connectionNotesAlwaysReview: true,
    maxAutoAppliesPerDay: 10,
  },
  onboarding: {
    profileComplete: false,
    rulesComplete: false,
    linkedinConnected: false,
    autonomySet: false,
  },
  updatedAt: new Date().toISOString(),
});

const fileFor = (userId: string) => join(process.cwd(), "data", "users", `${userId}.json`);

export async function loadSettings(userId: string): Promise<UserSettings> {
  if (!dbEnabled()) {
    const f = fileFor(userId);
    if (!existsSync(f)) return DEFAULT_SETTINGS(userId);
    return JSON.parse(readFileSync(f, "utf8")) as UserSettings;
  }
  const { data, error } = await getDb()
    .from(TABLE)
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`loadSettings: ${error.message}`);
  return (data?.settings as UserSettings) ?? DEFAULT_SETTINGS(userId);
}

export async function saveSettings(s: UserSettings): Promise<void> {
  s.updatedAt = new Date().toISOString();
  if (!dbEnabled()) {
    const f = fileFor(s.userId);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, JSON.stringify(s, null, 2));
    return;
  }
  const { error } = await getDb()
    .from(TABLE)
    .upsert({ user_id: s.userId, settings: s });
  if (error) throw new Error(`saveSettings: ${error.message}`);
}

export function onboardingComplete(s: UserSettings): boolean {
  const o = s.onboarding;
  // linkedinConnected is optional (phase 2), so it doesn't gate completion.
  return o.profileComplete && o.rulesComplete && o.autonomySet;
}
