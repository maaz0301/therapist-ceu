import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  GitCompareArrows,
  Search,
  Star,
  Check,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ListingCard } from "@/components/listing-card";
import { getFeaturedListings } from "@/lib/queries/directory";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const QUICK_FILTERS = [
  { label: "Live online", href: "/directory?formats=Live%20Virtual" },
  { label: "In person", href: "/directory?formats=In-Person" },
  { label: "Self-paced", href: "/directory?formats=On-Demand" },
  { label: "Hybrid", href: "/directory?formats=Hybrid" },
];

const TOPICS = [
  "Leadership",
  "Data & analytics",
  "Project management",
  "Marketing",
  "Design",
  "Finance",
  "Ethics & compliance",
  "Wellbeing",
  "Public speaking",
  "Product",
  "Sales",
  "AI",
];

const LEDGER = [
  { value: "60s", label: "from search to shortlist" },
  { value: "3", label: "courses compared side by side" },
  { value: "$0", label: "cost to learners, always" },
];

const STEPS = [
  {
    title: "Search what you need",
    text: "Type a skill, then narrow by format, location, price and credits.",
  },
  {
    title: "Shortlist and compare",
    text: "Save favourites and line up to three in one table: price, dates, format, credits.",
  },
  {
    title: "Sign up with the trainer",
    text: "Go straight to their registration page. You pay the trainer, never us.",
  },
];

const TOOLS = [
  {
    icon: GitCompareArrows,
    title: "Compare",
    text: "Three courses, one table, real differences.",
    href: "/compare",
    tone: "bg-primary text-primary-foreground",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    text: "Every upcoming session laid out by month.",
    href: "/calendar",
    tone: "bg-card text-foreground",
  },
  {
    icon: BellRing,
    title: "Alerts",
    text: "Get an email when a new course matches your keywords.",
    href: "/saved",
    tone: "bg-clay text-clay-foreground",
  },
  {
    icon: Star,
    title: "Reviews",
    text: "Honest ratings, with replies from the trainers.",
    href: "/directory",
    tone: "bg-card text-foreground",
  },
];

const PRICING = [
  {
    ...SUBSCRIPTION_TIERS.basic,
    blurb: "For trainers just getting started.",
    features: ["Up to 2 active listings", "Listing analytics", "Self-serve billing"],
    highlighted: false,
  },
  {
    ...SUBSCRIPTION_TIERS.pro,
    blurb: "For trainers with a full catalogue.",
    features: [
      "Unlimited active listings",
      "Listing analytics",
      "Self-serve billing",
      "Priority placement (coming soon)",
    ],
    highlighted: true,
  },
];

