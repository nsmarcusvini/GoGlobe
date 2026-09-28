import type { MetadataRoute } from "next";
import { countryHref, listCountries, listPathways, pathwayHref } from "@/lib/data/content";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = (path: string) => new URL(path, base).toString();

  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/precos"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/aviso-legal"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/sobre"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.3 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const db = createPublicClient();
  if (!db) return pages;

  const [countries, pathways] = await Promise.all([listCountries(db), listPathways(db)]);
  return [
    ...pages,
    ...countries.map((c) => ({
      url: url(countryHref(c.code)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...pathways.map((p) => ({
      url: url(pathwayHref(p)),
      lastModified: p.last_verified_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
