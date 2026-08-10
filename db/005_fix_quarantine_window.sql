-- Fix the quarantine window — corrects db/004
--
-- 004 defined quarantine as `cutoff_at >= occurred_at`, which blocks consents
-- recorded BEFORE the block was raised and lets through everything recorded
-- after it. That is backwards for an open-ended block: the reason SMS consent
-- is unusable is that the sender of record is unknown, and that stays true for
-- consent collected tomorrow just as much as for consent collected yesterday.
-- The comment in 004 described the intended behaviour; the SQL did the reverse.
--
-- Correct rule: while an unreleased quarantine exists for a channel, every
-- consent on that channel is unusable. Releasing it is the decision point, and
-- it is dated and attributable.
--
-- `cutoff_at` is retained as the record of when the block began. It is no
-- longer part of the test.

CREATE OR REPLACE VIEW consent_current AS
SELECT
  latest.supporter_id,
  latest.channel,
  latest.granted,
  latest.occurred_at,
  EXISTS (
    SELECT 1 FROM consent_quarantine q
     WHERE q.channel = latest.channel
       AND q.released_at IS NULL
  ) AS quarantined
FROM (
  SELECT DISTINCT ON (supporter_id, channel)
         supporter_id, channel, granted, occurred_at
    FROM consent_events
   ORDER BY supporter_id, channel, occurred_at DESC, id DESC
) latest;

COMMENT ON VIEW consent_current IS
  'Latest consent per supporter per channel with quarantine applied. Sending code must read THIS, never consent_events directly: granted = true AND quarantined = false is the only sendable state.';

COMMENT ON COLUMN consent_quarantine.cutoff_at IS
  'When the block was raised. Recorded for the audit trail; not part of the test — an unreleased block covers every consent on the channel.';
