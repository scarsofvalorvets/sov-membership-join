# SoV Membership + Member Registry

Next.js 16 (App Router, TypeScript, Tailwind v4) app for **Scars of Valor Foundation**, a 501(c)(3) serving Veterans and First Responders.

It does two jobs:

1. **Join** — the membership application at `/` (unchanged behavior): free Veteran / First Responder tiers and paid annual tiers through Stripe Checkout.
2. **Member registry** — a Together We Served–style registry where members build a service record, find their units, and reconnect.

## What it does

| Area | Routes | Notes |
|------|--------|-------|
| Join | `/`, `/api/join`, `/success`, `/cancel`, `/thank-you` | Join now also creates (or links) the member account. Paid tiers → Stripe Checkout; free tiers → Stripe Customer. **With no `STRIPE_SECRET_KEY`, Stripe is skipped entirely** (local dev). |
| Sign in | `/signin`, `/signin/check-email`, `/api/auth/*` | Email magic link (Auth.js). Local dev prints the link to the server console; optional dev-only login for seeded accounts. |
| Account | `/account` | Name, private phone, membership tier/status, role, verified status, blocked members, sign out. |
| My Service Record | `/record`, `/members/[id]` | Display name, photo, branch/agency, status, rank/title, MOS/rating/specialty, years, hometown/state, bio. Service history entries (unit + role + dates), deployments/assignments, awards. Visibility: **members-only (default)**, public, hidden. Every public field is a separate opt-in. |
| Units | `/units`, `/units/[id]`, `/units/new` | Browse/search by branch or agency. Unit page: description, parent/subordinate units, roster of opted-in members with dates, unit wall (text + photo). Members can propose units; new units are **pending** until an admin approves. |
| Directory | `/directory` | Search by name, branch/agency, unit, served-in year, state, status. Paginated. Hidden profiles never appear; members-only profiles require sign-in; signed-out visitors see only public profiles, and only through fields those members opted in publicly. |
| Messages | `/messages`, `/messages/[id]`, `/messages/new` | 1:1 direct messages, inbox, threads, unread count in the header. No emails or phones are exposed. Block a member; report a message. |
| Looking For | `/looking-for` | Post who you're looking for (unit, timeframe, description). Others reply by DM. Author can close a post. Report a post. |
| Admin | `/admin`, `/admin/reports`, `/admin/members` | Admin role only. Approve/reject pending units, review reports (hide/restore content, dismiss), toggle **Verified** badge, hide/unhide profiles, hide wall posts / Looking For posts. |
| Stripe webhook | `/api/stripe/webhook` | Marks paid memberships active after Checkout and canceled when a subscription ends. Needs `STRIPE_WEBHOOK_SECRET`. |

### Privacy rules built in

- No SSNs. No DD-214 or document uploads. "Verified" is a manual admin toggle after an offline conversation.
- Email and phone are never shown to other members (only the owner sees them, in `/account`).
- Profile visibility defaults to **members-only**. Public visibility shows only the display name plus each field the member checks.
- Hidden profiles (member-set or admin-set) don't appear in the directory, rosters, or to other members.
- Magic-link sign-in shows the same "check your email" page for unknown addresses, so it can't be used to find out who is a member. Join also responds the same way for new and existing emails.
- Blocks work both ways: no DMs, and each side is removed from the other's directory, walls, and Looking For board.
- Uploaded images are checked by magic bytes (JPEG/PNG/WebP only, 5 MB max) and stored under random keys.

## Stack

- **Next.js 16** App Router, React 19, Tailwind CSS v4, Server Actions for forms.
- **Prisma 7** ORM. SQLite (via the libSQL driver adapter) locally; Postgres (via `@prisma/adapter-pg`) in production. The adapter is picked from `DATABASE_URL` in `src/lib/db.ts`.
- **Auth.js (next-auth v5)** with the Prisma adapter: email magic links + a dev-only credentials login. JWT sessions; role/tier/verified are re-read from the DB on every request (`src/lib/session.ts`).
- **Storage abstraction** in `src/lib/storage/` (local disk driver now; S3 / Vercel Blob later).
- **Stripe** Node SDK (unchanged Join behavior + webhook).

## Local setup

Requires Node.js 20.9+.

