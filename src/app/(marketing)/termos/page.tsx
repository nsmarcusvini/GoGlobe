import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { termsCopy } from "@/content/terms";
import { PRICES } from "@/lib/billing/config";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "As regras de uso do GoGlobe em português claro: o que o serviço é e não é, planos, cancelamento, reembolso e privacidade.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return <LegalDocument {...termsCopy(PRICES)} />;
}
