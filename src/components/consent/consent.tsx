"use client";

import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { consentCopy as t } from "@/content/billing";
import { ANON_COOKIE, CONSENT_COOKIE, parseConsent, type Consent } from "@/lib/analytics/consent";

// LGPD: nothing non-essential runs until the visitor accepts. The choice lives
// in a first-party cookie (read by the server to gate event writes too).

const EVENT = "gg-consent-change";
const YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

function readConsent(): Consent | null {
  return parseConsent(readCookie(CONSENT_COOKIE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function setConsent(value: Consent | null) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  if (value === null) {
    document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  } else {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${YEAR}; samesite=lax${secure}`;
  }
  if (value === "accepted" && !readCookie(ANON_COOKIE)) {
    document.cookie = `${ANON_COOKIE}=${crypto.randomUUID()}; path=/; max-age=${YEAR}; samesite=lax${secure}`;
  }
  if (value !== "accepted") {
    document.cookie = `${ANON_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  }
  window.dispatchEvent(new Event(EVENT));
}

function useConsent() {
  // Server snapshot "unknown" avoids rendering the card during SSR (no flash for returning visitors).
  return useSyncExternalStore(
    subscribe,
    () => readConsent() ?? "pending",
    () => "unknown" as const,
  );
}

/** "Cartão de bordo": corner card, both choices with equal weight, never blocks the page. */
export function ConsentCard() {
  const consent = useConsent();
  if (consent !== "pending") return null;
  return (
    <section
      role="region"
      aria-label={t.title}
      className="fixed right-4 bottom-4 left-4 z-[65] max-w-sm animate-[card-in_600ms_var(--ease-out-expo)_both] sm:left-auto"
    >
      <div className="relative grid gap-4 rounded-md bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line-strong),var(--shadow-lift)]">
        <span
          aria-hidden="true"
          className="absolute top-5 -left-1.5 size-3 rounded-full border-2 border-route bg-bg"
        />
        <p className="type-mono flex items-center gap-3 text-ink-muted">
          <span className="rounded-xs bg-ink px-1.5 py-0.5 font-semibold text-bg">{t.label}</span>
          {t.title}
        </p>
        <p className="text-[0.9375rem] leading-relaxed">{t.body}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConsent("rejected")}
            className="h-11 rounded-sm px-3 font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="h-11 rounded-sm px-3 font-semibold shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
          >
            {t.accept}
          </button>
        </div>
        <Link href="/privacidade" className="link-inline type-mono w-fit text-ink-muted">
          {t.policy}
        </Link>
      </div>
    </section>
  );
}

/** Loads Vercel Analytics and first-party page views only after consent. */
export function AnalyticsGate() {
  const consent = useConsent();
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "accepted" || pathname === lastSent.current) return;
    const name =
      pathname === "/"
        ? "landing_view"
        : pathname.startsWith("/caminhos/")
          ? "pathway_page_view"
          : null;
    lastSent.current = pathname;
    if (!name) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [consent, pathname]);

  return consent === "accepted" ? <Analytics /> : null;
}

/** Footer link to change the choice later. */
export function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      {t.settings}
    </button>
  );
}
