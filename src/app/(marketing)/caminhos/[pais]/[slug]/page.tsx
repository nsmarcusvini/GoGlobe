import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dossier } from "@/components/dossier/dossier";
import { ButtonLink } from "@/components/ui/button";
import { dossierCopy as t } from "@/content/dossier";
import { site } from "@/content/site";
import {
  countryHref,
  getExchangeRates,
  getPathwayDetail,
  listPathways,
  pathwayHref,
} from "@/lib/data/content";
import { createPublicClient } from "@/lib/supabase/public";

// Static pages from the database, revalidated hourly (ISR). New pathways are
// rendered on first request (dynamicParams defaults to true).
export const revalidate = 3600;

export async function generateStaticParams() {
  const db = createPublicClient();
  if (!db) return [];
  const pathways = await listPathways(db);
  return pathways.map((p) => ({ pais: p.country.code.toLowerCase(), slug: p.slug }));
}

async function load(pais: string, slug: string) {
  const db = createPublicClient();
  if (!db || !/^[a-z]{2}$/.test(pais)) return null;
  const [pathway, rates] = await Promise.all([
    getPathwayDetail(db, pais, slug),
    getExchangeRates(db),
  ]);
  return pathway ? { pathway, rates } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/caminhos/[pais]/[slug]">): Promise<Metadata> {
  const { pais, slug } = await params;
  const data = await load(pais, slug);
  if (!data) return {};
  const { pathway } = data;
  const title = `${pathway.name_pt}: requisitos, custos e etapas`;
  return {
    title,
    description: pathway.summary_pt,
    alternates: { canonical: pathwayHref(pathway) },
    openGraph: {
      title,
      description: pathway.summary_pt,
      type: "article",
      url: pathwayHref(pathway),
    },
  };
}

export default async function PublicPathwayPage({ params }: PageProps<"/caminhos/[pais]/[slug]">) {
  const { pais, slug } = await params;
  const data = await load(pais, slug);
  if (!data) notFound();
  const { pathway, rates } = data;

  const abs = (path: string) =>
    new URL(path, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: abs("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: pathway.country.name_pt,
        item: abs(countryHref(pathway.country.code)),
      },
      { "@type": "ListItem", position: 3, name: pathway.name_pt, item: abs(pathwayHref(pathway)) },
    ],
  };

  return (
    <div className="container-page py-12 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Dossier
        pathway={pathway}
        rates={rates}
        breadcrumb={
          <nav
            aria-label="Trilha"
            className="type-mono flex flex-wrap items-center gap-2 text-ink-muted"
          >
            <Link href="/" className="link-route">
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={countryHref(pathway.country.code)} className="link-route">
              {pathway.country.name_pt}
            </Link>
          </nav>
        }
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/app/onboarding" size="lg" arrow>
              {t.cta}
            </ButtonLink>
            <a
              href={pathway.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-inline font-semibold text-accent"
            >
              {t.officialPage}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
        }
        footer={
          <section className="grid gap-5 rounded-md bg-ink p-8 text-bg sm:p-12">
            <h2 className="type-display text-[clamp(2rem,1.2rem+3vw,3.5rem)]">{t.ctaTitle}</h2>
            <p className="max-w-[55ch] opacity-90">{t.ctaBody}</p>
            <div>
              <ButtonLink href="/app/onboarding" size="lg" arrow>
                {t.cta}
              </ButtonLink>
            </div>
          </section>
        }
      />
    </div>
  );
}
