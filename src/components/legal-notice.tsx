import Link from "next/link";
import { legalNotice } from "@/content/legal";
import { cn } from "@/lib/cn";

/**
 * Legal notice. Always readable: body size, full contrast, never fine print.
 * `panel` for onboarding/results/footer; `inline` for compact contexts.
 */
export function LegalNotice({
  variant = "panel",
  className,
}: {
  variant?: "panel" | "inline";
  className?: string;
}) {
  return (
    <aside
      aria-label="Aviso legal"
      data-testid="legal-notice"
      className={cn(
        variant === "panel" &&
          "grid gap-3 rounded-md border-l-2 border-accent bg-surface-sunk p-5 sm:grid-cols-[auto_1fr] sm:gap-5 sm:p-6",
        variant === "inline" && "flex gap-3",
        className,
      )}
    >
      <p className="type-eyebrow pt-0.5">Aviso legal</p>
      <p className="max-w-(--measure) text-[0.9375rem] leading-relaxed text-ink sm:text-base">
        {legalNotice.short}{" "}
        <Link href="/aviso-legal" className="link-inline font-semibold whitespace-nowrap">
          {legalNotice.linkLabel}
        </Link>
      </p>
    </aside>
  );
}
