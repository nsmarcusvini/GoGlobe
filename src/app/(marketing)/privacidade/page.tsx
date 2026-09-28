import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";
import { upcoming } from "@/content/pages";

const page = upcoming.privacy;

export const metadata: Metadata = { title: page.title, robots: { index: false } };

export default function Page() {
  return <ComingSoon {...page} />;
}
