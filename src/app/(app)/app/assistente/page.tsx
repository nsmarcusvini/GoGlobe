import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logbook } from "@/components/assistant/logbook";
import { SealedLetter } from "@/components/assistant/sealed-letter";
import { ButtonLink } from "@/components/ui/button";
import { assistantCopy as t } from "@/content/assistant";
import { aiEnabled, assistantState } from "@/lib/ai/server";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = { title: "Assistente" };

export default async function AssistantPage() {
  if (!aiEnabled()) notFound();
  const { supabase } = await requireUser("/app/assistente");
  const state = await assistantState(supabase);

  return (
    <div className="grid gap-12">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.page.eyebrow}</p>
        <h1 className="type-display max-w-[12ch]">{t.page.title}</h1>
        <p className="type-lead">{t.page.lead}</p>
      </header>

      {!state.isPro ? (
        <div className="max-w-2xl">
          <SealedLetter />
        </div>
      ) : state.pathways.length === 0 ? (
        <section className="grid max-w-xl gap-4 border-l-2 border-dashed border-accent/60 pl-6">
          <h2 className="type-title">{t.noPlans.title}</h2>
          <p className="text-ink-muted">{t.noPlans.body}</p>
          <ButtonLink href="/app/resultados" arrow className="w-fit">
            {t.noPlans.cta}
          </ButtonLink>
        </section>
      ) : (
        <Logbook variant="page" used={state.used} quota={state.quota} pathways={state.pathways} />
      )}
    </div>
  );
}
