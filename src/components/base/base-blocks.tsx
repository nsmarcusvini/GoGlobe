import Link from "next/link";
import { SourceBlock } from "@/components/ui/source-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressRoute } from "@/components/ui/progress-route";
import { baseCopy as t } from "@/content/base";
import type { Destination, SourcedRequirement } from "@/lib/data/base";
import type { Profile } from "@/lib/data/user";
import { parseRule } from "@/lib/eligibility";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
const score = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function BlockTitle({ n, children, id }: { n: string; children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="flex items-baseline gap-3">
      <span className="type-mono text-green-ink">{n}</span>
      <span className="type-title text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)]">{children}</span>
    </h2>
  );
}

function PathwayTag({ code, name }: { code: string; name: string }) {
  return (
    <p className="type-mono flex flex-wrap items-center gap-2 text-ink-muted">
      <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">{code}</span>
      {name}
    </p>
  );
}

export function DestinationsBlock({ destinations }: { destinations: Destination[] }) {
  return (
    <section aria-labelledby="destinos" className="grid content-start gap-6">
      <BlockTitle n="01" id="destinos">
        {t.destinations.title}
      </BlockTitle>
      {destinations.length === 0 && <p className="text-ink-muted">{t.destinations.none}</p>}
      <ul className="grid gap-4">
        {destinations.map((d) => (
          <li
            key={d.code}
            className="grid gap-5 rounded-md border border-line bg-surface p-5 shadow-sm sm:p-7"
          >
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <p className="type-display text-[clamp(2.25rem,1.4rem+3vw,3.75rem)]">{d.name}</p>
              <p className="type-mono text-ink-muted">
                {d.brlRate !== null && t.destinations.rate(d.currency, brl(d.brlRate))}
              </p>
            </div>
            {d.plans.length === 0 ? (
              <p className="text-ink-muted">
                {t.destinations.noPlan}{" "}
                <Link href="/app/resultados" className="link-inline font-semibold">
                  {t.destinations.explore}
                </Link>
              </p>
            ) : (
              <ul className="grid gap-4">
                {d.plans.map((p) => (
                  <li key={p.id} className="grid gap-2 border-t border-line pt-4">
                    <Link href={`/app/planos/${p.id}`} className="link-route w-fit font-semibold">
                      {p.name}
                    </Link>
                    <ProgressRoute value={p.done} max={Math.max(p.total, 1)} className="max-w-md" />
                    {p.next && (
                      <p className="text-[0.9375rem] text-ink-muted">
                        <span className="type-mono text-green-ink">{t.destinations.next}:</span>{" "}
                        {p.next}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <a
              href={d.officialSite}
              target="_blank"
              rel="noopener noreferrer"
              className="type-mono link-inline w-fit text-accent"
            >
              {t.destinations.official} ↗<span className="sr-only"> (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TestsBlock({
  english,
  profile,
}: {
  english: SourcedRequirement[];
  profile: Profile;
}) {
  const yours = profile.english_test
    ? `${profile.english_test} · ${t.tests.overall} ${profile.english_score !== null ? score(Number(profile.english_score)) : "—"} · menor habilidade ${profile.english_lowest_component !== null ? score(Number(profile.english_lowest_component)) : "—"}`
    : t.tests.noTest;
  return (
    <section aria-labelledby="provas" className="grid content-start gap-5">
      <BlockTitle n="02" id="provas">
        {t.tests.title}
      </BlockTitle>
      <p className="text-ink-muted">{t.tests.lead}</p>
      <p className="type-mono rounded-sm bg-surface-sunk px-3 py-2">
        <span className="text-ink-muted">{t.tests.yours}:</span> {yours}
      </p>
      {english.length === 0 && <p className="text-ink-muted">{t.tests.none}</p>}
      <ul className="grid gap-4">
        {english.map((req) => {
          const parsed = parseRule(req.rule);
          const tests =
            parsed.ok && parsed.rule.op === "english_min" ? (parsed.rule.tests ?? []) : [];
          return (
            <li
              key={`${req.pathwaySlug}-${req.label}`}
              className="grid gap-3 border-t border-line pt-4"
            >
              <PathwayTag code={req.countryCode} name={req.pathway} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{req.label}</p>
                <StatusBadge status={req.status} />
              </div>
              {tests.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {tests.map((test) => (
                    <li
                      key={test.test}
                      className={
                        test.test === profile.english_test
                          ? "type-mono rounded-xs border border-route px-2 py-1 text-green-ink"
                          : "type-mono rounded-xs border border-line-strong px-2 py-1"
                      }
                    >
                      {test.test} {score(test.min_score)}{" "}
                      <span className="text-ink-muted">
                        {test.scope === "overall" ? t.tests.overall : t.tests.each}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.9375rem] text-ink-muted">{req.reason || t.tests.manual}</p>
              )}
              <SourceBlock url={req.sourceUrl} verifiedAt={req.verifiedAt} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function WorkBlock({ work, profile }: { work: SourcedRequirement[]; profile: Profile }) {
  return (
    <section aria-labelledby="trabalho" className="grid content-start gap-5">
      <BlockTitle n="03" id="trabalho">
        {t.work.title}
      </BlockTitle>
      <p className="text-ink-muted">{t.work.lead}</p>
      <p className="type-mono rounded-sm bg-surface-sunk px-3 py-2">
        <span className="text-ink-muted">{t.work.yours}:</span>{" "}
        {profile.occupation_text ?? t.work.missing}
        {profile.years_experience !== null &&
          ` · ${t.work.years(Number(profile.years_experience))}`}
      </p>
      {work.length === 0 && <p className="text-ink-muted">{t.work.none}</p>}
      <ul className="grid gap-4">
        {work.map((req) => (
          <li
            key={`${req.pathwaySlug}-${req.label}`}
            className="grid gap-2 border-t border-line pt-4"
          >
            <PathwayTag code={req.countryCode} name={req.pathway} />
            <p className="font-semibold">{req.label}</p>
            {req.reason && <p className="text-[0.9375rem] text-ink-muted">{req.reason}</p>}
            <SourceBlock url={req.sourceUrl} verifiedAt={req.verifiedAt} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ToolsBlock() {
  return (
    <section aria-labelledby="ferramentas" className="grid gap-6 border-t border-line pt-10">
      <BlockTitle n="04" id="ferramentas">
        {t.tools.title}
      </BlockTitle>
      <ul className="grid gap-px overflow-hidden rounded-md bg-line sm:grid-cols-2 lg:grid-cols-4">
        {t.tools.items.map((item) => (
          <li key={item.href} className="bg-surface">
            <Link
              href={item.href}
              className="group grid h-full gap-2 p-5 transition-colors duration-300 ease-out-expo hover:bg-surface-sunk"
            >
              <span className="flex items-center justify-between gap-3 font-semibold">
                {item.label}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
              <span className="text-[0.9375rem] text-ink-muted">{item.body}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-[0.9375rem] text-ink-muted">{t.tools.planTools}</p>
    </section>
  );
}

/** The assistant as a boarding ticket: perforated edge, one action. */
export function AssistantTicket() {
  return (
    <Link
      href="/app/assistente"
      className="group relative grid gap-3 overflow-hidden rounded-md bg-abissal p-6 text-glacial shadow-md transition-transform duration-500 ease-out-expo hover:-translate-y-0.5 dark:bg-surface dark:text-ink dark:shadow-[inset_0_0_0_1px_var(--line-strong)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-16 border-l-2 border-dashed border-current opacity-25"
      />
      <span className="type-mono text-[0.75rem] tracking-[0.14em] uppercase opacity-80">
        {t.assistant.eyebrow}
      </span>
      <span className="type-title max-w-[14ch] pr-16 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">
        {t.assistant.title}
      </span>
      <span className="max-w-[36ch] pr-16 text-[0.9375rem] opacity-85">{t.assistant.body}</span>
      <span className="font-semibold text-(--route-on-dark)">
        {t.assistant.cta}{" "}
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
}
