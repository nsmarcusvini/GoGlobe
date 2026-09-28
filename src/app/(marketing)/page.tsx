import { LegalNotice } from "@/components/legal-notice";
import { site } from "@/content/site";

// Phase 1 placeholder. The landing page is built in Phase 2 with /sites-incriveis.
export default function HomePage() {
  return (
    <main>
      <h1>{site.name}</h1>
      <p>{site.description}</p>
      <LegalNotice />
    </main>
  );
}
