import { assistantCopy as t } from "@/content/assistant";

/**
 * "Fora da rota": an advice request cuts the trail. A road-sign plate with a
 * hazard band, the model's own decline, and who is licensed to help.
 */
export function Detour({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <section
      aria-label={t.detour.sign}
      data-testid="assistant-detour"
      className="relative grid overflow-hidden rounded-sm border-2 border-abissal bg-surface dark:border-glacial"
    >
      <div
        aria-hidden="true"
        className="h-3 bg-[repeating-linear-gradient(-45deg,var(--abissal)_0_10px,var(--glacial)_10px_20px)] motion-safe:animate-[hazard-slide_900ms_var(--ease-out-expo)_both]"
      />
      <div className="grid gap-6 p-5 sm:p-7 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:gap-10">
        <div className="grid content-start gap-3">
          <p className="type-eyebrow flex items-center gap-2 text-(--status-info)">
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path d="M8 1 15 8 8 15 1 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M5.5 8h5M8.5 6l2 2-2 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            {t.detour.sign}
          </p>
          <p className="type-title text-[clamp(1.4rem,1.1rem+1.2vw,2rem)]">{t.detour.title}</p>
          <p className="text-ink-muted">{t.detour.body}</p>
          {text && (
            <p
              className="border-l-2 border-line-strong pl-4 text-[1rem] leading-relaxed"
              aria-busy={streaming}
            >
              {text.replace(/\[\d{1,2}\]/g, "")}
            </p>
          )}
        </div>
        <div className="grid content-start gap-3">
          <p className="type-mono text-ink-muted">{t.detour.who}</p>
          <ul className="grid gap-3">
            {t.detour.professionals.map((p) => (
              <li key={p.country} className="grid gap-0.5 border-t border-line pt-3">
                <span className="type-mono text-accent">{p.country}</span>
                <span className="font-semibold">{p.role}</span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-inline w-fit text-[0.9375rem]"
                >
                  {p.registry} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
