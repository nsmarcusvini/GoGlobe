import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { hasSupabaseConfig, publicEnv } from "@/lib/env";

/**
 * Cookie-less anonymous client for public content (ISR/static pages).
 * Sees exactly what RLS allows `anon`: published content only.
 * Returns null when Supabase is not configured (e.g. CI builds).
 */
export function createPublicClient() {
  if (!hasSupabaseConfig()) return null;
  const env = publicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
