"use client";

import { useEffect } from "react";
import { RouteBreak } from "@/components/site/route-break";
import { routeBreak } from "@/content/pages";
import "./globals.css";

/**
 * The root layout itself failed: this replaces it, so it brings its own
 * document and styles. Theme follows the OS (no theme script here).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="pt-BR">
      <body>
        <title>GoGlobe: trecho interrompido</title>
        <RouteBreak onRetry={retry} title={routeBreak.globalTitle} />
      </body>
    </html>
  );
}
