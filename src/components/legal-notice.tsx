import Link from "next/link";
import { legalNotice } from "@/content/legal";

// Provisional, unstyled. Visual treatment comes from the Phase 2 design system.
export function LegalNotice() {
  return (
    <aside aria-label="Aviso legal" data-testid="legal-notice">
      <p>
        {legalNotice.short} <Link href="/aviso-legal">{legalNotice.linkLabel}</Link>
      </p>
    </aside>
  );
}
