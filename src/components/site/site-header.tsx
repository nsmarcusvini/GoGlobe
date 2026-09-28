import Link from "next/link";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { ui } from "@/content/ui";

const links = [
  { href: "/#paises", label: ui.nav.countries },
  { href: "/#como-funciona", label: ui.nav.howItWorks },
  { href: "/precos", label: ui.nav.pricing },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
      >
        {ui.nav.skipToContent}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo priority />
        <nav aria-label="Principal" className="hidden items-center gap-8 whitespace-nowrap lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-route text-[0.9375rem] font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/entrar"
            className="link-route hidden px-2 text-[0.9375rem] font-medium sm:inline-block"
          >
            {ui.nav.signIn}
          </Link>
          <ButtonLink href="/app/onboarding" size="md" className="h-10 px-4 max-sm:hidden">
            {ui.nav.cta}
          </ButtonLink>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
