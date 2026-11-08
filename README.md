# Skillhive

A searchable directory of professional courses and trainings. Learners search, compare, save and get keyword alerts; trainers list courses on a subscription and respond to reviews; admins moderate what is published.

**Live:** https://skillhive-courses.vercel.app

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Supabase (Auth, Postgres, Storage), Drizzle ORM, Stripe subscriptions, Nodemailer SMTP.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Stripe and SMTP values
npm run dev
```

Useful scripts: `npm run db:sync-tags` (sync the tag list), `npx tsx db/seed-demo.mts` (demo courses), `GET /api/health` (deployment self-check).

## Branding

Names and wording live in `lib/brand.ts`; colours are tokens in `app/globals.css`.