```bash
cp .env.example .env.local      # defaults work for local dev; set AUTH_SECRET
npm install                     # also runs `prisma generate`
npx prisma migrate dev          # creates ./dev.db and applies migrations
npm run db:seed                 # loads EXAMPLE data (fictional people/units)
npm run dev
```

Open http://localhost:3000.

### Test logins (seeded example data)

With `AUTH_DEV_LOGIN=true` (local only) the sign-in page has a **Dev login** box. Enter one of:

| Email | Who | Role |
|-------|-----|------|
| `admin@example.org` | Example Admin | admin |
| `member@example.org` | Example Member | member |
| `jordan@example.org` | Jordan Example | member |

Other seeded accounts: `alex@`, `sam@`, `taylor@`, `casey@`, `riley@`, `morgan@`, `drew@`, `jamie@`, `pat@`, `chris@`, `robin@`, `quinn@example.org` (Quinn is a hidden profile).

To test the real magic-link path instead: enter the email in **Email me a sign-in link**. No email is sent; the link is printed in the `npm run dev` console. Paste it into the browser.

`npm run db:seed` wipes the registry tables and reloads the example data. It refuses to run with `NODE_ENV=production`.

## Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # unit tests (node:test via tsx): privacy rules, validation, uploads, webhook mapping
npm run smoke       # end-to-end browser smoke test + screenshots (see below)
npm run db:migrate  # prisma migrate dev
npm run db:deploy   # prisma migrate deploy (production)
npm run db:seed     # load example data
npm run db:reset    # drop, re-migrate, re-seed (local)
```

### End-to-end smoke test

`scripts/smoke.mjs` drives a real browser (Playwright + local Chrome) through: Join (free + paid without Stripe), magic-link sign-in, editing the service record (incl. photo upload), adding a unit history entry and proposing a unit, posting to a unit wall, directory searches, sending a DM and seeing it in the other member's inbox, posting on Looking For, report/block/unblock, admin approving a unit, reviewing reports, verifying a member, and signed-out privacy checks. It saves screenshots.

```bash
npm run db:seed
npm run dev > /tmp/sov-dev.log 2>&1 &
DEV_LOG=/tmp/sov-dev.log SHOTS_DIR=./test-results/shots npm run smoke
```

`CHROME_PATH` defaults to `/usr/bin/google-chrome`. The script changes the dev DB; re-seed afterwards.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Prod: yes | Public origin, no trailing slash (e.g. `https://join.scarsofvalor.org`). Dev falls back to the request origin. |
| `DATABASE_URL` | Yes | `file:./dev.db` locally; `postgresql://…` in production. |
| `AUTH_SECRET` | Yes | Random secret for Auth.js. `npx auth secret`. |
| `AUTH_TRUST_HOST` | Self-hosting | `true` when running `next start` behind a proxy (Vercel sets it automatically). |
| `AUTH_DEV_LOGIN` | No | `true` enables the seeded-account dev login. Ignored when `NODE_ENV=production`. Never set in a deployed environment. |
| `EMAIL_SERVER` | Prod: yes | SMTP URL for magic links, e.g. `smtp://user:pass@smtp.provider.com:587`. Unset → links are printed to the console and nothing is sent. |
| `EMAIL_FROM` | Prod: yes | Sender, e.g. `Scars of Valor Foundation <no-reply@scarsofvalor.org>`. |
| `STORAGE_DRIVER` | No | `local` (default). Add a driver for S3/Blob before deploying to serverless. |
| `UPLOADS_DIR` | No | Local driver folder (default `uploads`, gitignored). |
| `STRIPE_SECRET_KEY` | Prod: yes | Unset → Stripe is skipped (local dev). In production, paid tiers return an error if it's missing. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Reserved for future client use. |
| `STRIPE_WEBHOOK_SECRET` | Prod: yes | Signing secret for `/api/stripe/webhook`. |
| `STRIPE_PRICE_COMMUNITY_SUPPORTER` / `_GUARDIAN` / `_LEGACY` | No | Annual Price IDs. Defaults (the existing live prices) are in `src/lib/tiers.ts`. |

## Switching to Postgres (production)

