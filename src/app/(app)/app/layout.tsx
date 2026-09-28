import type { Metadata } from "next";
import { signOut } from "@/app/(app)/app/actions";
import { JourneyRail } from "@/components/app/journey-rail";
import { LegalNotice } from "@/components/legal-notice";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/app";
import { requireUser } from "@/lib/data/user";

export const metadata: Metadata = {
  title: { default: "App", template: "%s | GoGlobe" },
  robots: { index: false, follow: false },
};

// Carta de Bordo: the app is the route. A journey rail (vertical on desktop,
// a strip on mobile) shows where the person is; content stays calm and dense.
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { supabase, user, profile } = await requireUser();
  const { count } = await supabase.from("user_plans").select("id", { count: "exact", head: true });

  const stops = [
    {
      href: "/app/onboarding",
      match: "/app/onboarding",
      label: appCopy.rail.profile,
      done: !!profile.onboarding_completed_at,
    },
    {
      href: "/app/resultados",
      match: "/app/resultados",
      label: appCopy.rail.results,
      done: !!profile.onboarding_completed_at,
    },
    {
      href: "/app/painel",
      match: "/app/painel",
      label: appCopy.rail.dashboard,
      done: (count ?? 0) > 0,
    },
    { href: "/app/conta", match: "/app/conta", label: appCopy.rail.account, done: false },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="type-mono hidden text-ink-muted md:inline">{user.email}</span>
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" className="h-9 px-3">
                {appCopy.signOut}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <aside className="min-w-0 border-b border-line pb-3 lg:sticky lg:top-26 lg:self-start lg:border-b-0 lg:pb-0">
          <JourneyRail stops={stops} />
        </aside>
        <main id="conteudo" className="min-w-0">
          {children}
        </main>
      </div>

      <footer className="container-page pb-10">
        <LegalNotice />
      </footer>
    </div>
  );
}
