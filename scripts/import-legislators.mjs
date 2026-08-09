#!/usr/bin/env node
/**
 * Refresh the legislator roster from OpenStates.
 *
 *   npm run legislators:import
 *
 * Source: https://data.openstates.org/people/current/ga.csv — a public bulk
 * export, no API key, one request. OpenStates is the maintained open dataset
 * behind Ballotpedia-style civic tooling; Google's Civic Information
 * representatives endpoint, the obvious alternative, was shut down in 2025.
 *
 * Run this after every election, and after any special election. Members
 * missing from the feed are deleted, so a seat that falls vacant stops
 * claiming an occupant.
 */
import pg from 'pg'

const STATE = process.env.LEGISLATORS_STATE ?? 'ga'
const SOURCE = `https://data.openstates.org/people/current/${STATE}.csv`

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
  process.exit(1)
}

/** Minimal RFC 4180 parser — the feed quotes fields containing commas. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows
  return body
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

/** The feed packs several links into one semicolon-joined field. */
function officialUrl(links) {
  const candidates = (links ?? '').split(';').filter(Boolean)
  return candidates.find((u) => u.includes('legis.')) ?? candidates[0] ?? null
}

const res = await fetch(SOURCE, { signal: AbortSignal.timeout(30000) })
if (!res.ok) {
  console.error(`Could not fetch ${SOURCE}: HTTP ${res.status}`)
  process.exit(1)
}

const people = parseCsv(await res.text()).filter(
  (p) => p.current_district && (p.current_chamber === 'lower' || p.current_chamber === 'upper'),
)

if (people.length === 0) {
  console.error('Feed returned no seated members — refusing to wipe the roster.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
})
await client.connect()

try {
  await client.query('BEGIN')

  for (const p of people) {
    await client.query(
      `INSERT INTO legislators (ocd_id, chamber, district, name, party, email, phone, url, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
       ON CONFLICT (ocd_id) DO UPDATE SET
         chamber = EXCLUDED.chamber,
         district = EXCLUDED.district,
         name = EXCLUDED.name,
         party = EXCLUDED.party,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         url = EXCLUDED.url,
         updated_at = now()`,
      [
        p.id,
        p.current_chamber,
        String(p.current_district).replace(/^0+/, '') || '0',
        p.name,
        p.current_party || null,
        p.email || null,
        p.capitol_voice || p.district_voice || null,
        officialUrl(p.links),
      ],
    )
  }

  // Anyone no longer in the feed has left office. Removing them is the point:
  // a stale row would name a former member as the reader's representative.
  const ids = people.map((p) => p.id)
  const { rowCount: removed } = await client.query(
    `DELETE FROM legislators WHERE ocd_id <> ALL($1::text[])`,
    [ids],
  )

  await client.query('COMMIT')

  const { rows: counts } = await client.query(
    `SELECT chamber, count(*)::int AS n FROM legislators GROUP BY chamber ORDER BY chamber`,
  )
  const seated = Object.fromEntries(counts.map((c) => [c.chamber, c.n]))
  const house = seated.lower ?? 0
  const senate = seated.upper ?? 0

  console.log(`imported ${people.length} members (${removed} removed as no longer seated)`)
  console.log(`  GA House:  ${house}/180 seats filled`)
  console.log(`  GA Senate: ${senate}/56 seats filled`)
  if (house < 180 || senate < 56) {
    console.log('  Empty seats are normal between a resignation and its special election.')
  }
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  await client.end()
}
