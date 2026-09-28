"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ui } from "@/content/ui";
import { cn } from "@/lib/cn";

type NavLink = { href: string; label: string };

/** Below `lg` the header links collapse into this panel (anchored to the sticky header). */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-sm text-ink transition-colors duration-200 hover:bg-surface-sunk"
      >
        <span className="sr-only">{open ? ui.nav.closeMenu : ui.nav.openMenu}</span>
        <span aria-hidden="true" className="relative block h-3 w-5">
          <span
            className={cn(
              "absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ease-out-expo",
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-[1.5px] w-full bg-current transition-transform duration-300 ease-out-expo",
              open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
            )}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-bg shadow-md"
      >
        <nav aria-label="Principal" className="container-page grid py-3">
          <ul>
            {links.map((link) => (
              <li key={link.href} className="border-b border-line">
                <Link href={link.href} onClick={close} className="type-title block py-4">
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-b border-line sm:hidden">
              <Link href="/entrar" onClick={close} className="type-title block py-4">
                {ui.nav.signIn}
              </Link>
            </li>
          </ul>
          {/* On phones the header CTA lives here, so the bar never overflows. */}
          <ButtonLink
            href="/app/onboarding"
            size="lg"
            arrow
            onClick={close}
            className="mt-5 mb-2 sm:hidden"
          >
            {ui.nav.cta}
          </ButtonLink>
        </nav>
      </div>
    </div>
  );
}
