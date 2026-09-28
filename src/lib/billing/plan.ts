import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Entitlements = { isPro: boolean };

/** The signed-in user's plan. The database (is_pro + triggers) is the source of truth. */
export async function getEntitlements(supabase: SupabaseClient<Database>): Promise<Entitlements> {
  const { data } = await supabase.rpc("is_pro", {});
  return { isPro: data === true };
}
