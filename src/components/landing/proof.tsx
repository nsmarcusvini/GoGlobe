import { Reveal } from "@/components/reveal";
import { SourceBlock } from "@/components/ui/source-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { landing } from "@/content/landing";

const { proof } = landing;

// Illustrative only: the "verified" date is the day this example UI was written.
const EXAMPLE_VERIFIED_AT = "2026-09-28T00:00:00Z";

export function Proof() {
  return (
    <section aria-labelledby="proof-title" className="border-b border-line py-(--space-section)">
      <div className="container-page grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="grid content-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <p className="type-eyebrow">{proof.eyebrow}</p>
          <h2 id="proof-title" className="type-display">
            {proof.title}
          </h2>
          <p className="type-lead">{proof.body}</p>
        </div>

        <Reveal className="relative">
          {/* Rubber stamp: this table is an illustration, not real data. */}
          <div
            aria-hidden="true"
            className="type-mono pointer-events-none absolute -top-4 right-5 z-10 rotate-[-6deg] rounded-sm border-2 border-(--status-fails) bg-bg px-3 py-1.5 text-[0.75rem] font-semibold tracking-[0.2em] text-(--status-fails) uppercase shadow-sm"
          >
            {proof.stamp}
          </div>
          <figure className="relative overflow-hidden rounded-md bg-surface shadow-[inset_0_0_0_1px_var(--line),var(--shadow-md)]">
            <div className="type-mono border-b border-line px-5 py-3 text-ink-muted">
              Requisitos · caminho de exemplo · {proof.rows.length} itens
            </div>
            <ul>
              {proof.rows.map((row) => (
                <li
                  key={row.label}
                  className="grid gap-3 border-b border-line px-5 py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
                >
                  <div className="grid gap-2">
                    <span className="font-semibold">{row.label}</span>
                    <SourceBlock url={proof.exampleSource} verifiedAt={EXAMPLE_VERIFIED_AT} />
                  </div>
                  <StatusBadge
                    status={row.status}
                    className="justify-self-start sm:justify-self-end"
                  />
                </li>
              ))}
            </ul>

            <figcaption className="border-t border-line bg-surface-sunk px-5 py-3 text-[0.875rem] text-ink-muted">
              {proof.exampleNote}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
