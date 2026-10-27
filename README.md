# TherapistCEU

A paid, searchable directory where trainers list continuing-education (CE) courses for therapists, with an admin area to control what gets published.

**Live:** https://therapistceu.com

## What it does

- Public directory with full-text search, filters and listing pages
- Trainer dashboard: create and manage listings, billing and analytics
- Stripe subscription tiers (Basic / Pro) that cap how many listings a trainer can publish; webhooks keep billing in sync
- Admin area for trainers, listings and tags
- Scheduled jobs (Vercel cron) that expire listings and send renewal reminders
- Transactional email through SendGrid

## Stack

Next.js (App Router) · TypeScript · Supabase (auth, storage, Postgres with row-level security) · Drizzle ORM · Stripe · SendGrid · Tailwind CSS · Vercel

## Running locally

```bash
npm install
# create .env with your Supabase, Stripe and SendGrid values
npm run db:push        # create the schema
npm run dev
```

Environment variables (Supabase, Stripe, SendGrid, app URL) are required and are never committed; `.env*` is git-ignored.
