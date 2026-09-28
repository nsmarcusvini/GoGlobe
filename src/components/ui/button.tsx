import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-3 font-semibold whitespace-nowrap " +
  "rounded-sm transition-[background-color,color,box-shadow,transform] duration-300 ease-out-expo " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  // The route colour: reserved for the one action that matters on a screen.
  primary: "bg-cta text-cta-ink shadow-sm hover:bg-cta-hover hover:shadow-md",
  secondary:
    "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]",
  ghost: "bg-transparent text-ink hover:bg-surface-sunk",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-[1.0625rem] tracking-[-0.01em]",
};

type Common = { variant?: Variant; size?: Size; arrow?: boolean; children: ReactNode };

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 12"
      className="h-3 w-6 shrink-0 transition-transform duration-500 ease-out-expo group-hover/btn:translate-x-1.5"
    >
      <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: Common & ComponentProps<"button">) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
