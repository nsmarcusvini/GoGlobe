import { Reveal } from "@/components/reveal";
import { StatusBadge } from "@/components/ui/status-badge";
import { landing } from "@/content/landing";
import { REQUIREMENT_STATUSES } from "@/lib/eligibility";

const { how } = landing;

/** Three waypoints on one route line (horizontal on desktop, vertical on mobile). */
export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="border-b border-line py-(--space-section)"
    >
      <div className="container-page grid gap-16 lg:gap-24">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <p className="type-eyebrow">{how.eyebrow}</p>
          <h2 id="how-title" className="type-display lg:text-right">
            {how.title}
          </h2>
        </div>

        <ol className="relative grid gap-14 lg:grid-cols-3 lg:gap-10">
          {/* The route line */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[5px] w-px bg-linear-to-b from-route via-route to-line-strong lg:top-[5px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto lg:bg-linear-to-r"
          />
          {how.steps.map((step, i) => (
            <Reveal
              as="li"
              key={step.index}
              index={i}
              className="relative grid content-start gap-5 pl-10 lg:pt-12 lg:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-0 size-3 rounded-full border-2 border-route bg-bg lg:top-0"
              />
              <span className="type-mono font-semibold text-green-ink">{step.index}</span>
              <h3 className="type-title">{step.title}</h3>
              <p className="max-w-[38ch] text-ink-muted">{step.body}</p>
              {i === 1 && (
                <ul className="flex flex-wrap gap-2" aria-label="Status possíveis de um requisito">
                  {REQUIREMENT_STATUSES.map((status) => (
                    <li key={status}>
                      <StatusBadge status={status} />
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
