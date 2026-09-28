import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Waypoints } from "@/components/site/waypoints";
import { notFound, underConstruction } from "@/content/pages";

/** 404: the visitor landed on Null Island, the chart's "no data" coordinate. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60">
          <div className="map-layer map-grid" />
        </div>
        <div className="container-page grid min-h-[70svh] content-center gap-16 py-(--space-section) lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-24">
          <div className="grid justify-items-start gap-8">
            <p className="type-mono flex items-center gap-3 text-ink-muted">
              <span aria-hidden="true" className="size-3 rounded-full border-2 border-ink-muted" />
              {notFound.coords} · {notFound.status}
            </p>
            <h1 className="type-display max-w-[14ch]">{notFound.title}</h1>
            <p className="type-lead">{notFound.body}</p>
          </div>
          <Waypoints
            title={underConstruction.meanwhile}
            links={underConstruction.live}
            className="rounded-md bg-bg/85 p-6 shadow-[inset_0_0_0_1px_var(--line)] sm:p-8"
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
