import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  AssistantTicket,
  DestinationsBlock,
  TestsBlock,
  ToolsBlock,
  WorkBlock,
} from "@/components/base/base-blocks";
import { NextStopRoute } from "@/components/base/next-stop-route";
import { baseCopy as t } from "@/content/base";
import { aiEnabled } from "@/lib/ai/server";
import { getEntitlements } from "@/lib/billing/plan";
import { syncCheckoutSession } from "@/lib/billing/sync";
import { loadBase, profileProgress } from "@/lib/data/base";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Base" };

/** Subscriber home ("Próxima Parada"): what to do next, then everything around it. */
export default async function BasePage({ searchParams }: PageProps<"/app/base">) {
  const params = await searchParams;
  const { supabase, user, profile } = await requireUser("/app/base");

  // Back from Stripe Checkout: confirm now, then show the Base.
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;
  const paid =
    params.assinatura === "ok" && sessionId ? await syncCheckoutSession(sessionId, user.id) : null;

  if (!(await getEntitlements(supabase)).isPro && paid !== "pending") redirect("/app/painel");

  const base = await loadBase(supabase, profile);
  const progress = profileProgress(profile);

  return (
    <div className="grid gap-(--space-section)">
      <div className="grid gap-10">
        {paid && (
          <p
            role="status"
            className={
              paid === "active"
                ? "rounded-md border-l-2 border-route bg-(--status-meets-bg) p-5 font-medium"
                : "rounded-md border-l-2 border-(--status-info) bg-(--status-info-bg) p-5 font-medium"
            }
          >
            {t.paid[paid]}
          </p>
        )}
        <NextStopRoute
          route={base.route}
          profile={
            progress.missing.length ? { answered: progress.answered, total: progress.total } : null
          }
        />
      </div>

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <DestinationsBlock destinations={base.destinations} />
        </div>
        <div className="grid content-start gap-14 lg:col-span-5">
          <TestsBlock english={base.english} profile={profile} />
          <WorkBlock work={base.work} profile={profile} />
          {aiEnabled() && <AssistantTicket />}
        </div>
      </div>

      <ToolsBlock />
    </div>
  );
}
