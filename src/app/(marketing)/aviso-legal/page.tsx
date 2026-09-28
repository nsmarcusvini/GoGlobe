import type { Metadata } from "next";
import { legalNotice } from "@/content/legal";

const { page } = legalNotice;

export const metadata: Metadata = {
  title: page.title,
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return (
    <main>
      <h1>{page.title}</h1>
      {page.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
      <h2>{page.sourcesTitle}</h2>
      <ul>
        {page.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} rel="noopener noreferrer" target="_blank">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
