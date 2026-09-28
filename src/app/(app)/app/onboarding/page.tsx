import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { upcoming } from "@/content/pages";

const page = upcoming.onboarding;

export const metadata: Metadata = { title: page.title, robots: { index: false } };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <ComingSoon {...page} />
      </main>
      <SiteFooter />
    </>
  );
}
