import { NextResponse, after } from 'next/server'
import { signupSchema } from '@/lib/validation'
import { withTransaction } from '@/lib/db'
import { matchAddress, FAILED_MATCH } from '@/lib/districts'
import {
  EMAIL_CONSENT_TEXT,
  SMS_CONSENT_TEXT,
  consentHash,
} from '@/lib/consent'
import { sendConfirmation } from '@/lib/email'
import { lookupLegislators } from '@/lib/legislators'
import { checkRateLimit } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/site'
import { verifyTurnstile } from '@/lib/turnstile'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * This request does a lot of sequential network work before it can answer:
 * a rate-limit query, Turnstile verification, two full geocode ladders (each
 * of which may fall through to Mapbox), a transaction, and a roster lookup.
 * The default ceiling leaves no headroom for the slowest case.
 */
export const maxDuration = 60

/**
 * Generous enough that a break room full of staff on one Wi-Fi network can all
 * sign up, tight enough that a script cannot flood the supporter table.
 */
const SIGNUP_RATE_LIMIT = { max: 20, windowSeconds: 60 * 60 }

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')
}

export async function POST(req: Request) {
  const requestIp = clientIp(req)

  const limit = await checkRateLimit({
    scope: 'signup',
    identifier: requestIp ?? 'unknown',
    ...SIGNUP_RATE_LIMIT,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { message: 'Too many sign-ups from this connection. Please try again later.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  // Bot check before validation: no point geocoding or touching the database
  // for a request that cannot prove it came from a browser.
  const turnstileToken = (json as { turnstileToken?: unknown } | null)?.turnstileToken
  const humanVerified = await verifyTurnstile(
    typeof turnstileToken === 'string' ? turnstileToken : undefined,
    requestIp,
  )
  if (!humanVerified) {
    return NextResponse.json(
      { message: 'We could not verify that request. Please reload the page and try again.' },
      { status: 403 },
    )
  }

  const parsed = signupSchema.safeParse(json)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_form'
      if (!errors[key]) errors[key] = issue.message
    }
    return NextResponse.json({ errors }, { status: 422 })
  }

  const d = parsed.data
  const ip = requestIp
  const userAgent = req.headers.get('user-agent')

  // Geocode both addresses (Doc 02 §4). Never block sign-up on a geocoder
  // failure — a failed match is recorded and picked up by the re-match batch.
  const [homeMatch, employerMatch] = await Promise.all([
    matchAddress({ street: d.homeStreet, city: d.homeCity, state: d.homeState, zip: d.homeZip }).catch(
      () => FAILED_MATCH,
    ),
    matchAddress({
      street: d.employerStreet,
      city: d.employerCity,
      state: d.employerState,
      zip: d.employerZip,
    }).catch(() => FAILED_MATCH),
  ])

  let supporterId: string | null = null

  try {
    supporterId = await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO supporters (
           first_name, last_name, email, cell_phone, other_phone,
           home_street, home_street2, home_city, home_state, home_zip,
           employer_name, employer_street, employer_city, employer_state, employer_zip,
           role, role_other, source_center_code
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (lower(email)) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name  = EXCLUDED.last_name,
           cell_phone = EXCLUDED.cell_phone,
           other_phone = EXCLUDED.other_phone,
           home_street = EXCLUDED.home_street,
           home_street2 = EXCLUDED.home_street2,
           home_city = EXCLUDED.home_city,
           home_state = EXCLUDED.home_state,
           home_zip = EXCLUDED.home_zip,
           employer_name = EXCLUDED.employer_name,
           employer_street = EXCLUDED.employer_street,
           employer_city = EXCLUDED.employer_city,
           employer_state = EXCLUDED.employer_state,
           employer_zip = EXCLUDED.employer_zip,
           role = EXCLUDED.role,
           role_other = EXCLUDED.role_other,
           status = 'active',
           updated_at = now()
         RETURNING id`,
        [
          d.firstName, d.lastName, d.email, d.cellPhone, d.otherPhone,
          d.homeStreet, d.homeStreet2 ?? null, d.homeCity, d.homeState, d.homeZip,
          d.employerName, d.employerStreet, d.employerCity, d.employerState, d.employerZip,
          d.role, d.roleOther ?? null, d.sourceCenterCode ?? null,
        ],
      )

      const supporterId = rows[0]!.id

      // Consent is append-only. One row per channel per submission, with the
      // verbatim language and its hash. This is the TCPA evidence record.
      const consents: Array<[string, boolean, string]> = [
        ['email', true, EMAIL_CONSENT_TEXT],
        ['sms', d.smsConsent, SMS_CONSENT_TEXT],
      ]
      for (const [channel, granted, text] of consents) {
        await client.query(
          `INSERT INTO consent_events
             (supporter_id, channel, granted, language_hash, language_text, source, ip_address, user_agent)
           VALUES ($1,$2,$3,$4,$5,'signup_form',$6,$7)`,
          [supporterId, channel, granted, consentHash(text), text, ip, userAgent],
        )
      }

      for (const [kind, m] of [['home', homeMatch], ['employer', employerMatch]] as const) {
        await client.query(
          `INSERT INTO district_matches
             (supporter_id, address_kind, latitude, longitude, geocoder, match_quality,
              state_house, state_senate, congressional, county, boundary_vintage)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (supporter_id, address_kind) DO UPDATE SET
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             geocoder = EXCLUDED.geocoder,
             match_quality = EXCLUDED.match_quality,
             state_house = EXCLUDED.state_house,
             state_senate = EXCLUDED.state_senate,
             congressional = EXCLUDED.congressional,
             county = EXCLUDED.county,
             boundary_vintage = EXCLUDED.boundary_vintage,
             matched_at = now()`,
          [
            supporterId, kind, m.latitude, m.longitude, m.geocoder, m.matchQuality,
            m.stateHouse, m.stateSenate, m.congressional, m.county, m.boundaryVintage,
          ],
        )
      }

      // Returned so the confirmation email can address them after commit.
      return supporterId
    })
  } catch (err) {
    // Never log PII. Log the shape of the failure only.
    console.error('signup_failed', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json(
      { message: 'We could not complete your sign-up. Please try again in a moment.' },
      { status: 500 },
    )
  }

  // Name the members, not just the district numbers (Doc 02 §6). Looked up
  // after the transaction commits: a roster miss must never cost a sign-up.
  const legislators = await lookupLegislators(homeMatch.stateHouse, homeMatch.stateSenate)

  // Confirmation email runs AFTER the response is sent.
  //
  // Awaiting it here put the send at the end of an already long request, where
  // it raced the function's own deadline and aborted — the supporter was saved
  // but never heard from us. `after()` takes it off the critical path entirely:
  // the person sees their legislators immediately, and the mail goes out on the
  // platform's time rather than theirs.
  //
  // Still best effort. The supporter is committed either way; a mail failure is
  // logged, never surfaced as a failed sign-up.
  if (supporterId) {
    const id = supporterId
    after(async () => {
      try {
        await sendConfirmation({
          supporterId: id,
          firstName: d.firstName,
          email: d.email,
          siteUrl: SITE_URL,
          house: { district: homeMatch.stateHouse, name: legislators.house?.name ?? null },
          senate: { district: homeMatch.stateSenate, name: legislators.senate?.name ?? null },
        })
      } catch (err) {
        console.error('confirmation_email_failed', err instanceof Error ? err.message : 'unknown')
      }
    })
  }

  return NextResponse.json({
    ok: true,
    districts: {
      stateHouse: homeMatch.stateHouse,
      stateSenate: homeMatch.stateSenate,
      congressional: homeMatch.congressional,
    },
    legislators,
  })
}
