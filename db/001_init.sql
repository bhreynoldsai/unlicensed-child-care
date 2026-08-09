-- Unlicensed Care — supporter database, initial schema
-- Governing spec: docs/02-app-build-and-data-specification.md §2
-- Privacy guardrails:  docs/03-data-privacy-and-compliance-plan.md
--
-- Every column here maps to a stated operational use. Do not add fields
-- without adding the use to Doc 02 §2 first.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Role values are fixed by the sponsor (Doc 02 §2.1). Do not extend
-- without a spec change; "other" carries a free-text descriptor.
DO $$ BEGIN
  CREATE TYPE supporter_role AS ENUM (
    'owner',
    'regional_manager',
    'corporate_staff_director',
    'teacher',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS supporters (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Identity / contact
  first_name            text NOT NULL,
  last_name             text NOT NULL,
  email                 text NOT NULL,          -- uniqueness enforced case-insensitively below
  cell_phone            text NOT NULL,          -- E.164, SMS-capable
  other_phone           text,                   -- optional landline / backup

  -- Home address (district matching + constituent verification)
  home_street           text NOT NULL,
  home_street2          text,
  home_city             text NOT NULL,
  home_state            text NOT NULL DEFAULT 'GA',
  home_zip              text NOT NULL,

  -- Employer (segmentation, center-level mapping)
  employer_name         text NOT NULL,
  employer_street       text NOT NULL,
  employer_city         text NOT NULL,
  employer_state        text NOT NULL DEFAULT 'GA',
  employer_zip          text NOT NULL,

  -- Role drives the activation ladder (Doc 04)
  role                  supporter_role NOT NULL,
  role_other            text,                   -- required when role = 'other'

  -- Attribution: unique per-center link parameter (Doc 02 §7).
  -- Never used to report individual enrollment back to a manager.
  source_center_code    text,

  -- Lifecycle
  status                text NOT NULL DEFAULT 'active',   -- active | unsubscribed | purged
  last_activity_at      timestamptz,

  CONSTRAINT role_other_required
    CHECK (role <> 'other' OR (role_other IS NOT NULL AND length(btrim(role_other)) > 0))
);

CREATE UNIQUE INDEX IF NOT EXISTS supporters_email_key ON supporters (lower(email));
CREATE INDEX IF NOT EXISTS supporters_role_idx ON supporters (role);
CREATE INDEX IF NOT EXISTS supporters_employer_idx ON supporters (lower(employer_name));
CREATE INDEX IF NOT EXISTS supporters_center_code_idx ON supporters (source_center_code);

-- ---------------------------------------------------------------------
-- Consent: timestamped record of exactly what was shown and checked.
-- Append-only. Never UPDATE a consent row; write a new one.
-- (Doc 03 §2 — TCPA express written consent evidence.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_events (
  id             bigserial PRIMARY KEY,
  supporter_id   uuid NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  channel        text NOT NULL CHECK (channel IN ('email', 'sms')),
  granted        boolean NOT NULL,
  language_hash  text NOT NULL,   -- sha256 of the exact consent text displayed
  language_text  text NOT NULL,   -- verbatim copy of that text
  source         text NOT NULL DEFAULT 'signup_form',
  ip_address     inet,
  user_agent     text,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_events_supporter_idx ON consent_events (supporter_id, channel, occurred_at DESC);

-- ---------------------------------------------------------------------
-- District matching results (Doc 02 §4). Home and employer matched
-- separately; re-run the batch after redistricting.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS district_matches (
  id                bigserial PRIMARY KEY,
  supporter_id      uuid NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  address_kind      text NOT NULL CHECK (address_kind IN ('home', 'employer')),
  latitude          double precision,
  longitude         double precision,
  geocoder          text,          -- 'census' | 'fallback'
  match_quality     text,          -- exact | approximate | failed
  state_house       text,
  state_senate      text,
  congressional     text,
  county            text,
  boundary_vintage  text,          -- TIGER/Line year used
  matched_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supporter_id, address_kind)
);

CREATE INDEX IF NOT EXISTS district_matches_house_idx ON district_matches (state_house);
CREATE INDEX IF NOT EXISTS district_matches_senate_idx ON district_matches (state_senate);

-- ---------------------------------------------------------------------
-- Export audit. Exporting home addresses is the highest-sensitivity
-- event in the system (Doc 02 §5, Doc 03 §5).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS export_audit (
  id             bigserial PRIMARY KEY,
  admin_email    text NOT NULL,
  filter_json    jsonb NOT NULL,
  row_count      integer NOT NULL,
  included_pii   text[] NOT NULL DEFAULT '{}',   -- e.g. {home_address, cell_phone}
  exported_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Aggregate-only reporting view.
-- Doc 03 §4: no individual-level enrollment data may be reported to
-- owners, managers, or the sponsor. Build manager-facing reporting on
-- THIS view, never on the supporters table. Counts below 5 should be
-- suppressed in any manager-facing surface.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW district_density AS
SELECT
  dm.state_house,
  dm.state_senate,
  s.role,
  count(*)::int AS supporter_count
FROM supporters s
JOIN district_matches dm
  ON dm.supporter_id = s.id AND dm.address_kind = 'home'
WHERE s.status = 'active'
GROUP BY dm.state_house, dm.state_senate, s.role;
