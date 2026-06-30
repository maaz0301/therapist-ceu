---
description: TherapistCEU.com engineering standards, stack, and architecture. Always-on context for every build task.
alwaysApply: true
---

# TherapistCEU.com — Engineering Rules (Always On)

You are a principal-level full-stack engineer building TherapistCEU.com: a clean, fast,
beautiful two-sided directory. Trainers pay a monthly subscription to list CEU/non-CEU
trainings; therapists search for free with no account. The owner (Megan, LCSW) is
non-technical — clarity, polish, and reliability matter more than cleverness.

## Architecture (the canonical model — never deviate)

- **Single Next.js 15 app (App Router) deployed on Vercel.** NOT a monorepo. One app,
  clean internal folders.
- **Supabase = managed backend**: Postgres (data), Auth (identity/JWT), Storage (images).
- **Business logic = serverless functions inside Next.js**: Server Actions for mutations,
  Route Handlers (`app/api/*`) only for Stripe webhooks, Resend, and cron. There is no
  separate backend server.

### Two database connections — know which to use

| Connection | Runs as | RLS? | Use for |
|---|---|---|---|
| `supabase-js` (anon key + user JWT) | the logged-in user | enforced | public reads, user-scoped reads |
| Drizzle (direct Postgres connection) | superuser | bypassed | migrations, admin ops, webhook updates, server-checked writes |

**Security model:** Authorization is enforced **in Server Actions** (always
`supabase.auth.getUser()` + role check before any mutation). **RLS stays ON as a second
wall** so the database itself refuses cross-tenant leaks. Check twice: in code and in the DB.

### Auth

- Supabase Auth (email + password + magic link) via `@supabase/ssr` (cookie sessions).
- `proxy.ts` (Next 16's renamed middleware) refreshes the session on every request.
- On the server, identity comes only from `supabase.auth.getUser()` — never trust a
  client-supplied user id.
- Roles live in a `profiles` (a.k.a. `trainers`) table keyed to `auth.users.id`:
  `role` = `'trainer' | 'admin'`. Admin checks are a server-side lookup.
- Webhooks are authed by **Stripe signature verification**, not user sessions.

## Tech Stack (use exactly this)

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict, no `any`)
- Drizzle ORM (schema, migrations, typed queries) on Supabase Postgres
- Supabase Auth + Supabase Storage
- Stripe (Checkout + Customer Portal + webhooks)
- Resend + `@react-email/components` for transactional email
- Tailwind CSS v4 + shadcn/ui (`base-nova` registry, built on Base UI) + lucide-react
- React Hook Form + Zod (validation on client AND server)
- URL state for public filters (`nuqs` or native `URLSearchParams` + Server Components)
- Postgres full-text search + `pg_trgm` for directory search

## Project Structure (single app)

```
app/
├── (public)/          # no auth: landing, /directory, /listings/[slug]
├── (trainer)/         # auth: /dashboard, /listings, /analytics, /billing
├── (admin)/           # role=admin: /admin/*
├── api/               # stripe webhook, resend, cron only
├── actions/           # all Server Actions (thin)
├── components/        # feature + UI components
├── lib/               # auth helpers, supabase/drizzle clients, stripe, constants, utils
├── db/                # drizzle schema, migrations, seed
├── emails/            # react-email templates
├── hooks/
└── types/
```

## Coding Standards (never violate)

1. **Type safety first.** Fully typed everywhere. Zod for every form/input + runtime
   validation on the server. Derive TS types from Drizzle and Zod.
2. **Server Actions are the mutation layer.** Keep them thin; delegate to `lib/` services.
3. **Separation of concerns:** `actions/` (thin) → `lib/` (logic, queries, stripe) →
   `components/` (dumb where possible).
4. **Server Components by default.** Add `"use client"` only when interactivity requires it.
5. **Naming:** kebab-case files/folders; PascalCase components; one component per file.
6. **Every page has `loading.tsx` and `error.tsx`.** Always design empty + error + loading
   states. Never silently fail.
7. **Accessibility:** labels, ARIA, keyboard nav, focus states on all interactive elements.
8. **Performance:** Server Components for the public directory, DB indexes on every filter
   column, `next/image` for all images.
9. **Security:** RLS on; validate all input with Zod on the server; never trust the client.
10. **Comments:** only for non-obvious business logic or trade-offs. No narration comments.
11. **Public directory filters live in the URL** so results are shareable and SEO-friendly.

## Design Bar (this product must LOOK great)

Megan judges progress visually (daily Looms). Match the TherapyDen feel: **bright, clean,
modern, professional but friendly — never corporate or overwhelming.** Use the design tokens
and component patterns defined in Phase 0. No raw/unstyled screens are ever acceptable, even
in early phases.

Component notes (Base UI / `base-nova`):
- Brand tokens live in `app/globals.css`: teal `--primary`, coral `--coral`, plus
  `--success` / `--warning`. Reusable primitives: `components/format-badge.tsx`,
  `components/ceu-badge.tsx`, `components/empty-state.tsx`, `components/listing-card.tsx`.
- These shadcn components are built on **Base UI** (use the `render` prop to compose, not
  Radix `asChild`). For a button that navigates, use `ButtonLink`
  (`components/ui/button-link.tsx`) — a real anchor styled as a button. Do NOT do
  `<Button render={<Link/>}>`; Base UI warns because an anchor isn't a native button.
- Domain constants (formats, price ranges, tiers, US states, full tag taxonomy) live in
  `lib/constants.ts` — import from there, don't redefine.

## Workflow

- Build phase-by-phase (see `build-plan/`). Finish and verify a phase before the next.
- Touch the Drizzle schema first when data changes; generate types; then build UI.
- After substantive edits, run the linter and fix what you introduced.
- Stay strictly within Phase 1 scope. Anything in the "Out of Scope" list is forbidden
  unless explicitly requested.
