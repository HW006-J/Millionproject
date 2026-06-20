# ONE MILLION

A deliberately minimal viral social experiment: can the internet collectively contribute $1,000,000? No cause, no reward, no explanation — just one ridiculous goal.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

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
3. Copy `.env.example` to `.env` and paste both values in:
   ```bash
   cp .env.example .env
   ```
   `.env` is gitignored and never committed.
4. Apply the schema and seed the one starting campaign:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

This creates the `Campaign` and `Contribution` tables and inserts a single campaign (`ONE MILLION`, target `$1,000,000`, confirmed amount `$0`). No fake contributions are ever seeded.

### Why two connection strings?

Neon's pooled connection is best for the running app (many short-lived serverless connections); Prisma Migrate needs the direct connection for schema changes. `prisma.config.ts` uses `DIRECT_URL` for migrations; `src/lib/prisma.ts` uses `DATABASE_URL` for the app at runtime.

## Project structure

- `src/app` — pages and API routes
- `src/components` — landing page UI
- `src/lib` — money formatting, Prisma client, campaign data access
- `prisma/schema.prisma` — database schema
- `prisma/seed.ts` — seeds the starting campaign

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run lint    # run ESLint
```

## Current status

Implemented through Phase 2 of the project spec (see `PROJECT_SPEC.md`): landing page UI, database schema, and live campaign statistics. No payments, checkout, authentication, or admin dashboard yet.
