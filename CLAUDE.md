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
   **Currently hidden** (`NEXT_PUBLIC_SHOW_SMS_CONSENT` unset): the text
   promises "Reply STOP" and no Twilio campaign exists to honour it. Unhide only
   once A2P 10DLC is approved and Advanced Opt-Out is on.
2. **Consent language is verbatim and hashed as legal evidence.** The strings in
   `lib/consent.ts` are stored with every consent record. Do not reword them —
   not for tone, not for length. **They are currently a build-team draft
   awaiting counsel sign-off** (`docs/05-consent-and-privacy-language-review.md`);
   once reviewed, change them once and update that document's status.
3. **Consent records are append-only.** Never `UPDATE` a row in
   `consent_events`; write a new one. Quarantine works the same way — a block
   is recorded in `consent_quarantine` alongside the records, never by editing
   them. **Sending code reads the `consent_current` view, never
   `consent_events` directly**: `granted = true AND quarantined = false` is the
   only sendable state, and reading the raw table silently bypasses an active
   block.
4. **Participation is voluntary and every material says so.**
   `VOLUNTARY_PARTICIPATION_NOTICE` appears on the sign-up page and on all
   distribution materials.
5. **Aggregate reporting only, and aggregates must be big enough.** No manager,
   owner, or sponsor may ever get individual-level visibility into who enrolled
   or who acted. Manager-facing reporting reads the `district_density` view,
   never the `supporters` table. Any figure leaving the campaign goes through
   `suppressCount()` in `lib/suppression.ts`: counts under 5 read "fewer than
   5", a count of **zero is never reported at all**, and the sponsor gets no
   center-level figure at any denominator. At a six-person center an
   unsuppressed count identifies who took part in protected activity, which is
   the NLRA impression-of-surveillance risk (docs/05 §4.4).
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

- Next.js 15 (App Router) + TypeScript + Tailwind (navy/gold GLCCN brand —
  see README "Design"; gold is an accent only and never carries body text)
- Postgres via `pg`, plain SQL migrations in `db/`, run with `npm run db:migrate`
- Zod for validation (`lib/validation.ts`) — the API re-validates everything
- District matching via the free U.S. Census geocoder (`lib/districts.ts`),
  commercial fallback stubbed behind `GEOCODER_FALLBACK_KEY`
- Legislator roster from OpenStates bulk data (`npm run legislators:import`)
- Vitest for unit tests (`npm test`) — the consent rules and the relaxed-match
  guard are the two things worth breaking the build over
- Email via Resend (`lib/email.ts`), disabled unless EMAIL_API_KEY and
  EMAIL_FROM_ADDRESS are both set

## Layout

```
app/
  page.tsx              landing + sign-up
  join/page.tsx         re-exports the landing page at the poster's short URL
  poster/               printable break room poster + its print stylesheet
  privacy/              full notice; needs counsel sign-off
  unsubscribe/          token-confirmed opt-out
  admin/                district density (AGGREGATE ONLY), gated by middleware.ts
  api/signup/route.ts   rate-limit → Turnstile → validate → geocode → insert
  api/unsubscribe/      honours a signed unsubscribe token
  api/admin/            login / logout
  api/health/route.ts
components/SignupForm.tsx  form, validation display, submit states
components/Field.tsx       input, select, consent checkbox, fieldset primitives
components/SuccessCard.tsx matched districts + share link
components/icons.tsx       inline SVG icon set
lib/consent.ts          verbatim consent language + hashing  ← counsel-reviewed
lib/validation.ts       zod schema, role enum, phone normalization
lib/districts.ts        Census geocoder + district resolution
lib/db.ts               pool + withTransaction
lib/site.ts             public URL and share link
lib/sponsor.ts          CAN-SPAM disclosure block
lib/auth.ts             admin sessions (Edge-safe, no dependencies)
lib/email.ts            Resend confirmation mail
lib/unsubscribe.ts      signed opt-out tokens
lib/legislators.ts      district → sitting member
lib/rate-limit.ts       Postgres-backed limiter
lib/turnstile.ts        bot verification
db/                     001 schema + density view, 002 rate limits,
                        003 legislators, 004/005 consent metadata + quarantine
lib/suppression.ts      small-cell suppression for anything leaving the campaign
lib/versions.ts         form and privacy-notice versions stamped onto consent
scripts/                migrate, rematch-districts
docs/                   the four governing plans
```