The schema avoids SQLite- or Postgres-only features (no native enums, JSON, or arrays; enumerated values are strings validated in `src/lib/constants.ts`; case-insensitive search uses a lower-cased `searchName` column). To switch:

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL=postgresql://…` (Neon, Supabase, Vercel Postgres, RDS, etc.).
3. The committed migrations in `prisma/migrations/` are SQLite SQL. For a fresh production database, create a Postgres baseline once:
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init      # against a Postgres dev/staging DB
   ```
   Commit that on the production branch, then deploy with `npx prisma migrate deploy`.
4. No code changes: `src/lib/db.ts` uses `@prisma/adapter-pg` automatically when `DATABASE_URL` starts with `postgres`.

Don't seed production. Create the first admin by setting `role = 'admin'` on that member's row (e.g. `npx prisma studio`, or SQL: `UPDATE "User" SET role='admin' WHERE email='…';`).

## File storage

`src/lib/storage/types.ts` defines a small `StorageDriver` interface (`put`, `get`, `delete`, `url`). The `local` driver writes to `UPLOADS_DIR` and serves files through `/api/uploads/<key>`. That works on a single persistent server but **not** on Vercel/serverless (the filesystem is ephemeral). Before going live on a serverless host, add an S3 / Cloudflare R2 / Vercel Blob driver implementing the same interface and select it in `src/lib/storage/index.ts` via `STORAGE_DRIVER`.

## Go-live checklist

- [ ] **Hosting account** (e.g. Vercel Pro for a nonprofit org, or Render/Fly/Railway). Connect this repo; set the environment variables above.
- [ ] **Production Postgres** (Neon / Supabase / Vercel Postgres). Switch the provider (see above), run `prisma migrate deploy`.
- [ ] **Email sender for magic links**: an SMTP-capable provider (Postmark, Resend, SendGrid, Amazon SES, or Google Workspace SMTP relay). Verify the sending domain (SPF/DKIM/DMARC DNS records for `scarsofvalor.org`), then set `EMAIL_SERVER` and `EMAIL_FROM`.
- [ ] **Object storage for photos** (Vercel Blob, S3, or R2) and a storage driver, if hosting on serverless.
- [ ] **DNS**: CNAME `join.scarsofvalor.org` to the host (e.g. `cname.vercel-dns.com`). Set `NEXT_PUBLIC_APP_URL=https://join.scarsofvalor.org`.
- [ ] **Stripe**: live `STRIPE_SECRET_KEY` (a restricted key is fine), confirm the three Price IDs, create a webhook endpoint `https://join.scarsofvalor.org/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.deleted`, and set `STRIPE_WEBHOOK_SECRET`.
- [ ] `AUTH_SECRET` generated for production; `AUTH_DEV_LOGIN` **not** set.
- [ ] First admin account promoted (see above).
- [ ] Privacy policy / terms page reviewed and linked from the footer.

## Known gaps / next steps

- No rate limiting on sign-in, messaging, or posting yet (add at the edge or with a KV store before launch).
- Messages and wall posts are plain text; no editing or deletion by authors yet (admins can hide).
- Only the local storage driver exists.
- Paid tiers stay "payment pending" until the Stripe webhook is configured.

## Project layout

```
prisma/
  schema.prisma          # data model (SQLite dev, Postgres-ready)
  migrations/            # SQLite migrations (see "Switching to Postgres")
  seed.ts                # EXAMPLE data + test accounts
prisma.config.ts         # Prisma CLI config (loads .env.local)
scripts/smoke.mjs        # browser end-to-end smoke test + screenshots
src/
  auth.ts                # Auth.js config (magic link + dev login)
  app/
    page.tsx             # Landing + join form
    api/join/route.ts    # Join: account + Stripe (or dev skip)
    api/stripe/webhook/  # Stripe webhook
    api/uploads/[...key] # local storage file server
    actions/             # Server Actions (record, units, messages, safety, admin, …)
    record/ members/ directory/ units/ messages/ looking-for/ account/ admin/ signin/
  components/            # UI kit, header, member card, safety forms
  lib/
    db.ts                # Prisma client + driver adapter selection
    visibility.ts        # privacy rules (unit tested)
    storage/             # storage abstraction + image validation
    tiers.ts stripe.ts join-schema.ts join-service.ts stripe-webhook.ts
    constants.ts dates.ts messaging.ts session.ts email.ts
```
