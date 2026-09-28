import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Sobre o GoGlobe", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Sobre o GoGlobe" phase="Fase 5" />;
}
