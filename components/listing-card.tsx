import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

import { FormatBadge } from "@/components/format-badge";
import { CeuBadge } from "@/components/ceu-badge";
import { CompareToggle } from "@/components/compare/compare-store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListingFormat } from "@/lib/constants";

export type ListingCardData = {
  slug: string;
  title: string;
  trainerName: string;
  credentials?: string | null;
  format: ListingFormat;
  ceCount?: string | null;
  hasCeu: boolean;
  price: number;
  location: string;
  schedule: string;
  excerpt: string;
};

function formatPrice(price: number) {
  if (price <= 0) return "Free";
  return `$${price % 1 === 0 ? price : price.toFixed(2)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function ListingCard({
  listing,
  className,
}: {
  listing: ListingCardData;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "hard-sm hard-hover group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl p-5 ring-0",
        className,
      )}
    >

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <FormatBadge format={listing.format} />
        {listing.hasCeu ? <CeuBadge ceCount={listing.ceCount} /> : null}
      </div>

      <div className="space-y-2">
        <h3 className="font-heading text-lg leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
          <Link
            href={`/listings/${listing.slug}`}
            className="after:absolute after:inset-0"
          >
            {listing.title}
          </Link>
        </h3>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[0.65rem] font-semibold text-primary"
          >
            {initials(listing.trainerName)}
          </span>
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {listing.trainerName}
            {listing.credentials ? (
              <span className="text-muted-foreground/70">
                {" "}
                · {listing.credentials}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {listing.excerpt}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary/70" />
          {listing.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5 text-primary/70" />
          {listing.schedule}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-3">
        <span className="rounded-md border-2 border-foreground bg-clay px-2.5 py-0.5 font-heading text-sm font-bold text-clay-foreground">
          {formatPrice(listing.price)}
        </span>
        <div className="flex items-center gap-3">
          <CompareToggle slug={listing.slug} title={listing.title} />
          <span className="inline-flex items-center gap-0.5 text-sm font-medium text-clay transition-all group-hover:gap-1.5">
            Details
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Card>
  );
}
