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

There is a single admin account, protected by a hand-written session (no public registration, no password reset, no roles — by design, for this single-admin app).

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

## Admin dashboard

Once logged in:

- **`/admin`** — campaign totals (confirmed/pending/failed/refunded, all in integer cents under the hood), progress toward the target, contributions created today/in the last 7 days (UTC), a recorded-webhook-failures count, simple daily/hourly activity charts (plain HTML/CSS bars — no charting library), and the 10 most recent contributions.
- **`/admin/contributions`** — the full contribution list, paginated, filterable by status, newest first. Each row shows the contributor's actual submitted name (for admin audit) plus a separate "hidden from public" indicator, and a button to hide/restore that name from public-facing pages.
- **`/admin/settings`** — pause/resume the campaign, and edit the target amount.
- **`/admin/export`** — downloads a CSV of all contributions (admin-only, never cached).

A few things worth knowing about how these work:

- **Pausing only blocks *new* checkout creation.** It never blocks confirming a payment Stripe already collected, processing a refund, or reconciling an existing contribution — `confirmContribution()` deliberately does not check the campaign's pause state.
- **Hiding a name** only ever affects public-facing output (the share endpoint, etc.) — admins always see the real submitted name in the dashboard, contributions list, and CSV, for audit purposes. An anonymous contribution stays anonymous regardless of this flag.
- **No admin control can mark a payment as paid, confirm a pending contribution, or edit a confirmed total/contributor count.** Those values are only ever touched by the verified payment and refund logic.

## Legal and transparency pages

`/about`, `/terms`, `/privacy`, and `/refunds` are public pages linked from a footer on the landing page and from each other. **They are development-stage drafts, not legal advice**, and every one of them displays a banner saying so. They:

- Never invent a legal entity, address, jurisdiction, registration, refund entitlement, or intended use of funds — anything not yet decided is shown as an explicit bracketed placeholder (e.g. `[OPERATING JURISDICTION]`, `[REFUND POLICY]`).
- Read two optional environment variables for the parts that *are* known: `LEGAL_ENTITY_NAME` and `CONTACT_EMAIL` (see `.env.example`). Leaving either unset never crashes the page — it just renders `[LEGAL ENTITY NAME]` / `[CONTACT EMAIL]` instead.
- State only what the current implementation actually does (e.g. the privacy page says there's no analytics/advertising tracking because there genuinely isn't any in this codebase).

**These pages are statically prerendered at build time** (they have no per-request data dependency, just the two env vars above), which is also what makes them cheaply cacheable. This has a real consequence: **`LEGAL_ENTITY_NAME` and `CONTACT_EMAIL` must be set *before* running `npm run build`** — they're read once during the build, not on each request. Changing either value in production means **rebuilding and redeploying**, not just updating an environment variable in place; a value changed only in the hosting platform's dashboard without a rebuild will not appear on the live pages.

**This project must not be treated as legally ready to accept real payments.** Professional legal review is required before that, and the placeholders above are exactly the list of things that review needs to resolve — the legal pages remain draft templates until that review happens, regardless of whether `LEGAL_ENTITY_NAME`/`CONTACT_EMAIL` are configured.

## Security headers and Content Security Policy

