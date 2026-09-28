import Link from "next/link";
import { LegalNotice } from "@/components/legal-notice";
import { Logo } from "@/components/logo";
import { legalNotice } from "@/content/legal";
import { site } from "@/content/site";

const links = [
  { href: "/sobre", label: "Sobre" },
  { href: "/precos", label: "Preços" },
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="container-page grid gap-12">
        <LegalNotice />

        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1.4fr]">
          <div className="grid content-start gap-4">
            <Logo />
            <p className="max-w-xs text-[0.9375rem] text-ink-muted">{site.description}</p>
          </div>

          <nav aria-label="Rodapé" className="grid content-start gap-3">
            <p className="type-eyebrow">Navegação</p>
            <ul className="grid gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-route text-[0.9375rem]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid content-start gap-3">
            <p className="type-eyebrow">{legalNotice.page.sourcesTitle}</p>
            <ul className="grid gap-2">
              {legalNotice.page.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-route text-[0.9375rem]"
                  >
                    {source.label}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="type-mono flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-ink-muted">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>15°47′S 47°52′W → 35°17′S 149°08′E · 41°17′S 174°47′E · 45°25′N 75°42′W</span>
        </div>
      </div>
    </footer>
  );
}
