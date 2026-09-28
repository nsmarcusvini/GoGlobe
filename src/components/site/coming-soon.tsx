import { ButtonLink } from "@/components/ui/button";

/**
 * Placeholder for routes built in later phases, so links never 404 meanwhile.
 * TODO(phase): replace each usage with the real page.
 */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <section className="container-page grid min-h-[70svh] content-center justify-items-start gap-8 py-(--space-section)">
      <p className="type-mono flex items-center gap-3 text-ink-muted">
        <span aria-hidden="true" className="size-3 rounded-full border-2 border-route" />
        Em construção · {phase}
      </p>
      <h1 className="type-display max-w-[16ch]">{title}</h1>
      <p className="type-lead">Esta parte do GoGlobe ainda está sendo traçada.</p>
      <ButtonLink href="/" variant="secondary" arrow>
        Voltar para o início
      </ButtonLink>
    </section>
  );
}
