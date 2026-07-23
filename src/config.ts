import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const CONFIG_DIR = join(process.cwd(), "config");

function loadYaml<T>(name: string): T {
  return parse(readFileSync(join(CONFIG_DIR, name), "utf8")) as T;
}

export interface Rules {
  search: {
    keywords: string[];
    locations: string[];
    remote_ok: boolean;
    max_age_days: number;
  };
  filters: {
    min_match_score: number;
    seniority_exclude: string[];
    language_note: string;
  };
  queue: { max_pending: number };
  executor: {
    max_actions_per_day: number;
    max_connections_per_day: number;
    min_delay_minutes: number;
    max_delay_minutes: number;
  };
}

export const rules = () => loadYaml<Rules>("rules.yaml");
export const profile = () => readFileSync(join(CONFIG_DIR, "profile.yaml"), "utf8");
export const targets = () => loadYaml<{ companies: { name: string; url: string; why: string; linkedin: string }[] }>("targets.yaml");
