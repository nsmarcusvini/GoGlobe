import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/ui/button";
import { landing } from "@/content/landing";

const { plans } = landing;

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 text-route">
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Plans() {
  return (
    <section aria-labelledby="plans-title" className="border-b border-line py-(--space-section)">
      <div className="container-page grid gap-14">
        <div className="grid gap-5 lg:max-w-[70%]">
          <p className="type-eyebrow">{plans.eyebrow}</p>
          <h2 id="plans-title" className="type-display">
            {plans.title}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:items-stretch">
          <Reveal className="grid content-start gap-6 rounded-md p-8 shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <h3 className="type-title">{plans.free.name}</h3>
            <ul className="grid gap-3">
              {plans.free.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            index={1}
            className="relative grid content-start gap-6 overflow-hidden rounded-md bg-surface p-8 shadow-[inset_0_0_0_1.5px_var(--route),var(--shadow-lift)] lg:-mt-8 lg:mb-8"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="type-title">{plans.pro.name}</h3>
              <span className="type-mono text-green-ink">Tudo do gratuito, e mais:</span>
            </div>
            <ul className="grid gap-3">
              {plans.pro.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div>
          <ButtonLink href="/precos" variant="secondary" size="lg" arrow>
            {plans.cta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
