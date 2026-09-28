import { redirect } from "next/navigation";
import { getEntitlements } from "@/lib/billing/plan";
import { requireUser } from "@/lib/data/user";

/** /app: continue where the person left off. Pro members land on their Base. */
export default async function AppIndex() {
  const { supabase, profile } = await requireUser("/app");
  if (!profile.onboarding_completed_at) redirect("/app/onboarding");
  redirect((await getEntitlements(supabase)).isPro ? "/app/base" : "/app/painel");
}
