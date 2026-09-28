"use client";

import { useSyncExternalStore } from "react";
import { ui } from "@/content/ui";
import { THEME_STORAGE_KEY, type ThemePreference } from "./theme-script";

const ORDER: ThemePreference[] = ["system", "light", "dark"];

function readPreference(): ThemePreference {
  const value = document.documentElement.dataset.themePref;
  return value === "light" || value === "dark" ? value : "system";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme-pref"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readPreference() === "system") apply("system");
  };
  media.addEventListener("change", onMedia);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onMedia);
  };
}

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePref = preference;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage unavailable: the choice lasts for this page view only.
  }
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);
  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length] ?? "system";
  const label = ui.theme[preference];

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      className="type-mono inline-flex h-10 items-center gap-2 rounded-sm px-2 text-ink-muted transition-colors duration-200 hover:text-ink"
      aria-label={`${ui.theme.label}: ${label}. ${ui.theme.switchTo} ${ui.theme[next]}.`}
    >
      <span aria-hidden="true" className="relative inline-block size-4">
        <span className="absolute inset-0 rounded-full border border-current" />
        <span
          className="absolute inset-y-0 right-0 rounded-r-full bg-current transition-[width] duration-500 ease-out-expo"
          style={{ width: preference === "light" ? "0%" : preference === "dark" ? "100%" : "50%" }}
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
