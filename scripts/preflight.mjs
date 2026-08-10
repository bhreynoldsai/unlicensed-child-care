#!/usr/bin/env node
/**
 * Launch readiness check.
 *
 *   npm run preflight
 *
 * Exists because the dangerous failures in this system are the silent ones.
 * Turnstile verification is skipped entirely when TURNSTILE_SECRET_KEY is
 * unset — the form keeps working, it just stops being protected. Nobody would
 * notice from the outside. Same for a missing legislator roster, or a footer
 * with no postal address.
 *
 * Run it against production config before announcing the URL, and again after
 * any environment change.
 */

const checks = []

function required(name, label, hint) {
  checks.push({
    level: 'blocker',
    ok: Boolean(process.env[name]?.trim()),
    label,
    hint,
  })
}

function advised(ok, label, hint) {
  checks.push({ level: 'advisory', ok, label, hint })
}

// --- Blockers: the URL should not be shared until these pass ---------------

required('DATABASE_URL', 'Database configured', 'Set DATABASE_URL.')

required(
  'TURNSTILE_SECRET_KEY',
  'Bot protection active',
  'Without this, Turnstile verification is SKIPPED and the public form is unprotected.',
)
required(
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'Bot protection widget rendered',
  'The server will reject every submission if the widget cannot produce a token.',
)

required('AUTH_SECRET', 'Admin session signing key', 'Generate with: openssl rand -hex 32')
required('ADMIN_PASSWORD', 'Admin password set', 'Generate with: openssl rand -base64 24')
required(
  'ADMIN_ALLOWED_EMAILS',
  'Admin allowlist set',
  '/admin returns 503 until all three admin variables are present.',
)

required(
  'NEXT_PUBLIC_SPONSOR_POSTAL_ADDRESS',
  'CAN-SPAM postal address in the footer',
  'A physical postal address is legally required in the disclosure block.',
)

required(
  'NEXT_PUBLIC_SITE_URL',
  'Public site URL set',
  'The poster QR code encodes this. Set it BEFORE printing posters.',
)

// --- Advisories: not illegal, but the program works worse without them -----

advised(
  Boolean(process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()),
  'Contact address for wrong-legislator reports',
  'Without it the confirmation screen offers no way to report a bad match — the only way a bad address match gets caught.',
)

advised(
  Boolean(process.env.EMAIL_API_KEY?.trim()) && Boolean(process.env.EMAIL_FROM_ADDRESS?.trim()),
  'Email provider configured',
  'Needs EMAIL_API_KEY and EMAIL_FROM_ADDRESS. Without both, no confirmation email\n       is sent and the unsubscribe link in it never exists — the CAN-SPAM gap.',
)

advised(
  Boolean(process.env.SMS_ACCOUNT_SID?.trim()),
  'SMS provider configured',
  'Optional — but do not show the SMS consent box in production if nothing can honor STOP.',
)

advised(
  Boolean(process.env.GEOCODER_FALLBACK_KEY?.trim()),
  'Commercial geocoder fallback',
  'Addresses the Census database does not contain will stay unmatched without one.',
)

// --- Database-dependent checks --------------------------------------------

if (process.env.DATABASE_URL) {
  const pg = (await import('pg')).default
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  })

  try {
    await client.connect()

    const { rows: tables } = await client.query(
      `SELECT to_regclass('public.supporters') AS supporters,
              to_regclass('public.rate_limits') AS rate_limits,
              to_regclass('public.legislators') AS legislators`,
    )
    const t = tables[0]
    advised(Boolean(t.supporters), 'Migrations applied', 'Run: npm run db:migrate')
    advised(Boolean(t.rate_limits), 'Rate-limit table present', 'Run: npm run db:migrate')

    if (t.legislators) {
      const { rows } = await client.query(
        `SELECT count(*) FILTER (WHERE chamber='lower')::int AS house,
                count(*) FILTER (WHERE chamber='upper')::int AS senate
           FROM legislators`,
      )
      const { house, senate } = rows[0]
      advised(
        house > 150 && senate > 45,
        `Legislator roster loaded (${house} House, ${senate} Senate)`,
        'Run: npm run legislators:import',
      )
    } else {
      advised(false, 'Legislator roster loaded', 'Run: npm run db:migrate && npm run legislators:import')
    }
  } catch (err) {
    advised(false, 'Database reachable', err instanceof Error ? err.message : 'unknown')
  } finally {
    await client.end().catch(() => {})
  }
}

// --- Report ----------------------------------------------------------------

const blockers = checks.filter((c) => c.level === 'blocker' && !c.ok)
const advisories = checks.filter((c) => c.level === 'advisory' && !c.ok)

for (const c of checks) {
  console.log(`  ${c.ok ? '✓' : c.level === 'blocker' ? '✗' : '!'}  ${c.label}`)
  if (!c.ok) console.log(`       ${c.hint}`)
}

console.log()
if (blockers.length === 0 && advisories.length === 0) {
  console.log('Ready to launch.')
  process.exit(0)
}

if (advisories.length) {
  console.log(`${advisories.length} advisory item(s) — the site runs, but read them.`)
}
if (blockers.length) {
  console.log(`${blockers.length} blocker(s). Do not share the URL until these pass.`)
  process.exit(1)
}
process.exit(0)
