import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = { title: "Criar seu perfil", robots: { index: false } };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <ComingSoon title="Criar seu perfil" phase="Fase 5" />
      </main>
      <SiteFooter />
    </>
  );
}
