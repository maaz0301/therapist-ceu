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
  Briefcase,
  Code2,
  HeartPulse,
  Scale,
  Megaphone,
  Palette,
  Clock,
  Users,
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
  { label: "Live online", href: "/directory?format=Live%20Virtual" },
  { label: "In person", href: "/directory?format=In-Person" },
  { label: "Self-paced", href: "/directory?format=On-Demand" },
  { label: "Hybrid", href: "/directory?format=Hybrid" },
];

const CATEGORIES = [
  { icon: Briefcase, label: "Leadership & management", q: "leadership" },
  { icon: Code2, label: "Tech & data", q: "data" },
  { icon: HeartPulse, label: "Health & wellbeing", q: "health" },
  { icon: Scale, label: "Compliance & ethics", q: "ethics" },
  { icon: Megaphone, label: "Sales & marketing", q: "marketing" },
  { icon: Palette, label: "Design & creative", q: "design" },
];

const STATS = [
  { icon: Clock, value: "60 sec", label: "to a shortlist" },
  { icon: Users, value: "Free", label: "for every learner" },
  { icon: ShieldCheck, value: "0", label: "middlemen or booking fees" },
];

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Tell us what you need",
    description:
      "Type a skill or pick a topic, then narrow by format, location, price and credits.",
  },
  {
    icon: ListChecks,
    title: "Shortlist and compare",
    description:
      "Save the ones you like and line up to three side by side: price, dates, format and credits.",
  },
  {
    icon: CalendarCheck,
    title: "Sign up with the trainer",
    description:
      "Go straight to their registration page. You pay the trainer, never us.",
  },
];

const FEATURES = [
  {
    icon: GitCompareArrows,
    title: "Side-by-side compare",
    description: "Put three courses in one table and see the real differences.",
    href: "/compare",
    cta: "Open compare",
  },
  {
    icon: CalendarDays,
    title: "Month-view calendar",
    description: "See every upcoming session by date and plan around your week.",
    href: "/calendar",
    cta: "View calendar",
  },
  {
    icon: BellRing,
    title: "Keyword alerts",
    description: "Tell us what you are after and we email you when a match appears.",
    href: "/saved",
    cta: "Create an alert",
  },
  {
    icon: Star,
    title: "Reviews that reply",
    description: "Ratings from past learners, with answers from the trainers themselves.",
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
  // The home page must still render if the database is briefly unreachable.
  const featured = await getFeaturedListings(4).catch(() => []);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[28rem] w-[34rem] rounded-full bg-primary/15 blur-[110px]" />
        <div className="pointer-events-none absolute top-20 -right-24 -z-10 h-80 w-80 rounded-full bg-clay/20 blur-[100px]" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge className="rise-in gap-1.5 border border-primary/25 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/15">
              <Sparkles className="size-3.5" />
              Training for every profession
            </Badge>

            <h1 className="rise-in mt-6 font-heading text-4xl leading-[1.05] font-bold tracking-tight text-foreground [animation-delay:60ms] sm:text-6xl">
              Learn the next thing{" "}
              <span className="gradient-text">in minutes, not hours.</span>
            </h1>

            <p className="rise-in mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground [animation-delay:120ms]">
              {brand.name} gathers courses and workshops from independent
              trainers into one place. Search, compare and sign up, all without
              creating an account.
            </p>

            <form
              action="/directory"
              className="rise-in glass mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border p-2 shadow-xl shadow-primary/10 transition-shadow [animation-delay:180ms] focus-within:shadow-2xl focus-within:shadow-primary/20"
            >
              <div className="flex flex-1 items-center gap-3 pl-3">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  name="q"
                  type="search"
                  placeholder="What do you want to learn?"
                  className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  aria-label="Search courses"
                />
              </div>
              <Button type="submit" variant="clay" size="xl">
                Find courses
              </Button>
            </form>

            <div className="rise-in mt-5 flex flex-wrap items-center gap-2 [animation-delay:240ms]">
              <span className="mr-1 text-sm text-muted-foreground">Browse:</span>
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
          </div>

          {/* Stat stack */}
          <div className="rise-in grid gap-4 [animation-delay:200ms]">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={
                  "glass flex items-center gap-4 rounded-2xl border border-border p-5 shadow-lg shadow-primary/5 " +
                  (i % 2 === 1 ? "lg:ml-6" : "")
                }
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
                  <s.icon className="size-6" />
                </span>
                <div>
                  <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Start with a topic
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={`/directory?q=${encodeURIComponent(c.q)}`}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-foreground">{c.label}</span>
              </Link>
            ))}
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
              Three steps from curious to enrolled
            </h2>
            <p className="mt-3 text-muted-foreground">
              No more twenty open tabs. Here is the whole journey.
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
                Fresh from our trainers
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
              Why learners stay
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Tools that make choosing easy
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
              Reach people who are ready to enrol
            </h2>
            <p className="mt-3 text-muted-foreground">
              Skip the ad spend. Put your courses where learners are already looking.
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
            Your next skill is a search away
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Browse for free, or share what you teach with learners who want it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink variant="clay" size="xl" href="/directory">
              Find a course
            </ButtonLink>
            <ButtonLink
              variant="outline"
              size="xl"
              className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              href="/signup"
            >
              Become a trainer
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
