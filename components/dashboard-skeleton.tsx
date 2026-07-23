import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Building blocks for the per-tab `loading.tsx` files. A tab switch always
 * costs a server round-trip, so what it lands on matters: a page-shaped
 * skeleton reads as "already there, filling in", where the shared centred
 * spinner read as "still waiting".
 */

/** Title + subtitle, matching each page's heading block. */
export function PageHeadingSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-32" /> : null}
    </div>
  );
}

/** The stat-card row used by the dashboard and analytics tabs. */
export function StatGridSkeleton({ count }: { count: number }) {
  return (
    <div
      className={
        count === 3
          ? "grid gap-4 sm:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </Card>
      ))}
    </div>
  );
}

/** A card holding a few list rows. */
export function CardListSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}
