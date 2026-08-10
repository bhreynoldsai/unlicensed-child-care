import { NextResponse } from 'next/server'

import { EMAIL_CONSENT_TEXT, consentHash } from '@/lib/consent'
import { withTransaction } from '@/lib/db'
import { readUnsubscribeToken } from '@/lib/unsubscribe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Honour an unsubscribe (CAN-SPAM).
 *
 * Two things happen, and the second is the one that matters legally:
 *
 *   1. supporters.status becomes 'unsubscribed', which is what sending code
 *      filters on.
 *   2. A consent_events row is APPENDED with granted = false. The original
 *      grant is never edited — Doc 03 §2 makes that trail append-only, and the
 *      revocation is as much a part of the record as the consent was.
 *
 * Accepts POST so that Gmail and Yahoo one-click unsubscribe
 * (List-Unsubscribe-Post) works without the recipient opening anything.
 */
async function unsubscribe(token: string | undefined, source: string) {
  const supporterId = readUnsubscribeToken(token)
  if (!supporterId) return { ok: false as const, status: 400 }

  try {
    const done = await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `UPDATE supporters
            SET status = 'unsubscribed', updated_at = now()
          WHERE id = $1
        RETURNING id`,
        [supporterId],
      )
      if (rows.length === 0) return false

      await client.query(
        `INSERT INTO consent_events
           (supporter_id, channel, granted, language_hash, language_text, source)
         VALUES ($1, 'email', false, $2, $3, $4)`,
        [supporterId, consentHash(EMAIL_CONSENT_TEXT), EMAIL_CONSENT_TEXT, source],
      )
      return true
    })

    // An unknown or already-removed id still reports success: the outcome the
    // person asked for is "stop emailing me", and a distinguishable failure
    // would turn this endpoint into a way to test whether an id exists.
    return { ok: true as const, status: 200, changed: done }
  } catch (err) {
    console.error('unsubscribe_failed', err instanceof Error ? err.message : 'unknown')
    return { ok: false as const, status: 500 }
  }
}

export async function POST(req: Request) {
  let token: string | undefined
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = (await req.json().catch(() => null)) as { token?: unknown } | null
    if (typeof body?.token === 'string') token = body.token
  } else {
    // One-click unsubscribe posts a form body and no token of its own, so the
    // identifier stays in the query string where the mail client found it.
    token = new URL(req.url).searchParams.get('u') ?? undefined
  }

  const result = await unsubscribe(token, 'one_click_unsubscribe')
  if (!result.ok) {
    return NextResponse.json({ message: 'That link is not valid.' }, { status: result.status })
  }
  return NextResponse.json({ ok: true })
}