export default async function HomePage() {
  // The home page must still render if the database is briefly unreachable.
  const featured = await getFeaturedListings(4).catch(() => []);

  return (
    <>
      {/* Hero */}
      <section className="paper-dots border-b-2 border-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="inline-block rounded-md border-2 border-foreground bg-card px-2.5 py-1 text-xs font-bold tracking-widest uppercase">
              The training directory
            </p>
            <h1 className="mt-6 font-heading text-5xl leading-[0.98] font-semibold text-foreground sm:text-7xl">
              Training worth <span className="gradient-text">your time.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Courses and workshops from independent trainers, gathered in one
              place. Search, compare and sign up in minutes, with no account
              needed.
            </p>

            <form
              action="/directory"
              className="hard mt-8 flex w-full max-w-xl items-center gap-2 rounded-xl bg-card p-2"
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
                Search
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {QUICK_FILTERS.map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className="rounded-md border-2 border-foreground bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Ledger */}
          <aside className="hard self-center rounded-xl bg-card lg:col-span-5">
            <p className="border-b-2 border-foreground px-5 py-3 text-xs font-bold tracking-widest uppercase">
              Why it&apos;s faster
            </p>
            <ul className="divide-y-2 divide-foreground">
              {LEDGER.map((l) => (
                <li key={l.label} className="flex items-baseline gap-4 px-5 py-5">
                  <span className="font-heading text-5xl font-semibold text-primary">
                    {l.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{l.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Topic strip */}
      <section className="border-b-2 border-foreground bg-foreground text-background">
        <div className="mx-auto no-scrollbar flex w-full max-w-6xl items-center gap-6 overflow-x-auto px-4 py-4 sm:px-6">
          <span className="shrink-0 text-xs font-bold tracking-widest uppercase text-clay">
            Browse by topic
          </span>
          <ul className="flex items-center gap-6 whitespace-nowrap text-sm font-medium">
            {TOPICS.map((t) => (
              <li key={t}>
                <Link
                  href={`/directory?q=${encodeURIComponent(t.split(" ")[0].toLowerCase())}`}
                  className="underline-offset-4 hover:text-clay hover:underline"
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold tracking-widest text-clay uppercase">How it works</p>
            <h2 className="mt-3 font-heading text-4xl leading-tight font-semibold sm:text-5xl">
              Three steps. No tab overload.
            </h2>
          </div>
          <ol className="lg:col-span-8">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="grid grid-cols-[4rem_1fr] items-baseline gap-4 border-t-2 border-foreground py-7 last:border-b-2 sm:grid-cols-[6rem_1fr]"
              >
                <span className="font-heading text-5xl font-semibold text-primary sm:text-6xl">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-heading text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-1.5 max-w-lg text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 ? (
        <section className="border-y-2 border-foreground bg-secondary/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-clay uppercase">Featured</p>
                <h2 className="mt-3 font-heading text-4xl font-semibold sm:text-5xl">
                  Fresh from our trainers
                </h2>
              </div>
              <ButtonLink variant="outline" size="lg" className="hidden shrink-0 sm:inline-flex" href="/directory">
                See all
                <ArrowRight data-icon="inline-end" />
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Tools bento */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-bold tracking-widest text-clay uppercase">Built for learners</p>
        <h2 className="mt-3 max-w-2xl font-heading text-4xl font-semibold sm:text-5xl">
          Tools that make choosing easy
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className={`hard hard-hover group flex min-h-48 flex-col justify-between rounded-xl p-6 ${t.tone}`}
            >
              <div className="flex items-start justify-between">
                <t.icon className="size-7" />
                <ArrowUpRight className="size-5 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <h3 className="font-heading text-2xl font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm opacity-80">{t.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trainers / pricing */}
      <section id="for-trainers" className="border-t-2 border-foreground bg-secondary/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-bold tracking-widest text-clay uppercase">For trainers</p>
              <h2 id="pricing" className="mt-3 font-heading text-4xl leading-tight font-semibold sm:text-5xl">
                Reach people ready to enrol.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Skip the ad spend. List your courses where learners are already
                looking, and keep every booking for yourself.
              </p>
              <p className="mt-6 text-sm font-medium">
                30-day free trial · cancel anytime · founding members get 60 days.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
              {PRICING.map((tier) => (
                <div
                  key={tier.id}
                  className={`hard flex h-full flex-col rounded-xl p-7 ${
                    tier.highlighted ? "bg-clay text-clay-foreground" : "bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-2xl font-semibold">{tier.label}</h3>
                    {tier.highlighted ? (
                      <span className="rounded-md border-2 border-current px-2 py-0.5 text-xs font-bold uppercase">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm opacity-80">{tier.blurb}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-heading text-6xl font-semibold">${tier.price}</span>
                    <span className="text-sm opacity-80">/month</span>
                  </div>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <Check className="size-4 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-7">
                    <ButtonLink
                      variant={tier.highlighted ? "default" : "outline"}
                      size="lg"
                      className="w-full"
                      href="/signup"
                    >
                      Start free trial
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section className="bg-foreground text-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center">
          <h2 className="max-w-xl font-heading text-4xl leading-tight font-semibold sm:text-5xl">
            Your next skill is one search away.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink variant="clay" size="xl" href="/directory">
              Find a course
            </ButtonLink>
            <ButtonLink
              variant="outline"
              size="xl"
              className="border-background/50 bg-transparent text-background hover:bg-background hover:text-foreground"
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
