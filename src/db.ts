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

// Runtime kill-switch: if Supabase is configured but not yet migrated (tables
// missing), we flip this and fall back to files for the rest of the process so
// the app keeps working during setup instead of 500ing.
let _unavailable = false;

// The Vercel Supabase integration provisions NEXT_PUBLIC_SUPABASE_URL; a manual
// setup may use SUPABASE_URL. Accept either.
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function dbEnabled(): boolean {
  if (_unavailable) return false;
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** True when the error means the schema has not been created yet. */
export function isSchemaMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const m = (error.message ?? "").toLowerCase();
  return error.code === "PGRST205" || m.includes("could not find the table") || m.includes("does not exist");
}

/** Disable the DB for the rest of this process and log why, once. */
export function markDbUnavailable(reason: string): void {
  if (!_unavailable) {
    _unavailable = true;
    console.warn(`[db] Supabase configurado pero sin migrar (${reason}). Usando archivos. Corre supabase/schema.sql.`);
  }
}

export function getDb(): SupabaseClient {
  if (!dbEnabled())
    throw new Error(
      "Supabase no configurado (faltan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)"
    );
  if (!_client) {
    const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
    _client = createClient(supabaseUrl()!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
