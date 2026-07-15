"use client";

import { useEffect } from "react";

export function ClearQueryParams({ params }: { params: string[] }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    for (const p of params) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [params]);

  return null;
}
