# ONE MILLION

A deliberately minimal viral social experiment: can the internet collectively contribute $1,000,000? No cause, no reward, no explanation — just one ridiculous goal.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, and Stripe (test mode).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it.

## Database setup

This project uses PostgreSQL via Prisma. The recommended option is a free [Neon](https://neon.tech) database (Vercel's Postgres integration is also Neon-backed, so either path works).

1. Create a Postgres database — either through the Vercel dashboard (**Storage → Create Database → Postgres**) or directly at [neon.tech](https://neon.tech).
2. From the connection details, copy:
   - The **pooled** connection string (usually has `-pooler` in the hostname) into `DATABASE_URL`.
   - The **direct** connection string (no `-pooler`) into `DIRECT_URL`.
3. Copy `.env.example` to `.env` (or `.env.local`) and paste both values in:
   ```bash
   cp .env.example .env
   ```
   Env files matching `.env*` are gitignored and never committed (`.env.example` is the one exception, since it has no real values).
4. Apply the schema and seed the one starting campaign:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

This creates the `Campaign`, `Contribution`, and `WebhookEvent` tables and inserts a single campaign (`ONE MILLION`, target `$1,000,000`, confirmed amount `$0`). No fake contributions are ever seeded.

### Why two connection strings?

Neon's pooled connection is best for the running app (many short-lived serverless connections); Prisma Migrate needs the direct connection for schema changes. `prisma.config.ts` uses `DIRECT_URL` for migrations; `src/lib/prisma.ts` uses `DATABASE_URL` for the app at runtime.

## Payments: mock mode vs. Stripe test mode

`PAYMENTS_MODE` controls which checkout provider is active:

- **`PAYMENTS_MODE=mock`** (default for local dev) — no external calls at all. Checkout redirects to a local `/mock-checkout/[id]` page with a "Simulate successful payment" button. Always blocked when `NODE_ENV=production`.
- **`PAYMENTS_MODE=stripe`** — uses real Stripe-hosted Checkout in **test mode**. No live keys are ever used, and no real money moves. Fails closed (refuses checkouts with a clear error) if `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `PAYMENT_CURRENCY=usd` aren't all correctly set — it never attempts a half-configured Stripe call.

### Setting up a Stripe sandbox for local testing

1. Create a free account at [stripe.com](https://stripe.com) if you don't have one. New accounts start in **test mode** automatically — no business verification needed for that.
2. In the Dashboard, go to **Developers → API keys**. Copy:
   - The **Secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY`.
   - The **Publishable key** (`pk_test_...`) into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

   Put these in `.env` or `.env.local` — never commit them, never paste them anywhere else.
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```
4. Authenticate it against your account:
   ```bash
   stripe login
   ```
5. With the app running (`npm run dev`), start a local webhook listener in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   This prints a signing secret like `whsec_...`. Copy it into `STRIPE_WEBHOOK_SECRET`. This value is regenerated each time you restart `stripe listen` — update it if you restart the listener.
6. Set `PAYMENTS_MODE=stripe` and `PAYMENT_CURRENCY=usd` and restart the dev server.
7. On the Stripe-hosted Checkout page, use the test card `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC, and any postal code to simulate a successful payment.

To go back to mock mode at any time, set `PAYMENTS_MODE=mock` and restart the dev server.

## Admin authentication

There is a single admin account, protected by a hand-written session (no public registration, no password reset, no roles — by design, for this single-admin app). The dashboard itself isn't built yet; this stage only ships login, logout, and a placeholder protected page proving the authentication works.

### One-time setup

1. Generate a session-signing secret and put it in `.env.local` (not `.env`) as `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
   This must be at least 32 characters. Admin login fails closed (refuses to issue or verify any session) if it's missing or too short. Like the rest of your local secrets, keep it in `.env.local`, never `.env`.
2. Temporarily set two more variables, also in `.env.local`, not `.env` — pick your own values, not the ones shown here:
   ```
   ADMIN_EMAIL=
   ADMIN_INITIAL_PASSWORD=
   ```
   `ADMIN_INITIAL_PASSWORD` is bootstrap-only: the script below reads it once to set the account's password, and the running application never reads this variable again afterward (the database is the source of truth for the admin's email and password from then on).
3. Run the bootstrap script:
   ```bash
   npx tsx scripts/create-admin.ts
   ```
   It refuses to run at all if either variable is missing, and never prints either value.
4. **Immediately remove `ADMIN_INITIAL_PASSWORD` from `.env.local`.** It has no further use, and leaving it there is unnecessary exposure.
5. Visit `/admin/login` and sign in with the email and password you just set.

Re-running the script later (with a new `ADMIN_INITIAL_PASSWORD`) updates the same account's password and clears any active lockout.

### How sessions work

- A signed (HMAC-SHA-256), httpOnly, `SameSite=Strict` cookie — `Secure` in production — valid for 8 hours.
- Five wrong passwords in a row locks the account for 15 minutes (tracked in the database, so it survives restarts); a correct login resets the count. Login responses never reveal whether the email exists, the password was wrong, or the account is locked — the message is identical in all three cases.
- `src/proxy.ts` does a fast, cookie-only redirect for obviously unauthenticated requests to `/admin/*`, but it is **not** the real security boundary — every protected page, Server Action, and Route Handler calls `requireAdmin()`/`verifyAdminSession()` (`src/lib/admin/auth.ts`) independently.

## Project structure

- `src/app` — pages and API routes (checkout, Stripe webhook, contribution status, share, admin)
- `src/components` — landing page UI
- `src/lib` — money formatting, Prisma client, campaign data access, payment providers, webhook handlers, admin auth
- `src/proxy.ts` — optimistic admin-route redirect (not the security boundary — see above)
- `prisma/schema.prisma` — database schema
- `prisma/seed.ts` — seeds the starting campaign
- `scripts/create-admin.ts` — one-time admin account bootstrap

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run lint    # run ESLint
npm run test    # run the Vitest suite
```

## Current status

Implemented through Phase 4, plus Phase 5A (admin authentication foundation) of the project spec (see `PROJECT_SPEC.md`): landing page UI, database-backed campaign statistics, a full mock contribution flow, Stripe-hosted Checkout in test mode with verified, idempotent webhooks and refund handling, and admin login/logout with a protected placeholder page. The admin dashboard itself, contribution moderation, campaign settings, CSV export, legal pages, and CSP are not built yet.
