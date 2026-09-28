import { Waypoints } from "@/components/site/waypoints";
import { ButtonLink } from "@/components/ui/button";
import { underConstruction } from "@/content/pages";

/**
 * Placeholder for routes built in later phases, so links never 404 meanwhile.
 * Says what the page will hold and points to what already exists.
 * TODO(phase): replace each usage with the real page.
 */
export function ComingSoon({
  title,
  phase,
  summary,
}: {
  title: string;
  phase: string;
  summary?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-50">
        <div className="map-layer map-grid" />
      </div>
      <div className="container-page grid min-h-[70svh] content-center gap-16 py-(--space-section) lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-24">
        <div className="grid justify-items-start gap-8">
          <p className="type-mono flex items-center gap-3 text-ink-muted">
            <span aria-hidden="true" className="size-3 rounded-full border-2 border-ink-muted" />
            {underConstruction.status} · {phase}
          </p>
          <h1 className="type-display max-w-[14ch]">{title}</h1>
          <p className="type-lead">
            {summary ?? "Esta parte do GoGlobe ainda está sendo traçada."}
          </p>
          <ButtonLink href="/" variant="secondary" arrow>
            {underConstruction.back}
          </ButtonLink>
        </div>

        <Waypoints
          title={underConstruction.meanwhile}
          links={underConstruction.live}
          pending={title}
          className="rounded-md bg-bg/85 p-6 shadow-[inset_0_0_0_1px_var(--line)] sm:p-8"
        />
      </div>
    </section>
  );
}
