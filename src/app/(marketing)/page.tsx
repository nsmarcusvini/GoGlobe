import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Honesty } from "@/components/landing/honesty";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Plans } from "@/components/landing/plans";
import { Proof } from "@/components/landing/proof";
import { Story } from "@/components/landing/story";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Story />
      <HowItWorks />
      <Proof />
      <Honesty />
      <Plans />
      <FinalCta />
    </>
  );
}
