-- Legislator roster — governing spec: docs/02-app-build-and-data-specification.md §6, §11
--
-- Reference data, refreshed from OpenStates. Contains no supporter information;
-- it exists so the confirmation screen can say "Your Representative is …"
-- instead of showing a bare district number.
--
-- That is also the cheapest accuracy control the program has. A district number
-- is unfalsifiable to the person reading it; a name is not. A provider shown
-- the wrong representative will say so, which is how a bad address match gets
-- caught.
--
-- Refresh with: npm run legislators:import

CREATE TABLE IF NOT EXISTS legislators (
  ocd_id        text PRIMARY KEY,          -- OpenStates person id, stable across terms
  chamber       text NOT NULL CHECK (chamber IN ('lower', 'upper')),
  district      text NOT NULL,
  name          text NOT NULL,
  party         text,
  email         text,
  phone         text,
  url           text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One sitting member per seat. A vacancy is simply the absence of a row —
-- Georgia normally has a few between a resignation and its special election,
-- and the confirmation screen must render that state without looking broken.
CREATE UNIQUE INDEX IF NOT EXISTS legislators_seat_key
  ON legislators (chamber, district);
