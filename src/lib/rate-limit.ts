import "server-only";
import { headers } from "next/headers";
import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limit backed by Postgres (works across serverless instances).
 * Fails open if the database is unavailable: availability over strictness.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!hasSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: key.slice(0, 200),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    return error ? true : data !== false;
  } catch {
    return true;
  }
}

/** Best-effort client IP for rate-limit keys (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
