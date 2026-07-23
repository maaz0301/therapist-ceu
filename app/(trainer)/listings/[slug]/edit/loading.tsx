import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The edit page has to load the listing and the full tag list before it can
 * render, so without a boundary here the click sits on the listings page for
 * the length of that round-trip. This swaps in the page frame immediately.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <span className="-ml-2 inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back to listings
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <Card className="space-y-6 p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-40" />
      </Card>

      <span className="sr-only">Loading listing…</span>
    </div>
  );
}
