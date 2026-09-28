"use client";

import { useEffect } from "react";
import { RouteBreak } from "@/components/site/route-break";

/** Unexpected error inside any page: the route breaks, with a way back. */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <RouteBreak onRetry={retry} />;
}
