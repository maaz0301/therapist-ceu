"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Strips one-shot flash params (`?updated=1`, `?new=…`) from the URL after the
 * server has rendered the banner they trigger, so a refresh doesn't replay it.
 *
 * This goes through the Next router rather than `window.history.replaceState`.
 * A raw replaceState only edits browser history; the App Router keeps its own
 * canonical URL, and the `revalidatePath` + `redirect` that got us here can
 * finish its refetch *after* this effect runs and restore `?updated=1` — which
 * is exactly how a "dismissed" banner survives a reload.
 */
export function ClearQueryParams({ params }: { params: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Depend on the joined string, not the array: callers pass an inline literal
  // that is a new identity on every render and would re-fire this effect.
  const keys = params.join(",");

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    for (const key of keys.split(",")) {
      if (next.has(key)) {
        next.delete(key);
        changed = true;
      }
    }
    if (!changed) return;

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [keys, pathname, router, searchParams]);

  return null;
}
