# Unlicensed Care — Grassroots Activation Platform

Sign-up platform organizing Georgia's **licensed** child care community (owners,
regional managers, corporate staff directors, teachers) to contact their state
legislators about **license-exempt** child care programs.

Client context: **True North Strategies (TNS)** unless stated otherwise.
Related engagement: Child Development Schools (~267 centers, 11 states).

## Governing documents

`docs/` holds the four plans converted from the client's Google Drive folder.
**They are the source of truth.** If code and a plan disagree, the plan wins —
update the plan deliberately rather than quietly diverging from it.

| Doc | Covers |
|-----|--------|
| `docs/01-master-project-plan.md` | Objectives, phases, roles, risks, open decisions |
| `docs/02-app-build-and-data-specification.md` | Data fields, build-vs-buy, district matching, dashboard, sign-up flow |
| `docs/03-data-privacy-and-compliance-plan.md` | Consent language, TCPA/CAN-SPAM, employer guardrails, security, retention |
| `docs/04-advocacy-activation-plan.md` | Role-based activation ladder, targeting, campaign calendar |

## Non-negotiable guardrails

These are not style preferences. Violating one is a program risk, not a bug.

1. **SMS consent is a separate, unticked checkbox** carrying the exact TCPA
   express-consent language in `lib/consent.ts`. Sign-up must succeed with
   **email consent alone**. Never pre-check, bundle, or gate on SMS consent.
2. **Consent language is verbatim and counsel-reviewed.** The strings in
   `lib/consent.ts` are hashed and stored with every consent record as legal
   evidence. Do not reword them — not for tone, not for length.
3. **Consent records are append-only.** Never `UPDATE` a row in
   `consent_events`; write a new one.
4. **Participation is voluntary and every material says so.**
   `VOLUNTARY_PARTICIPATION_NOTICE` appears on the sign-up page and on all
   distribution materials.
5. **Aggregate reporting only.** No manager, owner, or sponsor may ever get
   individual-level visibility into who enrolled or who acted. Manager-facing
   reporting reads the `district_density` view, never the `supporters` table.
   Suppress counts below 5.
6. **Messaging targets the exemption policy** — never faith-based
   organizations, camps, or recreation programs as institutions. The frame is
   child safety and a level playing field.
7. **Credentials come from environment variables only.** Never hardcode a key
   or connection string, never paste one into chat, never commit `.env.local`.
8. **Minimum necessary data.** Every field in `db/001_init.sql` maps to a
   stated operational use in Doc 02 §2. Adding a field means amending Doc 02
   first.
9. **Never log PII.** Home addresses and phone numbers stay out of logs, error
   messages, and analytics.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Postgres via `pg`, plain SQL migrations in `db/`, run with `npm run db:migrate`
- Zod for validation (`lib/validation.ts`) — the API re-validates everything
- District matching via the free U.S. Census geocoder (`lib/districts.ts`),
  commercial fallback stubbed behind `GEOCODER_FALLBACK_KEY`

## Layout

```
app/
  page.tsx              landing + sign-up
  admin/page.tsx        district density (AGGREGATE ONLY — no auth yet)
  api/signup/route.ts   validate → geocode → insert supporter + consent + match
  api/health/route.ts
components/SignupForm.tsx
lib/consent.ts          verbatim consent language + hashing  ← counsel-reviewed
lib/validation.ts       zod schema, role enum, phone normalization
lib/districts.ts        Census geocoder + district resolution
lib/db.ts               pool + withTransaction
db/001_init.sql         schema, density view
scripts/                migrate, rematch-districts
docs/                   the four governing plans
```

## Role values

Fixed by the sponsor (Doc 02 §2.1). Do not extend without a spec change:
`owner`, `regional_manager`, `corporate_staff_director`, `teacher`, `other`
(`other` requires a free-text descriptor). Role drives which asks a supporter
receives and how their voice is framed to a legislator.

## Known gaps — do these before launch

- [ ] **Auth on `/admin`.** There is none. Do not deploy that route publicly.
- [ ] Rate limiting + bot protection (Turnstile/hCaptcha) on `/api/signup`.
- [ ] Legislator roster: join district numbers to names so the confirmation
      screen says "Your Representative is …" (Doc 02 §6).
- [ ] Unsubscribe and privacy-notice pages (footer links are dead).
- [ ] Sponsoring entity + postal address in the footer (CAN-SPAM).
- [ ] Commercial geocoder fallback (`lib/districts.ts` → `fallbackMatch`).
- [ ] CSV export with `export_audit` logging (Doc 02 §5).
- [ ] QR / shareable link on the confirmation screen.
- [ ] Retention job: 24-month inactivity re-consent-or-purge (Doc 03 §6).

## Open decisions (don't invent answers)

- Sponsoring entity, and whether sign-up is branded to a coalition, an
  association, or a single company. Placeholders are in `app/layout.tsx`.
- **Target state is Georgia by assumption, not confirmation.** Confirm before
  producing state-specific legislative content. The platform is built
  state-agnostic.
- Build budget.

## Style

Documents get polished navy/gold TNS branding with structured tables and a
companion executive summary for advocacy/policy audiences. Answers lead with
the conclusion; no padding.
