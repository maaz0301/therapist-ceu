import { Loader2 } from "lucide-react";

/**
 * Streaming boundary for the trainer dashboard segments. Without this, a tab
 * switch shows the previous page until the whole server render (auth check +
 * queries) resolves, which reads as the app hanging.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
