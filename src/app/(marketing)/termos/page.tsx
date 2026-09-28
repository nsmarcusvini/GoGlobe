import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Termos de uso", robots: { index: false } };

export default function Page() {
  return <ComingSoon title="Termos de uso" phase="Fase 5" />;
}
