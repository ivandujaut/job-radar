import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { dbEnabled, getDb } from "./db.ts";

/** List all user ids that have settings, dual-mode (Supabase or files). */
export async function listUserIds(): Promise<string[]> {
  if (!dbEnabled()) {
    const dir = join(process.cwd(), "data", "users");
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  }
  const { data, error } = await getDb().from("user_settings").select("user_id");
  if (error) throw new Error(`listUserIds: ${error.message}`);
  return (data ?? []).map((r) => r.user_id as string);
}
