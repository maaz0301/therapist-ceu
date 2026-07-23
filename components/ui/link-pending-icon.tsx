"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";

/**
 * A link's leading icon that flips to a spinner while the router is fetching
 * the destination. Server-rendered pages (edit, preview) can take a beat to
 * come back, and without this the click looks like it did nothing.
 *
 * Must be rendered as a descendant of the `<Link>` it reports on.
 */
export function LinkPendingIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();

  if (pending) {
    return <Loader2 data-icon="inline-start" className="animate-spin" />;
  }
  return <Icon data-icon="inline-start" />;
}
