import {
  Search,
  MousePointerClick,
  ListChecks,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listing-card";
import { getFeaturedListings } from "@/lib/queries/directory";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search by what matters",
    description:
      "Filter by topic, format, state, price, and CEU accreditation to find trainings that fit your license — in seconds.",
  },
  {
    icon: ListChecks,
    title: "Compare at a glance",
    description:
      "Clean listing cards show format, CE credits, price, and dates so you can compare options without the guesswork.",
  },
  {
    icon: CalendarCheck,
    title: "Register directly",
    description:
      "Click straight through to the trainer's registration page. No account, no fees, no middleman.",
  },
];

const PRICING = [
  {
    ...SUBSCRIPTION_TIERS.basic,
    blurb: "Perfect for getting started.",
    features: ["Up to 2 active listings", "Listing analytics", "Self-serve billing"],
    highlighted: false,
  },
  {
    ...SUBSCRIPTION_TIERS.pro,
    blurb: "For trainers with a full catalog.",
    features: [
      "Unlimited active listings",
      "Listing analytics",
      "Self-serve billing",
      "Priority placement (coming soon)",
    ],
    highlighted: true,
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await getFeaturedListings(4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,var(--secondary)_0%,transparent_70%)]" />
        <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <Badge className="mx-auto bg-secondary text-secondary-foreground">
            <Sparkles data-icon="inline-start" />
            For licensed mental health therapists
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-[1.1] font-bold text-foreground sm:text-5xl">
            Find the right CEU training,{" "}
            <span className="text-primary">without the endless search.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            One clean, searchable directory of CEU and professional trainings —
            filter by topic, format, state, price, and accreditation to find
            exactly what your license needs.
          </p>

          <form
            action="/directory"
            className="mx-auto mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
          >
            <div className="flex flex-1 items-center gap-2 pl-3">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                name="q"
                type="search"
                placeholder="Try “EMDR”, “eating disorders”, “ethics”…"
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search trainings"
              />
            </div>
            <Button type="submit" variant="coral" size="lg">
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Free for therapists</span>
            <span className="hidden sm:inline">·</span>
            <span>No account required</span>
            <span className="hidden sm:inline">·</span>
            <span>CEU &amp; non-CEU trainings</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Finding the right continuing education shouldn&apos;t take an hour
              of Googling. Here&apos;s the whole flow.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <Card key={step.title} className="p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured trainings */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Featured trainings
              </h2>
              <p className="mt-3 text-muted-foreground">
                A preview of the trainings therapists are discovering right now.
              </p>
            </div>
            <ButtonLink
              variant="ghost"
              size="sm"
              className="hidden shrink-0 sm:inline-flex"
              href="/directory"
            >
              Browse all
              <ArrowRight data-icon="inline-end" />
            </ButtonLink>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : null}

      {/* For trainers / pricing */}
      <section
        id="for-trainers"
        className="border-t border-border bg-secondary/40"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mx-auto bg-coral/12 text-coral">
              <MousePointerClick data-icon="inline-start" />
              For trainers
            </Badge>
            <h2
              id="pricing"
              className="mt-4 text-2xl font-bold text-foreground sm:text-3xl"
            >
              Get your trainings in front of the right therapists
            </h2>
            <p className="mt-3 text-muted-foreground">
              Stop relying on a social following. List your CEU and professional
              trainings where therapists are already searching.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {PRICING.map((tier) => (
              <Card
                key={tier.id}
                className={
                  tier.highlighted
                    ? "relative border-primary p-6 shadow-md ring-1 ring-primary/20"
                    : "p-6"
                }
              >
                {tier.highlighted ? (
                  <Badge className="absolute -top-2.5 right-5 bg-primary text-primary-foreground">
                    Most popular
                  </Badge>
                ) : null}
                <h3 className="text-lg font-semibold text-foreground">
                  {tier.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.blurb}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check className="size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  variant={tier.highlighted ? "coral" : "outline"}
                  className="mt-6 w-full"
                  href="/signup"
                >
                  Start free trial
                </ButtonLink>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            30-day free trial · cancel anytime · founding members get 60 days.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Card className="overflow-hidden bg-primary p-10 text-center text-primary-foreground sm:p-14">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold sm:text-3xl">
            Ready to find your next training?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Search the directory free — or list your own trainings and reach
            therapists actively looking for CEUs.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink variant="coral" size="xl" href="/directory">
              Browse trainings
            </ButtonLink>
            <ButtonLink variant="secondary" size="xl" href="/signup">
              List your training
            </ButtonLink>
          </div>
        </Card>
      </section>
    </>
  );
}
