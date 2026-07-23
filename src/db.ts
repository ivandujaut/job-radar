import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase access, server-side only. When SUPABASE_URL and the service_role
 * key are set, the store and settings layers persist to Postgres; otherwise
 * they fall back to local files so the app runs in dev without a database.
 *
 * Lazy init: the client is created on first use, never at module load, so
 * `next build` does not crash before the env is provisioned.
 */
let _client: SupabaseClient | null = null;

export function dbEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getDb(): SupabaseClient {
  if (!dbEnabled()) throw new Error("Supabase no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  if (!_client) {
    // Dynamic import keeps @supabase out of bundles that never touch the DB.
    const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
    _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
