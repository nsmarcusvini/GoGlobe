import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { privacyCopy as t } from "@/content/privacy";

export const metadata: Metadata = {
  title: t.title,
  description:
    "Quais dados o GoGlobe coleta, para quê, com quem compartilha e quais são os seus direitos (LGPD).",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return <LegalDocument {...t} />;
}
