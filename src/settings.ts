import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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

export interface UserSettings {
  userId: string;
  email?: string;
  autonomy: AutonomySettings;
  onboarding: OnboardingState;
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

export function loadSettings(userId: string): UserSettings {
  const f = fileFor(userId);
  if (!existsSync(f)) return DEFAULT_SETTINGS(userId);
  return JSON.parse(readFileSync(f, "utf8")) as UserSettings;
}

export function saveSettings(s: UserSettings): void {
  const f = fileFor(s.userId);
  mkdirSync(dirname(f), { recursive: true });
  s.updatedAt = new Date().toISOString();
  writeFileSync(f, JSON.stringify(s, null, 2));
}

export function onboardingComplete(s: UserSettings): boolean {
  const o = s.onboarding;
  // linkedinConnected is optional (phase 2), so it doesn't gate completion.
  return o.profileComplete && o.rulesComplete && o.autonomySet;
}
