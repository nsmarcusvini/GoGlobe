import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * LGPD data export: everything we store about the signed-in user, as JSON.
 * Uses the user's own session, so RLS limits the result to their rows.
 */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const [profile, plans, items, subscription] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_plans").select("*, pathway:pathways(slug, official_name, name_pt)"),
    supabase.from("checklist_items").select("*"),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, created_at")
      .maybeSingle(),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    plans: plans.data ?? [],
    checklist_items: items.data ?? [],
    subscription: subscription.data,
  };

  const date = body.exported_at.slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="goglobe-meus-dados-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
