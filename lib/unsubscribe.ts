/**
 * Unsubscribe tokens.
 *
 * Every marketing email carries a one-click unsubscribe link (CAN-SPAM). The
 * link has to identify the supporter without letting anyone unsubscribe anyone
 * else, so it carries an HMAC of the supporter's id rather than their email —
 * a bare `?email=` parameter would let a stranger silence a whole list, and it
 * would leak addresses into referrer headers and server logs.
 *
 * Tokens do not expire. CAN-SPAM requires an unsubscribe mechanism that still
 * works at least 30 days after a message is sent, and an expired link is worse
 * for the recipient than a long-lived one whose only power is to stop mail.
 *
 * Signed with AUTH_SECRET, so rotating that key invalidates every outstanding
 * link. If you rotate it, honour any bounced unsubscribe requests manually.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

function sign(supporterId: string, secret: string): string {
  return createHmac('sha256', secret).update(supporterId, 'utf8').digest('base64url')
}

export function createUnsubscribeToken(supporterId: string): string | null {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  return `${supporterId}.${sign(supporterId, secret)}`
}

/** Returns the supporter id when the signature checks out, otherwise null. */
export function readUnsubscribeToken(token: string | undefined): string | null {
  const secret = process.env.AUTH_SECRET
  if (!token || !secret) return null

  const separator = token.lastIndexOf('.')
  if (separator < 1) return null

  const supporterId = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = sign(supporterId, secret)

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  return supporterId
}

export function unsubscribeUrl(siteUrl: string, supporterId: string): string | null {
  const token = createUnsubscribeToken(supporterId)
  if (!token) return null
  return `${siteUrl.replace(/\/+$/, '')}/unsubscribe?u=${encodeURIComponent(token)}`
}
