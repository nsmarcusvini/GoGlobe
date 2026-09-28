import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data/user";

/** /app: continue where the person left off. */
export default async function AppIndex() {
  const { profile } = await requireUser("/app");
  redirect(profile.onboarding_completed_at ? "/app/painel" : "/app/onboarding");
}
