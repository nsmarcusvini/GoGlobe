import { Reveal } from "@/components/reveal";
import { landing } from "@/content/landing";

const { honesty } = landing;

/**
 * The trust moment. The page inverts (ink becomes the background) to say, at
 * full volume, what the product does NOT do.
 */
export function Honesty() {
  return (
    <section
      aria-labelledby="honesty-title"
      className="relative isolate overflow-hidden bg-ink py-(--space-section) text-bg"
    >
      <div className="container-page grid gap-14">
        <p className="type-mono tracking-[0.14em] uppercase opacity-80">{honesty.eyebrow}</p>
        <h2 id="honesty-title" className="type-mega max-w-[12ch]">
          {honesty.title}
        </h2>

        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <ul className="grid gap-0">
            {honesty.points.map((point, i) => (
              <Reveal
                as="li"
                key={point}
                index={i}
                className="flex items-baseline gap-5 border-t border-current/20 py-6 last:border-b"
              >
                <span aria-hidden="true" className="type-mono shrink-0 opacity-70">
                  ✕ 0{i + 1}
                </span>
                <span className="type-title">{point}</span>
              </Reveal>
            ))}
          </ul>

          <div className="grid content-start gap-6">
            <p className="text-lead leading-relaxed opacity-90">{honesty.body}</p>
            <dl className="grid gap-px overflow-hidden rounded-md bg-current/20">
              {honesty.professionals.map((pro) => (
                <div
                  key={pro.title}
                  className="grid grid-cols-[7rem_1fr] items-baseline gap-4 bg-ink p-4"
                >
                  <dt className="type-mono opacity-80">{pro.country}</dt>
                  <dd>
                    <span className="font-display text-2xl font-bold tracking-tight">
                      {pro.title}
                    </span>{" "}
                    <span className="opacity-80">{pro.description}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
