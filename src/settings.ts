import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dbEnabled, getDb, isSchemaMissing, markDbUnavailable } from "./db.ts";

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

/** What the user entered during onboarding (or later in settings). */
export interface Profile {
  headline: string; // e.g. "Product Engineer pivoteando a Producto"
  roles: string; // comma-separated target roles
  locations: string; // comma-separated
  englishNote: string; // honest level, mirrored into drafts
}

export interface UserSettings {
  userId: string;
  email?: string;
  profile: Profile;
  autonomy: AutonomySettings;
  onboarding: OnboardingState;
  /** Result of the most recent scheduler pass, shown on the dashboard. */
  lastRun?: EngineRunSummary;
  updatedAt: string;
}

export const DEFAULT_SETTINGS = (userId: string): UserSettings => ({
  userId,
  profile: { headline: "", roles: "", locations: "", englishNote: "" },
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

/** Backfill fields added after a user record was first written. */
function normalize(s: UserSettings): UserSettings {
  const d = DEFAULT_SETTINGS(s.userId);
  return { ...d, ...s, profile: { ...d.profile, ...s.profile }, autonomy: { ...d.autonomy, ...s.autonomy } };
}

function fileLoadSettings(userId: string): UserSettings {
  const f = fileFor(userId);
  if (!existsSync(f)) return DEFAULT_SETTINGS(userId);
  return normalize(JSON.parse(readFileSync(f, "utf8")) as UserSettings);
}

function fileSaveSettings(s: UserSettings): void {
  const f = fileFor(s.userId);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(s, null, 2));
}

export async function loadSettings(userId: string): Promise<UserSettings> {
  if (!dbEnabled()) return fileLoadSettings(userId);
  const { data, error } = await getDb()
    .from(TABLE)
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    if (isSchemaMissing(error)) {
      markDbUnavailable(error.message);
      return fileLoadSettings(userId);
    }
    throw new Error(`loadSettings: ${error.message}`);
  }
  return data?.settings ? normalize(data.settings as UserSettings) : DEFAULT_SETTINGS(userId);
}

export async function saveSettings(s: UserSettings): Promise<void> {
  s.updatedAt = new Date().toISOString();
  if (!dbEnabled()) return fileSaveSettings(s);
  const { error } = await getDb().from(TABLE).upsert({ user_id: s.userId, settings: s });
  if (error) {
    if (isSchemaMissing(error)) {
      markDbUnavailable(error.message);
      return fileSaveSettings(s);
    }
    throw new Error(`saveSettings: ${error.message}`);
  }
}

export function onboardingComplete(s: UserSettings): boolean {
  const o = s.onboarding;
  // linkedinConnected is optional (phase 2), so it doesn't gate completion.
  return o.profileComplete && o.rulesComplete && o.autonomySet;
}
