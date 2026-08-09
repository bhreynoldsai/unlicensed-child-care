# Unlicensed Care — Grassroots Activation Platform

Mobile-friendly sign-up platform for the Georgia Child Care Grassroots
Activation Initiative. Collects supporters from the licensed child care
community, matches them to their Georgia House, Senate, and congressional
districts, and reports district density in aggregate.

Read `CLAUDE.md` before changing anything — it carries the compliance
guardrails. The four governing plans are in `docs/`.

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL
npm run db:migrate
npm run dev                    # http://localhost:3000
```

### A local Postgres, if you need one

```bash
brew install postgresql@16
brew services start postgresql@16
createdb unlicensed_care
```

Then in `.env.local`:

```
DATABASE_URL=postgres://$(whoami)@localhost:5432/unlicensed_care
DATABASE_SSL=false
```

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:migrate` | Apply `db/*.sql` in order, once each |
| `npm run districts:rematch` | Retry failed geocodes (`-- --all` after redistricting) |

## Routes

- `/` — landing + sign-up form (accepts `?c=CENTER_CODE` for attribution)
- `/admin` — district density, aggregate only. **No authentication yet.**
- `/api/signup` — POST, validates, geocodes, writes supporter + consent + match
- `/api/health` — DB connectivity check

## Deploying

Vercel + a managed Postgres (Neon, Supabase, or Vercel Postgres) is the
shortest path. Set every variable from `.env.example` in the host's
environment settings — never in the repo.

Before anything is publicly reachable: add auth on `/admin`, add rate
limiting on `/api/signup`, fill in the CAN-SPAM footer, and get counsel
review of the consent language and employer-solicitation approach.
