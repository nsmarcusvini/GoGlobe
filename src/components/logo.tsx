import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

// TODO(brand): replace the raster logo with the official SVG once available.
// Source file: brand/logo-original.png → processed by scripts/prepare-logo.mjs.
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name}: página inicial`}
      className={cn("inline-flex", className)}
    >
      <Image
        src="/brand/goglobe-logo.png"
        alt={site.name}
        width={786}
        height={266}
        priority={priority}
        sizes="140px"
        className="h-9 w-auto"
      />
    </Link>
  );
}
