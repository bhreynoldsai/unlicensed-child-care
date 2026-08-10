-- Consent evidence and quarantine — docs/05 §2.4 and §8.2
--
-- Two changes, both driven by the revision-2 legal review.
--
-- 1. QUARANTINE. Consent already collected for SMS may not be usable. CTIA
--    §5.1.2.2 makes an opt-in non-transferable: it applies only to the specific
--    sender that obtained it. The sender of record is unresolved, so if the
--    registered A2P brand turns out to be a different legal entity, those
--    consents cannot be used and nobody would discover it until brand vetting.
--
--    consent_events is append-only, so quarantine is recorded ALONGSIDE it
--    rather than by editing rows. The records stay exactly as collected; a
--    separate table says which ones may not be relied on, and why.
--
-- 2. EVIDENCE METADATA. Hashing the consent text proves what the string was.
--    It does not prove a particular person agreed to it. What makes a checkbox
--    an electronic signature under E-SIGN is the surrounding record, and after
--    Insurance Marketing Coalition v. FCC the litigated question is what the
--    person "clearly and unmistakably" agreed to — which is answered by
--    metadata, not by the hash.

-- ---------------------------------------------------------------------
-- 1. Quarantine
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_quarantine (
  id           bigserial PRIMARY KEY,
  channel      text        NOT NULL CHECK (channel IN ('email', 'sms')),
  -- Every consent_events row for this channel recorded strictly BEFORE this
  -- instant is quarantined. A cutoff rather than a row list, so consents
  -- collected while the condition persists are covered automatically.
  cutoff_at    timestamptz NOT NULL,
  reason       text        NOT NULL,
  -- Set when the block is lifted; NULL means still quarantined. Appended to,
  -- never deleted, so the history of the decision survives.
  released_at  timestamptz,
  released_by  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_quarantine_channel_idx
  ON consent_quarantine (channel) WHERE released_at IS NULL;

-- The block itself. Recorded as data rather than code so that lifting it is a
-- deliberate, dated, attributable act.
INSERT INTO consent_quarantine (channel, cutoff_at, reason)
SELECT
  'sms',
  now(),
  'Sender of record unresolved (docs/05 §7 Q3). CTIA §5.1.2.2 makes an opt-in '
  || 'non-transferable to a different sender, so these consents cannot be relied '
  || 'on until the registered A2P brand is known to match the entity named at '
  || 'opt-in. Release only after that is confirmed, and consider re-confirmation.'
WHERE NOT EXISTS (
  SELECT 1 FROM consent_quarantine WHERE channel = 'sms' AND released_at IS NULL
);

-- ---------------------------------------------------------------------
-- 2. Evidence metadata (docs/05 §8.2)
-- ---------------------------------------------------------------------
-- Nullable on purpose: rows recorded before this migration genuinely do not
-- have these values, and inventing them would defeat the point of an evidence
-- record.
ALTER TABLE consent_events
  ADD COLUMN IF NOT EXISTS form_version    text,
  ADD COLUMN IF NOT EXISTS page_url        text,
  ADD COLUMN IF NOT EXISTS notice_version  text;

COMMENT ON COLUMN consent_events.form_version IS
  'Deployed form version, so a record ties to a specific build and not only to a text hash.';
COMMENT ON COLUMN consent_events.page_url IS
  'Page the consent was given on, including the ?c= center attribution parameter.';
COMMENT ON COLUMN consent_events.notice_version IS
  'Version of the privacy notice in force when consent was given.';

-- ---------------------------------------------------------------------
-- 3. The sendable view — the thing sending code must read
-- ---------------------------------------------------------------------
-- Latest decision per supporter per channel, with quarantine applied. Sending
-- code that reads consent_events directly can miss a quarantine; this view
-- cannot.
CREATE OR REPLACE VIEW consent_current AS
SELECT
  latest.supporter_id,
  latest.channel,
  latest.granted,
  latest.occurred_at,
  -- Quarantined when an unreleased block exists for the channel whose cutoff is
  -- at or after this consent.
  EXISTS (
    SELECT 1 FROM consent_quarantine q
     WHERE q.channel = latest.channel
       AND q.released_at IS NULL
       AND q.cutoff_at >= latest.occurred_at
  ) AS quarantined
FROM (
  SELECT DISTINCT ON (supporter_id, channel)
         supporter_id, channel, granted, occurred_at
    FROM consent_events
   ORDER BY supporter_id, channel, occurred_at DESC, id DESC
) latest;

COMMENT ON VIEW consent_current IS
  'Latest consent per supporter per channel with quarantine applied. Sending code must read THIS, never consent_events directly: granted = true AND quarantined = false is the only sendable state.';
