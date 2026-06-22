"use client";

import { useEffect } from "react";

import { recordListingView } from "@/lib/actions/analytics";

/** Fires a single view event per browser session for a listing. */
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `viewed:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — still record once per mount.
    }
    void recordListingView(listingId);
  }, [listingId]);

  return null;
}
