/**
 * Transactional email via Resend.
 *
 * Deliberately dependency-free — Resend's REST API is one POST, and an SDK is
 * not worth the supply chain for that.
 *
 * Sending is disabled when EMAIL_API_KEY is unset, so local development and
 * tests never send real mail. `emailConfigured()` lets the preflight check
 * assert it is on in production.
 *
 * A send failure NEVER fails a sign-up. The supporter is already committed by
 * the time this runs; losing a confirmation email is an inconvenience, losing
 * the sign-up is the whole point of the program.
 */

import { SPONSOR_NAME, SPONSOR_POSTAL_ADDRESS } from '@/lib/sponsor'
import { unsubscribeUrl } from '@/lib/unsubscribe'

const RESEND_URL = 'https://api.resend.com/emails'

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM_ADDRESS)
}

export interface ConfirmationInput {
  supporterId: string
  firstName: string
  email: string
  siteUrl: string
  house: { district: string | null; name: string | null }
  senate: { district: string | null; name: string | null }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function seatLine(label: string, seat: { district: string | null; name: string | null }): string {
  if (!seat.district) return `${label}: we could not match this yet — we'll confirm it soon.`
  if (!seat.name) return `${label}: District ${seat.district}`
  return `${label}: ${seat.name} (District ${seat.district})`
}

/**
 * Plain text alongside HTML. A meaningful share of this audience reads mail on
 * older Android clients, and a text part also helps deliverability.
 */
export function buildConfirmation(input: ConfirmationInput): {
  subject: string
  text: string
  html: string
  unsubscribe: string | null
} {
  const unsubscribe = unsubscribeUrl(input.siteUrl, input.supporterId)
  const share = `${input.siteUrl.replace(/\/+$/, '')}/join`

  const seats = [seatLine('Georgia House', input.house), seatLine('Georgia Senate', input.senate)]

  const text = [
    `Hi ${input.firstName},`,
    '',
    `Thanks for signing up with ${SPONSOR_NAME}. Based on your home address, you are represented by:`,
    '',
    ...seats.map((s) => `  ${s}`),
    '',
    "If that doesn't look right, just reply to this email and we'll correct it.",
    '',
    `Share this with anyone else in licensed child care: ${share}`,
    '',
    'Participation is completely voluntary and has no effect on your employment.',
    '',
    '—',
    SPONSOR_NAME,
    SPONSOR_POSTAL_ADDRESS ?? '',
    unsubscribe ? `Unsubscribe: ${unsubscribe}` : '',
  ]
    .filter((line) => line !== null)
    .join('\n')

  const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:16px;line-height:1.6;color:#201e1d;max-width:560px">
  <p>Hi ${escapeHtml(input.firstName)},</p>
  <p>Thanks for signing up with ${escapeHtml(SPONSOR_NAME)}. Based on your home address, you are represented by:</p>
  <ul style="padding-left:18px">
    ${seats.map((s) => `<li style="margin-bottom:6px">${escapeHtml(s)}</li>`).join('')}
  </ul>
  <p>If that doesn&rsquo;t look right, just reply to this email and we&rsquo;ll correct it.</p>
  <p>Share this with anyone else in licensed child care:<br>
    <a href="${escapeHtml(share)}" style="color:#8c491a">${escapeHtml(share)}</a></p>
  <p style="background:#f0fae1;color:#3d472b;padding:12px 14px;border-radius:8px;font-weight:600">
    Participation is completely voluntary and has no effect on your employment.
  </p>
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0">
  <p style="font-size:13px;color:#645c50">
    ${escapeHtml(SPONSOR_NAME)}<br>
    ${escapeHtml(SPONSOR_POSTAL_ADDRESS ?? '')}<br>
    ${unsubscribe ? `<a href="${escapeHtml(unsubscribe)}" style="color:#645c50">Unsubscribe</a>` : ''}
  </p>
</div>`.trim()

  return { subject: 'You&rsquo;re signed up — here are your legislators', text, html, unsubscribe }
}

export async function sendConfirmation(input: ConfirmationInput): Promise<void> {
  if (!emailConfigured()) return

  const { subject, text, html, unsubscribe } = buildConfirmation(input)

  const headers: Record<string, string> = {
    authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
    'content-type': 'application/json',
  }

  const body: Record<string, unknown> = {
    from: process.env.EMAIL_FROM_ADDRESS,
    to: [input.email],
    subject: subject.replace('&rsquo;', '’'),
    text,
    html,
  }

  // One-click unsubscribe. Gmail and Yahoo require these headers on bulk mail,
  // and they let someone opt out without opening the message.
  if (unsubscribe) {
    body.headers = {
      'List-Unsubscribe': `<${unsubscribe}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }
  }

  if (process.env.EMAIL_REPLY_TO) body.reply_to = process.env.EMAIL_REPLY_TO

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    throw new Error(`Resend returned ${res.status}`)
  }
}
