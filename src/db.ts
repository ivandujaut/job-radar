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

// The Vercel Supabase integration provisions NEXT_PUBLIC_SUPABASE_URL; a manual
// setup may use SUPABASE_URL. Accept either.
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function dbEnabled(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
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
