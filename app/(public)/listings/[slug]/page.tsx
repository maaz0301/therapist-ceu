import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
} from "lucide-react";

import { CeuBadge } from "@/components/ceu-badge";
import { FormatBadge } from "@/components/format-badge";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/auth";
import { getListingDetail, type ListingDetail } from "@/lib/queries/listings";
import { formatDateRange, upcomingRanges } from "@/lib/dates";
import { US_STATES } from "@/lib/constants";

const STATE_NAMES = new Map<string, string>(
  US_STATES.map((s) => [s.code, s.name]),
);

function formatPrice(price: string) {
  const n = Number(price);
  return n <= 0 ? "Free" : `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}

/**
 * The runs still ahead, soonest first. Read on the server, so "today" is UTC —
 * a date only drops off once it's finished everywhere.
 */
function upcomingDates(listing: ListingDetail) {
  return upcomingRanges(listing.dates, new Date().toISOString().slice(0, 10));
}

function formatLocation(listing: ListingDetail) {
  if (listing.isOnline) return "Online / Any state";
  if (listing.states.length === 0) return "Location TBA";
  return listing.states.map((c) => STATE_NAMES.get(c) ?? c).join(", ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingDetail(slug);
  if (!listing) return { title: "Listing not found" };

  const description = listing.description.slice(0, 160);
  const images = listing.imageUrl ? [{ url: listing.imageUrl }] : undefined;

  return {
    title: listing.title,
    description,
    alternates: { canonical: `/listings/${listing.slug}` },
    openGraph: {
      title: listing.title,
      description,
      type: "article",
      url: `/listings/${listing.slug}`,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: listing.imageUrl ? [listing.imageUrl] : undefined,
    },
  };
}

function courseJsonLd(listing: ListingDetail) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: listing.title,
    description: listing.description,
    provider: {
      "@type": "Organization",
      name: listing.trainerName ?? "TherapistCEU",
    },
    offers: {
      "@type": "Offer",
      price: Number(listing.price),
      priceCurrency: "USD",
      category: Number(listing.price) <= 0 ? "Free" : "Paid",
    },
    // One CourseInstance per upcoming run, so search engines can surface the
    // right date rather than only the first one ever scheduled.
    hasCourseInstance: listing.onDemand
      ? {
          "@type": "CourseInstance",
          courseMode: listing.isOnline ? "Online" : "Onsite",
        }
      : upcomingDates(listing).map((run) => ({
          "@type": "CourseInstance",
          courseMode: listing.isOnline ? "Online" : "Onsite",
          startDate: run.startDate,
          endDate: run.endDate ?? run.startDate,
        })),
  };
  return JSON.stringify(data);
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  const viewer = profile
    ? { id: profile.id, isAdmin: profile.role === "admin" }
    : null;

  const listing = await getListingDetail(slug, viewer);
  if (!listing) notFound();

  const isPublic = listing.status === "approved" && listing.active;
  const upcoming = upcomingDates(listing);
  const [nextRun, ...laterRuns] = upcoming;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {isPublic ? (
        <>
          <ViewTracker listingId={listing.id} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: courseJsonLd(listing) }}
          />
        </>
      ) : null}

      {!isPublic ? (
        <div className="mb-6 rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay-deep">
          Preview — this listing isn&apos;t visible to the public yet
          (status: {listing.status}
          {listing.active ? "" : ", unpublished"}).
        </div>
      ) : null}

      {listing.imageUrl ? (
        <div className="mb-6 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="aspect-[1200/630] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <FormatBadge format={listing.format} />
        {listing.hasCeu ? <CeuBadge ceCount={listing.ceCount} /> : null}
      </div>

      <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">
        {listing.title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {listing.presenterNames}
        {listing.credentials ? `, ${listing.credentials}` : ""}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {laterRuns.length > 0 ? "Next date" : "Schedule"}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {listing.onDemand
              ? "Available on demand"
              : nextRun
                ? formatDateRange(nextRun, "long")
                : "Date to be announced"}
          </p>
          {laterRuns.length > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              +{laterRuns.length} more date{laterRuns.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            Location
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatLocation(listing)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            Details
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatPrice(listing.price)}
            {listing.durationHours ? ` · ${listing.durationHours} hrs` : ""}
            {listing.hasCeu && listing.ceCount
              ? ` · ${listing.ceCount} CE`
              : ""}
          </p>
        </Card>
      </div>

      <div className="mt-8 space-y-3">
        <h2 className="font-heading text-lg font-semibold">About this training</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {listing.description}
        </p>
      </div>

      {/* The card above only has room for the next date; a training that
          repeats lists every remaining run here so a therapist who can't make
          the first one can see what else is coming. */}
      {laterRuns.length > 0 ? (
        <div className="mt-8 space-y-3">
          <h2 className="font-heading text-lg font-semibold">Upcoming dates</h2>
          <ul className="space-y-1.5">
            {upcoming.map((run) => (
              <li
                key={run.startDate}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CalendarDays className="size-4 shrink-0 text-clay" />
                <span
                  className={
                    run === nextRun ? "font-medium text-foreground" : undefined
                  }
                >
                  {formatDateRange(run, "long")}
                </span>
                {run === nextRun ? (
                  <Badge variant="clay-subtle">Next</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {listing.hasCeu ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">CE credits:</span>{" "}
          {listing.ceCount}
          {listing.accreditingBody ? ` · ${listing.accreditingBody}` : ""}
        </p>
      ) : null}

      {listing.tagList.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {listing.tagList.map((tag) => (
            <Badge key={tag.id} variant="clay-subtle">
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`/go/${listing.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "clay", size: "lg" }))}
        >
          Register on trainer&apos;s site
          <ExternalLink data-icon="inline-end" />
        </a>
        {listing.trainerWebsite ? (
          <a
            href={listing.trainerWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            <Globe data-icon="inline-start" />
            Trainer website
          </a>
        ) : null}
      </div>

      {listing.trainerBio ? (
        <Card className="mt-10 p-6">
          <h2 className="font-heading text-lg font-semibold">
            About {listing.trainerName}
          </h2>
          {listing.trainerCredentials ? (
            <p className="text-sm text-muted-foreground">
              {listing.trainerCredentials}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {listing.trainerBio}
          </p>
        </Card>
      ) : null}
    </article>
  );
}
