import {
  Search,
  ListChecks,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowRight,
  GitCompareArrows,
  CalendarDays,
  BellRing,
  Star,
  ShieldCheck,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listing-card";
import { getFeaturedListings } from "@/lib/queries/directory";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import { brand } from "@/lib/brand";

const QUICK_FILTERS = [
  { label: "Live virtual", href: "/directory?format=Live%20Virtual" },
  { label: "In person", href: "/directory?format=In-Person" },
  { label: "On demand", href: "/directory?format=On-Demand" },
  { label: "Hybrid", href: "/directory?format=Hybrid" },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search by what matters",
    description:
      "Filter by topic, format, location, price and accreditation to find trainings that fit your goals — in seconds.",
  },
  {
    icon: ListChecks,
    title: "Compare at a glance",
    description:
      "Clean cards show format, credits, price and dates so you can weigh options without the guesswork.",
  },
  {
    icon: CalendarCheck,
    title: "Register directly",
    description:
      "Click straight through to the trainer's registration page. No middleman, no extra fees.",
  },
];

const FEATURES = [
  {
    icon: GitCompareArrows,
    title: "Compare side by side",
    description: "Pick up to three courses and see price, dates, format and credits in one table.",
    href: "/directory",
    cta: "Start comparing",
  },
  {
    icon: CalendarDays,
    title: "Browse by calendar",
    description: "See every live session laid out by month, so you can plan around your schedule.",
    href: "/calendar",
    cta: "Open calendar",
  },
  {
    icon: BellRing,
    title: "Saved lists & alerts",
    description: "Bookmark favorites and get an email the moment a course matches your keywords.",
    href: "/saved",
    cta: "Set up alerts",
  },
  {
    icon: Star,
    title: "Real learner reviews",
    description: "Read honest ratings, and see how trainers respond, before you commit.",
    href: "/directory",
    cta: "Read reviews",
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
      <section className="relative isolate overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[28rem] w-[46rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
        <div className="pointer-events-none absolute top-24 -right-24 -z-10 h-80 w-80 rounded-full bg-clay/15 blur-[100px]" />

        <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-20 text-center sm:px-6 sm:pt-28 sm:pb-24">
          <Badge className="rise-in mx-auto gap-1.5 border border-primary/25 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/15">
            <Sparkles className="size-3.5" />
            Courses for every kind of professional
          </Badge>

          <h1 className="rise-in mx-auto mt-6 max-w-4xl font-heading text-5xl leading-[1.05] font-bold tracking-tight text-foreground [animation-delay:60ms] sm:text-6xl lg:text-7xl">
            Find the right training,{" "}
            <span className="gradient-text">without the endless search.</span>
          </h1>

          <p className="rise-in mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground [animation-delay:120ms] sm:text-xl">
            One clean, searchable directory of professional courses — filter by
            topic, format, location, price and accreditation to find exactly
            what your career needs.
          </p>

          <form
            action="/directory"
            className="rise-in glass mx-auto mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border p-2 shadow-xl shadow-primary/10 transition-shadow [animation-delay:180ms] focus-within:shadow-2xl focus-within:shadow-primary/20"
          >
            <div className="flex flex-1 items-center gap-3 pl-3">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                name="q"
                type="search"
                placeholder="Try “leadership”, “data analysis”, “ethics”…"
                className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Search trainings"
              />
            </div>
            <Button type="submit" variant="clay" size="xl">
              Search
            </Button>
          </form>

          <div className="rise-in mt-6 flex flex-wrap items-center justify-center gap-2 [animation-delay:240ms]">
            <span className="mr-1 text-sm text-muted-foreground">Popular:</span>
            {QUICK_FILTERS.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-sm text-foreground/80 backdrop-blur transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                {f.label}
              </Link>
            ))}
          </div>

          <div className="rise-in mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground [animation-delay:300ms]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> Free for learners
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> No account required
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> Credit &amp; non-credit courses
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-card/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
              From search to signed up in three steps
            </h2>
            <p className="mt-3 text-muted-foreground">
              Finding the right training shouldn&apos;t take an hour of
              Googling. Here&apos;s the whole flow.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <Card
                key={step.title}
                className="relative p-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="absolute top-5 right-6 font-heading text-5xl font-bold text-foreground/[0.06]">
                  0{i + 1}
                </span>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
                  <step.icon className="size-6" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured trainings */}
      {featured.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Featured
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                Trainings learners are discovering
              </h2>
            </div>
            <ButtonLink
              variant="outline"
              size="lg"
              className="hidden shrink-0 sm:inline-flex"
              href="/directory"
            >
              Browse all
              <ArrowRight data-icon="inline-end" />
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Feature grid */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for learners
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Everything you need to choose with confidence
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group glass flex flex-col rounded-2xl border border-border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-clay/12 text-clay transition-colors group-hover:bg-clay group-hover:text-clay-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition-all group-hover:gap-2">
                  {f.cta}
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For trainers / pricing */}
      <section id="for-trainers" className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mx-auto gap-1.5 border border-clay/25 bg-clay/10 text-clay hover:bg-clay/15">
              <MousePointerClick data-icon="inline-start" />
              For {brand.terms.providers.toLowerCase()}
            </Badge>
            <h2
              id="pricing"
              className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl"
            >
              Get your trainings in front of the right learners
            </h2>
            <p className="mt-3 text-muted-foreground">
              Stop relying on a social following. List your courses where
              learners are already searching.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {PRICING.map((tier) => (
              <Card
                key={tier.id}
                className={
                  tier.highlighted
                    ? "relative flex h-full flex-col overflow-visible border-2 border-primary bg-gradient-to-b from-primary/[0.07] to-card p-7 shadow-xl shadow-primary/15"
                    : "flex h-full flex-col p-7"
                }
              >
                {tier.highlighted ? (
                  <Badge className="absolute -top-3 right-6 bg-clay text-clay-foreground shadow-md">
                    Most popular
                  </Badge>
                ) : null}
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {tier.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-bold text-foreground">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-foreground"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                        <Check className="size-3.5" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-7">
                  <ButtonLink
                    variant={tier.highlighted ? "clay" : "outline"}
                    size="lg"
                    className="w-full"
                    href="/signup"
                  >
                    Start free trial
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            30-day free trial · cancel anytime · founding members get 60 days.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[color-mix(in_oklab,var(--primary),var(--clay)_45%)] p-10 text-center text-primary-foreground shadow-2xl shadow-primary/25 sm:p-16">
          <div className="pointer-events-none absolute -top-20 -right-16 -z-10 size-72 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 -z-10 size-72 rounded-full bg-clay/40 blur-3xl" />
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold sm:text-4xl">
            Ready to find your next training?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Search the directory free — or list your own courses and reach
            learners actively looking to grow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink variant="clay" size="xl" href="/directory">
              Browse courses
            </ButtonLink>
            <ButtonLink
              variant="outline"
              size="xl"
              className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              href="/signup"
            >
              List your training
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
