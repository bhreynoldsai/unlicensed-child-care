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
| `npm run legislators:import` | Refresh the legislator roster from OpenStates |
| `npm test` | Unit tests (consent rules, relaxed-match guard) |

## Routes

- `/` — landing + sign-up form (accepts `?c=CENTER_CODE` for attribution)
- `/join` — the same page under the short URL printed on the poster
- `/poster` — letter-size printable break room poster with a generated QR code
- `/privacy`, `/unsubscribe` — placeholder pages; content pending counsel and an ESP
- `/admin` — district density, aggregate only. Gated by `middleware.ts`; returns
  503 unless `AUTH_SECRET`, `ADMIN_PASSWORD`, and `ADMIN_ALLOWED_EMAILS` are set
- `/admin/login` — email + shared password, HMAC-signed 8-hour session
- `/api/signup` — POST, rate-limited and Turnstile-checked, then validates,
  geocodes, and writes supporter + consent + match
- `/api/health` — DB connectivity check

To print the poster: open `/poster`, print at Letter, no margins, background
graphics on. The QR encodes `NEXT_PUBLIC_SITE_URL` + `/join`, so set that
variable **before** printing anything.

## Design

The sign-up site's look comes from the Claude Design handoff
(`design_handoff_signup_site`), built on the "Organic" design system: sand
background, terracotta and sage accents, Caprasimo display over Figtree body.
Tokens live in `tailwind.config.ts`, component classes in `app/globals.css`.

This replaced the earlier navy/gold placeholders. Sponsor branding is still an
open decision (Doc 01) — the wordmark slot in `app/layout.tsx` stays typographic
and swappable, and no company logo is baked in.

One deliberate deviation from the handoff: its `--color-accent` fill gives only
3.03:1 against its own button label, below AA at 16px. `.btn-primary` uses
`accent-700` instead — same hue, two steps down the ramp, 5.72:1.

## Deploying

**Vercel + Neon Postgres**, with DNS staying at Cloudflare where the domain is
registered — point a CNAME at Vercel with the proxy off.

Vercel rather than Cloudflare Workers because `lib/db.ts` uses `pg` with real
multi-statement transactions, and `app/api/signup/route.ts` depends on that:
supporter, consent rows, and district matches commit together or not at all.
Workers would need Hyperdrive or Neon's serverless driver, whose HTTP mode does
not do cross-statement transactions — meaning a rewrite of the one function
whose atomicity is a compliance property.

Set every variable from `.env.example` in the host's environment settings —
never in the repo. Then run `npm run db:migrate` against the production
database.

### Launch checklist

- [ ] `AUTH_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ALLOWED_EMAILS` set. `/admin`
      returns 503 without them, so verify it loads before announcing anything.
- [ ] `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set.
      **Bot verification is skipped entirely when the secret is absent.**
- [ ] `NEXT_PUBLIC_SITE_URL` set before printing posters — the QR encodes it.
- [ ] CAN-SPAM footer: sponsoring entity and physical postal address.
- [ ] Privacy notice content, and an unsubscribe that actually unsubscribes.
- [ ] `robots` flipped to `index: true` in `app/layout.tsx`.
- [ ] Counsel review of the consent language and the employer-solicitation
      approach.
- [ ] `npm run legislators:import` run against the production database, and
      re-run after every general and special election.
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` set — without it the confirmation screen
      cannot offer a way to report a wrong legislator match, which is the only
      way a bad address match gets caught.

## District matching

Addresses resolve through the U.S. Census geocoder in three steps: exactly as
typed, then with the unit designator stripped, then as a one-line address. Only
the first is trusted outright. A relaxed result is accepted **only if** the
address that came back still agrees with what was typed on house number, ZIP,
and street directional.

That guard exists because relaxing a query does not fail cleanly — it returns a
different address. Asking for `1500 N Patterson St, 31698` without the ZIP
returns `1500 S PATTERSON ST, 31601`: a different street, in different House,
Senate, and congressional districts. Filing a supporter under the wrong
legislator is worse than filing them under none, because nobody detects it.

Anything that cannot be verified is recorded as `failed`, the sign-up still
succeeds, and `/admin` reports how many are waiting. Those need either a
commercial geocoder behind `GEOCODER_FALLBACK_KEY` or manual resolution.
