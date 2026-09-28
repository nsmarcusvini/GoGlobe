import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Política de privacidade", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Política de privacidade" phase="Fase 6" />;
}
