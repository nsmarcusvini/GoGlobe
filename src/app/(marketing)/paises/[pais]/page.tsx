import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalNotice } from "@/components/legal-notice";
import { JourneyMap } from "@/components/map/journey-map";
import type { RouteCode } from "@/components/map/routes";
import { ButtonLink } from "@/components/ui/button";
import { dossierCopy as t } from "@/content/dossier";
import { countryCopy } from "@/content/countries";
import { countryHref, listCountries, listPathways, pathwayHref } from "@/lib/data/content";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

const ROUTE_CODES = new Set(["AU", "NZ", "CA"]);

export async function generateStaticParams() {
  const db = createPublicClient();
  if (!db) return [];
  return (await listCountries(db)).map((c) => ({ pais: c.code.toLowerCase() }));
}

async function load(pais: string) {
  const db = createPublicClient();
  if (!db || !/^[a-z]{2}$/.test(pais)) return null;
  const [countries, pathways] = await Promise.all([
    listCountries(db),
    listPathways(db, { countryCode: pais }),
  ]);
  const country = countries.find((c) => c.code === pais.toUpperCase());
  return country ? { country, pathways } : null;
}

export async function generateMetadata({ params }: PageProps<"/paises/[pais]">): Promise<Metadata> {
  const { pais } = await params;
  const data = await load(pais);
  if (!data) return {};
  const copy = countryCopy[data.country.code];
  const title = `Vistos para ${data.country.name_pt}: caminhos e requisitos oficiais`;
  return {
    title,
    description: copy?.summary,
    alternates: { canonical: countryHref(data.country.code) },
    openGraph: { title, description: copy?.summary, url: countryHref(data.country.code) },
  };
}

export default async function CountryPage({ params }: PageProps<"/paises/[pais]">) {
  const { pais } = await params;
  const data = await load(pais);
  if (!data) notFound();
  const { country, pathways } = data;
  const copy = countryCopy[country.code];
  const categories = Object.keys(t.categories) as Array<keyof typeof t.categories>;

  return (
    <div className="container-page grid gap-16 py-12 lg:py-20">
      <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div className="grid gap-6">
          <nav aria-label="Trilha" className="type-mono flex gap-2 text-ink-muted">
            <Link href="/" className="link-route">
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <span>Países</span>
          </nav>
          <p className="type-mono flex items-center gap-3 text-ink-muted">
            <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">
              {country.code}
            </span>
            {copy?.authority}
          </p>
          <h1 className="type-mega">{country.name_pt}</h1>
          {copy && <p className="type-lead">{copy.summary}</p>}
          <a
            href={country.official_site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-inline w-fit font-semibold text-accent"
          >
            {country.official_site_url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
        {ROUTE_CODES.has(country.code) && (
          <JourneyMap
            routes={[{ code: country.code as RouteCode }]}
            className="rounded-md shadow-[inset_0_0_0_1px_var(--line)]"
          />
        )}
      </header>

      <section aria-labelledby="pathways-title" className="grid gap-10">
        <h2 id="pathways-title" className="type-title">
          {pathways.length} caminhos publicados
        </h2>
        {categories.map((category) => {
          const list = pathways.filter((p) => p.category === category);
          if (!list.length) return null;
          return (
            <div key={category} className="grid gap-2">
              <h3 className="type-eyebrow">{t.categories[category]}</h3>
              <ul>
                {list.map((p) => (
                  <li key={p.id} className="group relative border-b border-line">
                    <div className="grid gap-2 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8">
                      <div className="grid gap-1">
                        <Link
                          href={pathwayHref(p)}
                          className="text-lg font-semibold after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {p.name_pt}
                        </Link>
                        <span className="type-mono text-ink-muted">{p.official_name}</span>
                      </div>
                      <span className="type-mono flex items-center gap-4 text-ink-muted">
                        {p.requirements.length} requisitos
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 12"
                          className="h-3 w-6 text-route transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5"
                        >
                          <path
                            d="M0 6h22M17 1l5 5-5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 rounded-md bg-ink p-8 text-bg sm:p-12">
        <h2 className="type-display text-[clamp(2rem,1.2rem+3vw,3.5rem)]">{t.ctaTitle}</h2>
        <p className="max-w-[55ch] opacity-90">{t.ctaBody}</p>
        <div>
          <ButtonLink href="/app/onboarding" size="lg" arrow>
            {t.cta}
          </ButtonLink>
        </div>
      </section>
      <LegalNotice />
    </div>
  );
}
