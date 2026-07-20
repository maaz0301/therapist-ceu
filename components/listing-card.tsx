import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import { FormatBadge } from "@/components/format-badge";
import { CeuBadge } from "@/components/ceu-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ListingFormat } from "@/lib/constants";

export type ListingCardData = {
  slug: string;
  title: string;
  trainerName: string;
  credentials?: string | null;
  format: ListingFormat;
  ceCount?: number | null;
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
        "group relative flex h-full flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 overflow-hidden",
        className,
      )}
    >
      <div className="absolute top-0 right-0 h-2 w-full bg-gradient-to-l from-clay/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="flex flex-wrap items-center gap-2">
        <FormatBadge format={listing.format} />
        {listing.hasCeu ? <CeuBadge ceCount={listing.ceCount} /> : null}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
          <Link
            href={`/listings/${listing.slug}`}
            className="after:absolute after:inset-0"
          >
            {listing.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {listing.trainerName}
          {listing.credentials ? (
            <span className="text-muted-foreground/80">
              {" "}
              · {listing.credentials}
            </span>
          ) : null}
        </p>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {listing.excerpt}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {listing.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" />
          {listing.schedule}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-base font-semibold text-foreground">
          {formatPrice(listing.price)}
        </span>
        <span className="text-sm font-medium text-primary group-hover:underline">
          View details
        </span>
      </div>
    </Card>
  );
}
