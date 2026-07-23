import {
  PageHeadingSkeleton,
  StatGridSkeleton,
} from "@/components/dashboard-skeleton";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeadingSkeleton action />
      <StatGridSkeleton count={3} />

      <Card className="space-y-4 p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-48 w-full" />
      </Card>

      <Card className="space-y-3 p-6">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </Card>

      <span className="sr-only">Loading analytics…</span>
    </div>
  );
}
