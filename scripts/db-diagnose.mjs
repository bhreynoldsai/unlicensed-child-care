#!/usr/bin/env node
/**
 * Show the shape of every database-ish environment variable without printing
 * any credentials.
 *
 *   node --env-file=.env.vercel scripts/db-diagnose.mjs
 *
 * Exists because "getaddrinfo ENOTFOUND <something odd>" only tells you the
 * connection string is malformed, not how — and the obvious way to look costs
 * you a password in your shell history.
 */

const names = Object.keys(process.env)
  .filter((k) => /^(DATABASE|POSTGRES|PG|NEON)/i.test(k) && !/PASSWORD/i.test(k))
  .sort()

console.log('database-ish variables present:\n')

for (const name of names) {
  const value = process.env[name] ?? ''
  let shape
  try {
    const u = new URL(value)
    shape = `${u.protocol}//${u.username ? '<user>:<pw>@' : ''}${u.hostname}${u.pathname}`
  } catch {
    shape = `NOT A URL — ${value.length} chars, starts "${value.slice(0, 14)}"`
  }
  console.log(`  ${name}`)
  console.log(`      ${shape}`)
  if (/-pooler\./.test(value)) console.log('      ^ pooled connection')
}

if (names.length === 0) console.log('  (none found)')

console.log(
  '\nlib/db.ts reads DATABASE_URL specifically. If the working string is under\n' +
    'a different name, add DATABASE_URL in Vercel with that same value.',
)