Centralized in `next.config.ts` / `src/lib/securityHeaders.ts`, applied to every response:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`
- `Content-Security-Policy` (see below)
- `Strict-Transport-Security` — **production only**, and intentionally just `max-age=31536000` (1 year), with no `includeSubDomains` and no `preload`. Local dev runs over plain HTTP, where this header would actively break things, so it only appears once `NODE_ENV=production` (verified against a real `npm run start` response, not just `next dev`). `includeSubDomains` and `preload` apply HSTS far beyond this one host — every current and future subdomain, and (for `preload`) browser preload lists that are slow and difficult to reverse once submitted. Both should only be turned on after the final production domain *and every subdomain that will ever be served* are confirmed to support HTTPS permanently; turning either on prematurely risks locking out a future HTTP subdomain or a domain change for a very long time.

`/api/*` and `/admin/*` additionally get `Cache-Control: no-store`, on top of each route's own dynamic rendering.

### Content Security Policy

This is a **baseline CSP, not a strict nonce-based CSP**. It's the strongest policy that doesn't break the app without a larger architectural change — see the limitation below before assuming it's stricter than it is.

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
form-action 'self'; img-src 'self' data:; font-src 'self';
style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'[ 'unsafe-eval' in dev only];
connect-src 'self'[; upgrade-insecure-requests in production only]
```

Reconfirmed present in the **production** policy: `default-src 'self'`, `base-uri 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, and no `unsafe-eval` anywhere in it. `unsafe-eval` is added in **development only** (React's own documented requirement for dev-mode error reconstruction) and is verified absent from the production build's response. No header in this app ever sets `Access-Control-Allow-Origin` (no wildcard CORS, anywhere).

No Stripe domain appears anywhere in this policy. The browser never loads, fetches, or connects to Stripe directly — checkout creation happens server-side, and the browser only does a plain top-level navigation to the resulting Checkout URL, which CSP doesn't govern.

**Remaining limitation — `'unsafe-inline'` on two directives:**
- `script-src 'unsafe-inline'` is currently required because Next.js App Router's RSC hydration payload is delivered via inline `<script>` tags.
- `style-src 'unsafe-inline'` is currently required because this app's progress-bar and chart components render inline `style={{ width }}` attributes.

Removing either would require **nonce-based CSP**, which Next.js's own docs are explicit needs a fresh nonce generated in `proxy.ts` on *every* request and forces *every* page into dynamic rendering — disabling static optimization (including for the legal pages above) entirely. That's a broader dynamic-rendering architecture review, not a small follow-up change, and hasn't been judged necessary for this app's current threat model yet.

## Environment validation

`src/lib/env.ts` centralizes environment variable categorization:

- **Always required:** `DATABASE_URL` — nothing works in any mode without it.
- **Required only in Stripe mode:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_CURRENCY` (already enforced by `getStripeConfig()` — mock mode needs none of these).
- **Required only for admin auth:** `AUTH_SECRET` (already enforced by `getAuthSecret()`).
- **Optional, public-facing:** `LEGAL_ENTITY_NAME`, `CONTACT_EMAIL` — missing values never crash anything; they just render as placeholders on the legal pages.

`ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` are bootstrap-only and intentionally **not** required at runtime — the running app never reads them after `scripts/create-admin.ts` has been run once.

## Known deferred risk: rate limiting on `/api/checkout`

There is currently no distributed rate limiter on `/api/checkout`. A durable, correct implementation needs a shared store (e.g. Redis/Upstash) so limits hold across serverless instances — an in-memory counter in a serverless function would reset per cold start and give a false sense of protection, so one wasn't added. Existing protections (server-side amount/name validation, the campaign-pause gate, and the Phase 4 duplicate-checkout submission token) remain in place. **Before a real public launch, add a distributed rate limiter backed by an external store** — this is a deployment requirement, not something this phase silently worked around.

## Project structure

- `src/app` — pages and API routes (checkout, Stripe webhook, contribution status, share, admin), plus the public legal pages
- `src/components` — landing page UI, `legal/` shared layout for the legal pages
- `src/lib` — money formatting, Prisma client, campaign data access, payment providers, webhook handlers, admin auth, environment validation, security headers
- `src/proxy.ts` — optimistic admin-route redirect (not the security boundary — see above)
- `next.config.ts` — centralized security response headers and CSP
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

Implemented through Phase 5C of the project spec (see `PROJECT_SPEC.md`): landing page UI, database-backed campaign statistics, a full mock contribution flow, Stripe-hosted Checkout in test mode with verified, idempotent webhooks and refund handling, admin authentication, the admin dashboard (metrics, charts, contribution management with name moderation, campaign pause/resume and target editing, CSV export), public legal/transparency pages, centralized security response headers and a tested Content Security Policy, and centralized environment validation. This project is **not** legally ready to accept real payments — see "Legal and transparency pages" above — and PWA support and final documentation are not built yet.
