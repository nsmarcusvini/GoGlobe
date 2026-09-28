import "server-only";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { getSession } from "@/lib/auth/session";

type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type UserPlan = Tables["user_plans"]["Row"];
export type ChecklistItem = Tables["checklist_items"]["Row"];

/**
 * Logged-in user + their profile. Redirects to sign-in when there is no session
 * (the proxy already does it optimistically; this is the real check).
 */
export async function requireUser(next = "/app/painel") {
  const { supabase, user } = await getSession();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error || !profile) throw new Error("Perfil não encontrado.");
  return { supabase, user, profile };
}

export type PlanWithProgress = UserPlan & {
  pathway: {
    slug: string;
    name_pt: string;
    version: number;
    country: { code: string; name_pt: string };
  };
  total: number;
  done: number;
  next: Pick<ChecklistItem, "id" | "title"> | null;
};

/** The user's followed pathways with checklist progress (RLS scopes to the user). */
export async function listMyPlans(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
): Promise<PlanWithProgress[]> {
  const { data, error } = await supabase
    .from("user_plans")
    .select(
      "*, pathway:pathways!inner(slug, name_pt, version, country:countries!inner(code, name_pt)), items:checklist_items(id, title, is_done, sort_order)",
    )
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ items: rawItems, ...rest }) => {
    const plan = rest;
    const items = [...(rawItems ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const next = items.find((i) => !i.is_done);
    return {
      ...rest,
      pathway: plan.pathway as unknown as PlanWithProgress["pathway"],
      total: items.length,
      done: items.filter((i) => i.is_done).length,
      next: next ? { id: next.id, title: next.title } : null,
    };
  });
}
