import { ButtonLink } from "@/components/ui/button";
import { assistantCopy as t } from "@/content/assistant";

/** Free plan: the logbook, closed with a wax seal. */
export function SealedLetter() {
  return (
    <section
      aria-labelledby="sealed-title"
      className="relative grid gap-6 overflow-hidden rounded-sm border border-line bg-surface p-6 shadow-sm sm:p-9"
    >
      {/* Envelope flap: two hairlines meeting at the seal. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-28 w-full text-line-strong"
      >
        <path
          d="M0 0 L200 96 L400 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative mx-auto mt-10 grid size-24 place-items-center">
        <svg
          viewBox="0 0 96 96"
          aria-hidden="true"
          className="absolute inset-0 motion-safe:animate-[pin-drop_900ms_var(--ease-spring)_both]"
        >
          <path
            d="M48 4c6 0 8 5 13 6s11-2 15 2 1 10 3 15 7 8 7 13-5 8-6 13 2 11-2 15-10 1-15 3-8 7-13 7-8-5-13-6-11 2-15-2-1-10-3-15-7-8-7-13 5-8 6-13-2-11 2-15 10-1 15-3 8-7 13-7Z"
            fill="var(--route)"
          />
          <circle
            cx="48"
            cy="48"
            r="27"
            fill="none"
            stroke="var(--cta-ink)"
            strokeOpacity="0.5"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <path
            d="M30 58 C40 34 56 62 66 38"
            fill="none"
            stroke="var(--cta-ink)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="30" cy="58" r="3.2" fill="var(--cta-ink)" />
          <circle cx="66" cy="38" r="3.2" fill="var(--cta-ink)" />
        </svg>
      </div>
      <div className="relative grid justify-items-center gap-3 text-center">
        <p className="type-eyebrow">{t.sealed.eyebrow}</p>
        <h2 id="sealed-title" className="type-title">
          {t.sealed.title}
        </h2>
        <p className="max-w-[48ch] text-ink-muted">{t.sealed.body}</p>
        <ButtonLink href="/precos" arrow className="mt-2">
          {t.sealed.cta}
        </ButtonLink>
      </div>
    </section>
  );
}
