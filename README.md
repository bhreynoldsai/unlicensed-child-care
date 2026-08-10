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
| `npm test` | Unit tests (consent rules, match guards, unsubscribe tokens) |
| `npm run preflight` | Launch readiness check — run before sharing the URL |

## Routes

- `/` — landing + sign-up form (accepts `?c=CENTER_CODE` for attribution)
- `/join` — the same page under the short URL printed on the poster
- `/poster` — letter-size printable break room poster with a generated QR code
- `/privacy` — full notice describing actual data handling; needs counsel sign-off
- `/unsubscribe` — token-confirmed opt-out; also serves Gmail/Yahoo one-click
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

This replaced the earlier navy/gold placeholders. The site presents as the
coalition "Georgia Licensed Child Care Network" (confirmed 2026-08-09); the
wordmark stays typographic and no company logo is baked in, so a rebrand is a
config change in `lib/sponsor.ts`.

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

### A note on Neon's Vercel integration

The integration marks every variable it creates as **Sensitive**, so
`vercel env pull` and the dashboard both return the literal string
`[SENSITIVE]` instead of the value. The variables are set correctly — they
just cannot be read back. Deployed code gets the real values.

To run migrations against production, take the pooled connection string from
the Neon console (Connection Details → pooling on), not from Vercel:

```bash
DATABASE_URL='<neon pooled string>' npm run db:migrate
DATABASE_URL='<neon pooled string>' npm run legislators:import
```

`node --env-file=.env.vercel scripts/db-diagnose.mjs` prints the shape of every
database variable with credentials stripped, and explains this case when it
sees it.

### Launch checklist

Run `npm run preflight` against the production environment. It exits non-zero
while any blocker remains, and it catches the failures that are otherwise
invisible — a missing Turnstile key leaves the form working but unprotected.

- [ ] `AUTH_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ALLOWED_EMAILS` set. `/admin`
      returns 503 without them, so verify it loads before announcing anything.
- [ ] `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set.
      **Bot verification is skipped entirely when the secret is absent.**
- [ ] `NEXT_PUBLIC_SITE_URL` set before printing posters — the QR encodes it.
- [ ] CAN-SPAM footer: sponsoring entity and physical postal address.
- [ ] Privacy notice reviewed and signed off by counsel. A draft describing
      the system's actual data handling is live at `/privacy`; two questions in
      the file header need a lawyer, not a developer.
- [x] An unsubscribe that actually unsubscribes.
- [ ] `EMAIL_API_KEY` + `EMAIL_FROM_ADDRESS` set and verified by an actual
      send. Configured is not the same as working — check the Vercel runtime
      log for `confirmation_email_failed` after a test sign-up.
- [ ] `GEOCODER_FALLBACK_KEY` set in production, or addresses Census does not
      hold stay unmatched.
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
returns `1500 S PATTERSON ST, 31601`: a different street in a different ZIP.
Those two happen to share districts, which is the point — the response gives you
no way to tell whether the substitution changed the answer, and across a state
it often will. Filing a supporter under the wrong legislator is worse than
filing them under none, because nobody detects it.

When Census has no record of the address at all — common for newer suburban
streets; the first live sign-up on this platform was one — a fourth step runs,
enabled by `GEOCODER_FALLBACK_KEY`:

1. **Mapbox** resolves the address to coordinates (100k/month free).
2. **Census** resolves those coordinates to districts via its `coordinates`
   endpoint — so no TIGER/Line shapefiles and no point-in-polygon code, and
   boundaries still come from the same authority the primary path uses.

The same scepticism applies: the Mapbox result is only believed when its
`match_code` reports the house number and street as matched at exact or high
confidence, and the returned ZIP and state still agree with what was typed.
These matches are recorded as `approximate` with `geocoder = 'fallback'`.

Anything that cannot be verified is recorded as `failed`, the sign-up still
succeeds, and `/admin` reports how many are waiting for manual resolution.
