import type { Metadata } from "next";
import { DossierIndex } from "@/components/dossier/dossier-index";
import { privacyCopy as t } from "@/content/privacy";

export const metadata: Metadata = {
  title: t.title,
  description:
    "Quais dados o GoGlobe coleta, para quê, com quem compartilha e quais são os seus direitos (LGPD).",
  alternates: { canonical: "/privacidade" },
};

/** Pending facts ("[...]") are rendered visibly marked, never disguised as final text. */
function Paragraph({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className="max-w-[65ch] leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("[") ? (
          <mark
            key={i}
            className="type-mono rounded-xs bg-(--status-info-bg) px-1 text-(--status-info)"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export default function PrivacyPage() {
  return (
    <article className="container-page grid gap-16 py-12 lg:py-20">
      <header className="grid gap-5">
        <p className="type-eyebrow">{t.eyebrow}</p>
        <h1 className="type-mega max-w-[12ch] text-[clamp(2.75rem,1rem+6vw,7rem)]">{t.title}</h1>
        <p className="type-mono text-(--status-info)">{t.updated}</p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
        <aside className="max-lg:hidden lg:sticky lg:top-28 lg:self-start">
          <DossierIndex sections={t.sections.map((s) => ({ id: s.id, label: s.title }))} />
        </aside>
        <div className="grid gap-14">
          {t.sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="grid scroll-mt-28 gap-4"
            >
              <h2 id={`${section.id}-title`} className="flex items-baseline gap-4">
                <span className="type-mono text-green-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="type-title">{section.title}</span>
              </h2>
              {section.body.map((text) => (
                <Paragraph key={text} text={text} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
