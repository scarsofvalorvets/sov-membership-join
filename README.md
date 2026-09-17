# SoV Membership Join

Next.js (App Router, TypeScript) membership join application for **Scars of Valor Foundation**, a 501(c)(3) nonprofit.

## Features

- Landing page with membership application form (name, email, optional phone, tier, optional service note for free tiers)
- **Free tiers** (Veteran, First Responder): creates a Stripe Customer with metadata — no charge — then redirects to `/thank-you`
- **Paid tiers** (Community Supporter $120/yr, Guardian $250/yr, Legacy $500/yr): creates a Stripe Checkout Session (`mode=subscription`) and redirects to Stripe
- `/success` and `/cancel` pages for Checkout return URLs

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Stripe Node SDK (server-side Checkout + Customers)

## Setup

```bash
cp .env.example .env.local
# Fill in Stripe keys and confirm price IDs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_test_…` / `sk_live_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Publishable key (reserved for future client use) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public origin, no trailing slash (e.g. `http://localhost:3000`) |
| `STRIPE_PRICE_COMMUNITY_SUPPORTER` | Yes (paid) | Annual Price ID for Community Supporter |
| `STRIPE_PRICE_GUARDIAN` | Yes (paid) | Annual Price ID for Guardian |
| `STRIPE_PRICE_LEGACY` | Yes (paid) | Annual Price ID for Legacy |

Default Price IDs are documented in `.env.example` (verify in Stripe Dashboard before going live).

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Out of scope

Member portal/login, transactional email, and admin tooling are intentionally not included.

## Project layout

```
src/
  app/
    page.tsx              # Landing + join form
    success/page.tsx      # Paid Checkout success
    cancel/page.tsx       # Checkout canceled
    thank-you/page.tsx    # Free-tier confirmation
    api/join/route.ts     # Creates Checkout Session or free Customer
  components/
    JoinForm.tsx
  lib/
    tiers.ts
    stripe.ts
    join-schema.ts
```
