import {
  CardListSkeleton,
  PageHeadingSkeleton,
  StatGridSkeleton,
} from "@/components/dashboard-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PageHeadingSkeleton action />
      <StatGridSkeleton count={4} />
      <CardListSkeleton rows={4} />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
