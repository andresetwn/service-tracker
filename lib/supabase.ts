/**
 * Server-only Supabase client.
 *
 * SECURITY (AGENTS.md section 34):
 * - This file is imported ONLY by server components / route handlers.
 * - It uses the SERVICE ROLE key, which bypasses RLS and is never shipped to
 *   the browser. Do not import this from client components. For client-side
 *   access, create a browser client with the anon key (not implemented here —
 *   all data access goes through server routes).
 * - Keys come exclusively from environment variables. Nothing is hardcoded.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabase client for server-side data access.
 * @throws if required environment variables are missing.
 */
export function getSupabaseServer(): ReturnType<typeof createClient<Database>> {
  if (cached) return cached;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ConfigError(
      "Konfigurasi Supabase belum lengkap. Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local"
    );
  }

  cached = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}

/**
 * True when both required Supabase environment variables are present.
 * Used by UI to render setup instructions instead of crashing.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && serviceRoleKey);
}

/** Configuration error surfaced to the user as a plain, non-technical message. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
