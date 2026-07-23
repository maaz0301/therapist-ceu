import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Preview is one server round-trip away (listing detail + viewer lookup), so
 * give the navigation something to land on right away instead of leaving the
 * trainer on the listings page wondering whether the click registered.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <Skeleton className="mt-3 h-9 w-3/4" />
      <Skeleton className="mt-3 h-5 w-1/2" />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="space-y-2 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <span className="sr-only">Loading listing…</span>
    </div>
  );
}
