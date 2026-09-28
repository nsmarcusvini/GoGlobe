import type { Metadata } from "next";
import { Trace, type TraceData } from "@/components/about/trace";
import { ButtonLink } from "@/components/ui/button";
import { aboutCopy as t } from "@/content/about";
import { legalNotice } from "@/content/legal";
import { loadAbout, RECHECK_DAYS } from "@/lib/data/about";
import { parseRule } from "@/lib/eligibility";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Como o GoGlobe trabalha: ler a fonte oficial, resumir em português, carimbar a data e conferir de novo. Acompanhe um requisito real fazendo esse caminho.",
  alternates: { canonical: "/sobre" },
};

const day = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

export default async function AboutPage() {
  const { example, stats } = await loadAbout();

  let data: TraceData | null = null;
  if (example) {
    const parsed = parseRule(example.rule);
    const chips =
      parsed.ok && parsed.rule.op === "english_min"
        ? (parsed.rule.tests ?? []).map(
            (x) =>
              `${x.test} ${x.min_score.toLocaleString("pt-BR")} ${x.scope === "overall" ? "nota geral" : "em cada habilidade"}`,
          )
        : [];
    const recheck = new Date(example.verifiedAt);
    recheck.setUTCDate(recheck.getUTCDate() + RECHECK_DAYS);
    data = {
      pathway: example.pathway,
      countryCode: example.countryCode,
      host: new URL(example.sourceUrl).hostname.replace(/^www\./, ""),
      sourceUrl: example.sourceUrl,
      label: example.label,
      description: example.description,
      chips,
      excerpt: example.excerpt,
      readOn: example.fetchedAt ? day(example.fetchedAt) : null,
      verifiedOn: day(example.verifiedAt),
      recheckBy: day(recheck.toISOString()),
    };
  }

  const numbers = stats
    ? [
        { value: stats.pathways.toLocaleString("pt-BR"), label: t.stats.pathways },
        { value: stats.requirements.toLocaleString("pt-BR"), label: t.stats.requirements },
        { value: stats.sources.toLocaleString("pt-BR"), label: t.stats.sources },
        ...(stats.lastVerified
          ? [{ value: day(stats.lastVerified), label: t.stats.lastVerified }]
          : []),
      ]
    : [];

  return (
    <article className="container-page grid gap-(--space-section) py-16 lg:py-24">
      <header className="grid gap-6">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-mega max-w-[13ch] text-[clamp(2.75rem,1rem+6.5vw,7.5rem)]">
          {t.title}
        </h1>
        <p className="type-lead max-w-[56ch]">{t.lead}</p>
      </header>

      <Trace data={data} />

      {numbers.length > 0 && (
        <section aria-labelledby="numeros" className="grid gap-8">
          <h2 id="numeros" className="type-title">
            {t.stats.title}
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-md bg-line sm:grid-cols-2 lg:grid-cols-4">
            {numbers.map((n) => (
              <div key={n.label} className="grid gap-2 bg-surface p-6">
                <dt className="type-mono order-2 text-ink-muted">{n.label}</dt>
                <dd className="type-display order-1 text-[clamp(2.25rem,1.6rem+2vw,3.5rem)] tabular-nums">
                  {n.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section
        aria-labelledby="nunca"
        className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20"
      >
        <div className="grid content-start gap-6">
          <h2 id="nunca" className="type-title">
            {t.never.title}
          </h2>
          <ul className="grid gap-4">
            {t.never.items.map((item) => (
              <li key={item} className="flex gap-4 border-t border-line pt-4 text-[1.0625rem]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="mt-1.5 size-4 shrink-0 text-(--status-fails)"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path d="M4 12L12 4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <p className="max-w-[60ch] text-ink-muted">{t.never.professionals}</p>
        </div>
        <div className="grid content-start gap-6">
          <h2 className="type-title">{t.sourcesTitle}</h2>
          <ul className="grid gap-4">
            {legalNotice.page.sources.map((s) => (
              <li key={s.url} className="grid gap-1 border-t border-line pt-4">
                <span className="font-semibold">{s.label}</span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="type-mono link-inline w-fit text-accent"
                >
                  {new URL(s.url).hostname.replace(/^www\./, "")} ↗
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href="/#paises" arrow className="mt-4 w-fit">
            {t.cta}
          </ButtonLink>
        </div>
      </section>
    </article>
  );
}
