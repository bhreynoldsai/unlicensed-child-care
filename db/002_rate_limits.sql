-- Rate limiting — governing spec: docs/02-app-build-and-data-specification.md §8
--
-- Abuse control for the public sign-up form and the admin login. Deliberately
-- backed by Postgres rather than process memory: on any serverless host each
-- request may hit a different instance, so an in-memory counter would not
-- actually limit anything.
--
-- Privacy (Doc 03 §5): the identifier is stored as a SHA-256 hash, never a raw
-- IP. This table is abuse control, not evidence — the raw IP that belongs in
-- the legal record is already captured on consent_events. Rows are disposable
-- and should be swept regularly.

CREATE TABLE IF NOT EXISTS rate_limits (
  scope           text        NOT NULL,   -- 'signup' | 'admin_login'
  identifier_hash text        NOT NULL,   -- sha256(scope + client identifier)
  window_start    timestamptz NOT NULL,
  hits            integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, identifier_hash, window_start)
);

-- Supports the sweep below; the primary key already covers lookups.
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);

-- Retention: nothing here is useful once its window has passed. Sweep with
--   DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';
-- from the same cron that runs the Doc 03 §6 retention job.
