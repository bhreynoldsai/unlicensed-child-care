#!/usr/bin/env node
/**
 * Re-run district matching for supporters whose match failed, or for
 * everyone after a redistricting cycle (Doc 02 §4).
 *
 *   npm run districts:rematch            # retry failed matches only
 *   npm run districts:rematch -- --all   # re-match everyone (new boundaries)
 *
 * Rate-limited to be polite to the free Census geocoder.
 */
import pg from 'pg'

const ALL = process.argv.includes('--all')
const DELAY_MS = Number(process.env.REMATCH_DELAY_MS ?? 250)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
})
await client.connect()

const { rows } = await client.query(
  `SELECT s.id, dm.address_kind,
          CASE WHEN dm.address_kind = 'home' THEN s.home_street ELSE s.employer_street END AS street,
          CASE WHEN dm.address_kind = 'home' THEN s.home_city   ELSE s.employer_city   END AS city,
          CASE WHEN dm.address_kind = 'home' THEN s.home_state  ELSE s.employer_state  END AS state,
          CASE WHEN dm.address_kind = 'home' THEN s.home_zip    ELSE s.employer_zip    END AS zip
     FROM supporters s
     JOIN district_matches dm ON dm.supporter_id = s.id
    WHERE s.status = 'active'
      AND ($1::boolean OR dm.match_quality = 'failed')`,
  [ALL],
)

console.log(`${rows.length} address(es) to re-match${ALL ? ' (full re-match)' : ''}.`)

const BENCHMARK = process.env.CENSUS_BENCHMARK ?? 'Public_AR_Current'
const VINTAGE = process.env.CENSUS_VINTAGE ?? 'Current_Current'

let ok = 0
let failed = 0

for (const row of rows) {
  const params = new URLSearchParams({
    street: row.street, city: row.city, state: row.state, zip: row.zip,
    benchmark: BENCHMARK, vintage: VINTAGE, layers: 'all', format: 'json',
  })

  try {
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/address?${params}`,
      { signal: AbortSignal.timeout(10000) },
    )
    const body = await res.json()
    const match = body?.result?.addressMatches?.[0]
    if (!match) { failed++; continue }

    const geo = match.geographies ?? {}
    const pick = (re) => {
      for (const [layer, list] of Object.entries(geo)) {
        if (!re.test(layer)) continue
        const f = Array.isArray(list) ? list[0] : null
        if (!f) continue
        const code = f.SLDLST ?? f.SLDUST ?? f.CD119 ?? f.CD118 ?? f.BASENAME ?? null
        if (code) return String(code).replace(/^0+/, '') || '0'
      }
      return null
    }

    await client.query(
      `UPDATE district_matches
          SET latitude = $1, longitude = $2, geocoder = 'census', match_quality = 'exact',
              state_house = $3, state_senate = $4, congressional = $5, county = $6,
              boundary_vintage = $7, matched_at = now()
        WHERE supporter_id = $8 AND address_kind = $9`,
      [
        match.coordinates?.y ?? null,
        match.coordinates?.x ?? null,
        pick(/State Legislative Districts.*Lower/i),
        pick(/State Legislative Districts.*Upper/i),
        pick(/Congressional Districts/i),
        geo.Counties?.[0]?.BASENAME ?? null,
        VINTAGE,
        row.id,
        row.address_kind,
      ],
    )
    ok++
  } catch {
    failed++
  }

  await new Promise((r) => setTimeout(r, DELAY_MS))
}

console.log(`Matched ${ok}, still unresolved ${failed}.`)
await client.end()
