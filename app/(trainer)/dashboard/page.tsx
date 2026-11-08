import Link from "next/link";
import { ArrowUpRight, Check, ListChecks, Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ListingStatusBadge } from "@/components/listing-status-badge";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { ButtonLink } from "@/components/ui/button-link";
import { requireTrainer, requireUser } from "@/lib/auth";
import { getTrainerAnalytics } from "@/lib/queries/analytics";
import {
  getRecentTrainerListings,
  getTrainerListingCounts,
} from "@/lib/queries/listings";
import { getSubscriptionState } from "@/lib/subscription";

export const metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function TrainerDashboardPage() {
  // `requireUser` verifies the JWT locally, so the trainer's id is available
  // without waiting on a database round-trip. That lets the profile lookup and
  // the page's own queries go out together instead of one after the other —
  // `requireTrainer` still gates rendering, it just no longer blocks the fetch.
  const user = await requireUser();

  const [profile, counts, analytics, recent] = await Promise.all([
    requireTrainer(),
    getTrainerListingCounts(user.id),
    getTrainerAnalytics(user.id, "all"),
    getRecentTrainerListings(user.id, 5),
  ]);
  const subscription = getSubscriptionState(profile);
  const activeCount = counts.active;
  const firstName = profile.fullName?.split(" ")[0];

  const stats = [
    { label: "Active", value: activeCount, hint: `${counts.pending} pending review` },
    { label: "Views", value: analytics.totals.views, hint: "all time" },
    { label: "Clicks", value: analytics.totals.clicks, hint: "to your page" },
    { label: "Listings", value: counts.total, hint: "total created" },
  ];

  const checklist = [
    { done: Boolean(profile.bio && profile.websiteUrl), label: "Complete your profile", href: "/settings" },
    { done: subscription.isActive, label: "Choose a plan", href: "/billing" },
    { done: counts.total > 0, label: "Create your first listing", href: "/listings/new" },
    { done: activeCount > 0, label: "Publish a listing", href: "/listings" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-clay uppercase">Trainer dashboard</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-foreground sm:text-5xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
        </div>
        <ButtonLink variant="clay" size="lg" href="/listings/new">
          <Plus data-icon="inline-start" />
          New listing
        </ButtonLink>
      </div>

      <SubscriptionBanner subscription={subscription} activeCount={activeCount} />

      {/* Stat ledger */}
      <div className="hard grid grid-cols-2 gap-[2px] overflow-hidden rounded-xl bg-foreground sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {s.label}
            </p>
            <p className="mt-2 font-heading text-5xl font-semibold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent listings */}
        <section className="hard rounded-xl bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-3">
            <h2 className="font-heading text-xl font-semibold">Recent listings</h2>
            {counts.total > 0 ? (
              <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowUpRight className="size-4" />
              </Link>
            ) : null}
          </div>

          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ListChecks}
                title="No listings yet"
                description="Create your first training listing to start reaching learners."
                action={
                  <ButtonLink variant="clay" href="/listings/new">
                    Create a listing
                  </ButtonLink>
                }
              />
            </div>
          ) : (
            <ul className="divide-y-2 divide-foreground/15">
              {recent.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">{listing.format}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ListingStatusBadge status={listing.status} active={listing.active} />
                    <ButtonLink variant="outline" size="sm" href={`/listings/${listing.slug}/edit`}>
                      Edit
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Getting started */}
        <section className="hard self-start rounded-xl bg-card">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-3">
            <h2 className="font-heading text-xl font-semibold">Getting started</h2>
            <span className="rounded-md border-2 border-foreground bg-clay px-2 py-0.5 text-xs font-bold text-clay-foreground">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <ul className="divide-y-2 divide-foreground/15">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-accent"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded border-2 border-foreground ${
                      c.done ? "bg-primary text-primary-foreground" : "bg-background"
                    }`}
                  >
                    {c.done ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className={c.done ? "text-muted-foreground line-through" : "font-medium"}>
                    {c.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
