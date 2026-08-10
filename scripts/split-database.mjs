#!/usr/bin/env node
/**
 * Move this app onto its own Neon database and its own role.
 *
 *   node --env-file=.env.vercel scripts/split-database.mjs
 *
 * Why: the supporter tables currently share `neondb` with a Prisma-managed
 * application. `prisma migrate` and `prisma db push` compare the live database
 * against a schema file and offer to drop tables they do not recognise — which
 * is every table this app owns. One routine command on the neighbouring app
 * would take the supporter data with it.
 *
 * A second reason: the connection string is shared, so the password cannot be
 * rotated without breaking the neighbour. A dedicated role fixes that too.
 *
 * This script is additive. It creates a database and a role and copies rows
 * into the new database. It does not drop, alter, or delete anything in
 * `neondb` — cleaning that up is a separate, deliberate decision once the new
 * database is confirmed good.
 *
 * The generated password is written to `.env.newdb.local` (gitignored, 0600)
 * and never printed.
 */
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import pg from 'pg'

const source = process.env.DATABASE_URL
if (!source) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const NEW_DB = 'unlicensed_care'
const NEW_ROLE = 'unlicensed_care_app'
const ssl = process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false }

/** Tables copied in dependency order — parents before children. */
const TABLES = [
  'legislators',
  'rate_limits',
  'consent_quarantine',
  'supporters',
  'consent_events',
  'district_matches',
  'export_audit',
]

const password = randomBytes(24).toString('base64url')

const admin = new pg.Client({ connectionString: source, ssl })
await admin.connect()

// --- role -----------------------------------------------------------------
const roleExists = (await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [NEW_ROLE]))
  .rowCount

// Passwords cannot be parameterised in CREATE/ALTER ROLE, so quote via the
// server's own literal quoting rather than string-concatenating.
const quoted = (await admin.query('SELECT quote_literal($1) AS q', [password])).rows[0].q

if (roleExists) {
  await admin.query(`ALTER ROLE ${NEW_ROLE} WITH LOGIN PASSWORD ${quoted}`)
  console.log('role      : existed, password reset')
} else {
  await admin.query(`CREATE ROLE ${NEW_ROLE} WITH LOGIN PASSWORD ${quoted}`)
  console.log('role      : created')
}

// Postgres 16 requires the creating role to be a member of the owning role
// before it can hand a database over to it.
const { rows: whoami } = await admin.query('SELECT current_user AS u')
await admin.query(`GRANT ${NEW_ROLE} TO "${whoami[0].u}"`)
console.log(`grant     : ${NEW_ROLE} -> ${whoami[0].u}`)

// --- database -------------------------------------------------------------
const dbExists = (await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [NEW_DB]))
  .rowCount

if (dbExists) {
  console.log('database  : already existed')
} else {
  // CREATE DATABASE cannot run inside a transaction block.
  await admin.query(`CREATE DATABASE ${NEW_DB} OWNER ${NEW_ROLE}`)
  console.log('database  : created')
}

await admin.end()

// --- connection string ----------------------------------------------------
const url = new URL(source)
url.username = NEW_ROLE
url.password = password
url.pathname = `/${NEW_DB}`
const newUrl = url.toString()

writeFileSync('.env.newdb.local', `DATABASE_URL=${newUrl}\n`, { mode: 0o600 })
console.log('connection: written to .env.newdb.local (0600, gitignored)')
console.log(`  host    : ${url.hostname}`)
console.log(`  database: ${NEW_DB}`)
console.log(`  role    : ${NEW_ROLE}`)

// --- copy -----------------------------------------------------------------
const target = new pg.Client({ connectionString: newUrl, ssl })
await target.connect()

const { rows: existing } = await target.query(
  `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
)
if (existing[0].n === 0) {
  console.log('\nnew database is empty — run the migrations before copying:')
  console.log('  node --env-file=.env.newdb.local scripts/migrate.mjs')
  await target.end()
  process.exit(0)
}

const from = new pg.Client({ connectionString: source, ssl })
await from.connect()

console.log('\ncopying rows:')
for (const table of TABLES) {
  const { rows } = await from.query(`SELECT * FROM ${table}`)
  if (rows.length === 0) {
    console.log(`  ${table.padEnd(20)} 0`)
    continue
  }
  const cols = Object.keys(rows[0])
  const colList = cols.map((c) => `"${c}"`).join(', ')
  for (const row of rows) {
    const params = cols.map((c) => row[c])
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
    await target.query(
      `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
      params,
    )
  }
  const { rows: after } = await target.query(`SELECT count(*)::int AS n FROM ${table}`)
  console.log(`  ${table.padEnd(20)} ${rows.length} copied → ${after[0].n} present`)
}

await from.end()
await target.end()

console.log('\nSource database untouched. Nothing was dropped.')
