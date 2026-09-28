import { ButtonLink } from "@/components/ui/button";
import { landing } from "@/content/landing";

const { final } = landing;

/** The route comes back to where it started: you. */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-title"
      className="relative isolate overflow-hidden py-(--space-section)"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60">
        <div className="map-layer map-grid" />
      </div>
      <div className="container-page grid justify-items-start gap-10">
        <div className="type-mono flex items-center gap-3 text-ink-muted">
          <span className="size-3 rounded-full bg-route" />
          {final.coords} · você está aqui
        </div>
        <h2 id="final-title" className="type-mega max-w-[14ch]">
          {final.title}
        </h2>
        <ButtonLink href="/app/onboarding" size="lg" arrow>
          {final.cta}
        </ButtonLink>
      </div>
    </section>
  );
}
