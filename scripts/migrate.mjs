#!/usr/bin/env node
/**
 * Minimal forward-only migration runner.
 * Applies every db/*.sql file in filename order, once each.
 *
 *   npm run db:migrate
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const dbDir = join(here, '..', 'db')

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
})

await client.connect()
await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    text PRIMARY KEY,
    applied_at  timestamptz NOT NULL DEFAULT now()
  )
`)

const { rows } = await client.query('SELECT filename FROM schema_migrations')
const applied = new Set(rows.map((r) => r.filename))

const files = readdirSync(dbDir).filter((f) => f.endsWith('.sql')).sort()
let count = 0

for (const file of files) {
  if (applied.has(file)) continue
  const sql = readFileSync(join(dbDir, file), 'utf8')
  process.stdout.write(`applying ${file} … `)
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
    await client.query('COMMIT')
    console.log('ok')
    count++
  } catch (err) {
    await client.query('ROLLBACK')
    console.log('FAILED')
    console.error(err.message)
    await client.end()
    process.exit(1)
  }
}

console.log(count === 0 ? 'Already up to date.' : `Applied ${count} migration(s).`)
await client.end()
