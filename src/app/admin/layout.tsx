import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin GoGlobe" },
  robots: { index: false, follow: false },
};

// Content curation. Visual language inherited from the design system; the app
// side favours clarity and density over the landing's boldness.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Link href="/admin" className="type-eyebrow">
              Curadoria
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main id="conteudo" className="container-page py-10">
        {children}
      </main>
    </div>
  );
}
