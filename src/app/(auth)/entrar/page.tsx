import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { authCopy } from "@/content/auth";
import { getSession, safeNextPath } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: authCopy.title,
  robots: { index: false },
  alternates: { canonical: "/entrar" },
};

const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string" ? params.next : null,
    "/app/onboarding",
  );
  const error = typeof params.erro === "string" ? params.erro : null;

  if (hasSupabaseConfig()) {
    const { user } = await getSession();
    if (user) redirect(next);
  }

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-[12%] -right-[40%] -z-10 aspect-[1600/826] w-[140%] opacity-70 lg:-right-[12%] lg:w-[80%]"
        >
          <div className="map-layer map-grid" />
          <div className="map-layer map-land" />
        </div>
        <div className="container-page grid min-h-[calc(100svh-4rem)] content-center gap-12 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <header className="grid content-start gap-6">
            <p className="type-eyebrow">{authCopy.eyebrow}</p>
            <h1 className="type-display max-w-[11ch]">{authCopy.title}</h1>
            <p className="type-lead">{authCopy.lead}</p>
          </header>

          <div className="grid content-start gap-6 rounded-md bg-bg/90 p-6 shadow-[inset_0_0_0_1px_var(--line),var(--shadow-md)] backdrop-blur-sm sm:p-8">
            {error && (
              <p
                role="alert"
                className="rounded-sm bg-(--status-fails-bg) p-4 text-(--status-fails)"
              >
                {error === "google" ? authCopy.googleError : authCopy.invalidLink}
              </p>
            )}
            <SignInForm next={next} />
            {googleEnabled && (
              <>
                <p className="type-mono flex items-center gap-3 text-ink-muted">
                  <span aria-hidden="true" className="h-px flex-1 bg-line" />
                  {authCopy.or}
                  <span aria-hidden="true" className="h-px flex-1 bg-line" />
                </p>
                <form action={signInWithGoogle}>
                  <input type="hidden" name="next" value={next} />
                  <Button type="submit" variant="secondary" size="lg" className="w-full">
                    {authCopy.google}
                  </Button>
                </form>
              </>
            )}
            <p className="text-[0.875rem] text-ink-muted">
              <Link href="/termos" className="link-inline">
                {authCopy.terms}
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
