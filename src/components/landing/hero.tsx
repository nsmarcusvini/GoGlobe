import { ButtonLink } from "@/components/ui/button";
import { landing } from "@/content/landing";
import { RouteLedger } from "./route-ledger";

const { hero } = landing;

/**
 * The moment: a route leaves Brazil (bottom-left), crosses between the two lines
 * of the headline and exits top-right, echoing the arrow in the GoGlobe mark.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b border-line"
    >
      {/* Faint world chart bleeding off the right edge */}
      <div
        aria-hidden="true"
        className="absolute top-[8%] -right-[30%] -z-10 aspect-[1600/826] w-[150%] opacity-80 sm:-right-[18%] sm:w-[115%] lg:-right-[8%] lg:w-[90%]"
      >
        <div className="map-layer map-grid" />
        <div className="map-layer map-land" />
      </div>

      <div className="container-page grid min-h-[calc(100svh-4rem)] content-center gap-10 py-16 lg:gap-14 lg:py-24">
        <p className="type-eyebrow text-ink">{hero.eyebrow}</p>

        <div className="relative">
          <h1 id="hero-title" className="type-mega relative z-10 text-ink">
            <span className="block">{hero.titleTop}</span>
            <span className="block pl-[8vw] lg:pl-[14vw]">{hero.titleBottom}</span>
          </h1>

          {/* The route: drawn once on load, passing behind the headline. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-[10%] -bottom-[25%] z-0 h-[135%] w-[calc(100%+2*var(--gutter))] overflow-visible lg:-bottom-[12%] lg:h-[122%]"
          >
            <path
              d="M0 390 C 170 390, 250 300, 380 250 S 640 215, 760 160 S 930 40, 1000 0"
              fill="none"
              stroke="var(--route)"
              strokeOpacity="0.3"
              strokeWidth="1"
              strokeDasharray="3 6"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 390 C 170 390, 250 300, 380 250 S 640 215, 760 160 S 930 40, 1000 0"
              fill="none"
              stroke="var(--route)"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              vectorEffect="non-scaling-stroke"
              className="animate-[route-draw_2400ms_var(--ease-in-out-quart)_500ms_both]"
            />
          </svg>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16 xl:gap-24">
          <div className="grid gap-8">
            <p className="type-lead max-w-[46ch] text-ink">{hero.lead}</p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/app/onboarding" size="lg" arrow>
                {hero.primaryCta}
              </ButtonLink>
              <ButtonLink href="#como-funciona" size="lg" variant="secondary">
                {hero.secondaryCta}
              </ButtonLink>
            </div>
            <ul className="type-mono flex flex-wrap gap-x-5 gap-y-2 text-ink-muted">
              {hero.facts.map((fact) => (
                <li key={fact} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-px w-3 bg-route" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <RouteLedger className="animate-[fade-up_900ms_var(--ease-out-expo)_1400ms_both] lg:max-w-[34rem] lg:justify-self-end" />
        </div>
      </div>
    </section>
  );
}
