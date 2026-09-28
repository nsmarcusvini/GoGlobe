import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Planos e preços", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Planos e preços" phase="Fase 6" />;
}
