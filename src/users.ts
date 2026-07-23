import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** List all user ids that have a settings file. */
export function listUserIds(): string[] {
  const dir = join(process.cwd(), "data", "users");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}