The sign-up form validates client-side with the same `signupSchema` the API
enforces, so the two cannot disagree about what is valid. The API still
re-validates everything — the client check is a courtesy, never a gate.

## Role values

Fixed by the sponsor (Doc 02 §2.1). Do not extend without a spec change:
`owner`, `regional_manager`, `corporate_staff_director`, `teacher`, `other`
(`other` requires a free-text descriptor). Role drives which asks a supporter
receives and how their voice is framed to a legislator.

## Known gaps — do these before launch

- [x] **Auth on `/admin`.** Gated by `middleware.ts`, fails closed without
      `AUTH_SECRET` + `ADMIN_PASSWORD` + `ADMIN_ALLOWED_EMAILS` (Doc 02 §10).
      Still to do: set real values in the host's environment, and rotate
      `ADMIN_PASSWORD` whenever someone leaves the team.
- [x] Rate limiting + bot protection on `/api/signup` (Doc 02 §9). Turnstile
      verification is **skipped when `TURNSTILE_SECRET_KEY` is unset** — setting
      it is a launch requirement, not an option.
- [x] Legislator roster: the confirmation screen names the member, party, and
      official page. Refresh with `npm run legislators:import` after every
      general and special election — stale rows would name a former member.
- [x] Unsubscribe works end to end. A signed token in every email resolves to
      one supporter, sets `status = 'unsubscribed'`, and APPENDS a
      `consent_events` row with `granted = false` — the original grant is never
      edited (Doc 03 §2). Supports Gmail/Yahoo one-click via List-Unsubscribe.
- [ ] Privacy-notice content still needs counsel sign-off against Doc 03.
- [ ] Set EMAIL_API_KEY + EMAIL_FROM_ADDRESS. Until both exist no confirmation
      email is sent, so no unsubscribe link exists to click — that is the
      CAN-SPAM gap, not the page.
- [x] Sponsoring entity + postal address in the footer. Set via
      `lib/sponsor.ts` / `NEXT_PUBLIC_SPONSOR_*`. **Open for counsel:** a
      "Paid for by" line names who actually paid — if the Network is not a
      registered entity, it may need to name the funding organization
      (`NEXT_PUBLIC_SPONSOR_PAID_FOR_BY`).
- [ ] Commercial geocoder fallback (`lib/districts.ts` → `fallbackMatch`). The
      Census-only ladder now tries exact → unit-stripped → one-line and
      **verifies** each relaxed result before believing it, so a miss is a clean
      `failed` rather than a wrong district. Addresses Census simply does not
      hold still need a commercial geocoder or manual resolution; `/admin`
      shows how many are waiting.
- [x] QR / shareable link on the confirmation screen. `/poster` generates the
      QR from `SHARE_URL`; the confirmation screen offers the same link with a
      copy button.
- [ ] Retention job: 24-month inactivity re-consent-or-purge (Doc 03 §6). The
      privacy notice **no longer promises it** — describing an unbuilt process
      was the misrepresentation risk. Restore the specific commitment when the
      job ships, not before.
- [x] SMS consent is quarantined pending the sender-of-record answer
      (docs/05 §2.4). `consent_quarantine` holds an unreleased block; release it
      only once the registered A2P brand is known to match the entity named at
      opt-in, and consider re-confirmation at that point.
- [x] Consent record metadata (docs/05 §8.2): `form_version`, page URL with the
      center code, and the privacy-notice version in force. Bump the constants
      in `lib/versions.ts` when the form or the notice changes materially.
- [x] CSV export with `export_audit` logging (Doc 02 §5), plus a supporter list
      at `/admin/supporters`.
- [ ] Confirm the hero photo's licensing, or replace it. It arrived with the
      design handoff as user-supplied stock, and it sits against the design
      brief's own "avoid stock photos of smiling children" guidance.

## Open decisions (don't invent answers)

- Whether the "Paid for by" line should name the coalition or the funding
  entity. Branding is settled: coalition, "Georgia Licensed Child Care
  Network" (2026-08-09), configured in `lib/sponsor.ts`.
- **Target state is Georgia by assumption, not confirmation.** Confirm before
  producing state-specific legislative content. The platform is built
  state-agnostic.
- Build budget.

## Style

Documents get polished navy/gold TNS branding with structured tables and a
companion executive summary for advocacy/policy audiences. Answers lead with
the conclusion; no padding.
