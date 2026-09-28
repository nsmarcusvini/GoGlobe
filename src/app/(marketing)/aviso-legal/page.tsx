import type { Metadata } from "next";
import { legalNotice } from "@/content/legal";

const { page } = legalNotice;

export const metadata: Metadata = {
  title: page.title,
  description: legalNotice.short,
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return (
    <article className="container-page grid gap-14 py-(--space-section) lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
      <header className="grid content-start gap-5 lg:sticky lg:top-28 lg:self-start">
        <p className="type-eyebrow">Legal</p>
        <h1 className="type-display">{page.title}</h1>
        <p className="type-mono text-ink-muted">Leia antes de usar os resultados.</p>
      </header>

      <div className="grid gap-12">
        <div className="grid max-w-(--measure) gap-6 text-lg leading-relaxed">
          {page.paragraphs.map((text, i) => (
            <p key={text} className={i === 1 ? "font-semibold text-ink" : "text-ink"}>
              {text}
            </p>
          ))}
        </div>

        <section aria-labelledby="sources-title" className="grid gap-4 border-t border-line pt-8">
          <h2 id="sources-title" className="type-eyebrow">
            {page.sourcesTitle}
          </h2>
          <ul className="grid gap-px overflow-hidden rounded-md bg-line">
            {page.sources.map((source) => (
              <li key={source.url} className="bg-surface">
                <a
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="group flex items-center justify-between gap-4 p-5 font-semibold transition-colors duration-300 hover:bg-surface-sunk"
                >
                  <span>{source.label}</span>
                  <span className="type-mono shrink-0 text-accent">
                    {new URL(source.url).hostname.replace(/^www\./, "")} ↗
                  </span>
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
