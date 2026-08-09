/**
 * Admin authentication.
 *
 * `/admin` exposes district density. Doc 03 §4 keeps that aggregate-only, but
 * aggregate does not mean public — the page must sit behind campaign-administrator
 * auth before it is reachable.
 *
 * Deliberately dependency-free and Edge-compatible (Web Crypto, not node:crypto)
 * so the same helpers work in `middleware.ts` and in route handlers.
 *
 * Model: an admin identifies with their own email, which must appear in
 * ADMIN_ALLOWED_EMAILS, and authenticates with a shared ADMIN_PASSWORD. The
 * email is what `export_audit.admin_email` records, so exports stay attributable
 * even though the secret is shared.
 *
 * Limitation, stated plainly: a shared password cannot distinguish two people who
 * both know it. That is acceptable for a short campaign with a handful of staff
 * and a rotating secret; it is not acceptable long-term. Replace with SSO or
 * email magic links once an identity provider or ESP exists.
 */

export const SESSION_COOKIE = 'uc_admin'

/** Eight hours: long enough for a working day, short enough that a forgotten laptop expires. */
const SESSION_TTL_SECONDS = 8 * 60 * 60

function encoder() {
  return new TextEncoder()
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Compare without leaking match position through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder().encode(payload))
  return bytesToHex(new Uint8Array(signature))
}

export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedAdmin(email: string): boolean {
  const allowed = allowedAdminEmails()
  if (allowed.length === 0) return false
  return allowed.includes(email.trim().toLowerCase())
}

/**
 * Auth is unavailable rather than open when it is misconfigured. A missing
 * AUTH_SECRET, ADMIN_PASSWORD, or allowlist must never mean "let everyone in".
 */
export function authConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET && process.env.ADMIN_PASSWORD && allowedAdminEmails().length > 0,
  )
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  // Hash both sides first so the comparison is over fixed-length strings and
  // cannot leak the real password's length.
  const secret = process.env.AUTH_SECRET ?? ''
  const [a, b] = await Promise.all([hmac(candidate, secret), hmac(expected, secret)])
  return timingSafeEqual(a, b)
}

export async function createSession(email: string): Promise<string> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${email.trim().toLowerCase()}|${expiresAt}`
  const signature = await hmac(payload, secret)
  return `${btoa(payload)}.${signature}`
}

export type AdminSession = { email: string; expiresAt: number }

export async function readSession(token: string | undefined): Promise<AdminSession | null> {
  const secret = process.env.AUTH_SECRET
  if (!token || !secret) return null

  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  let payload: string
  try {
    payload = atob(encoded)
  } catch {
    return null
  }

  const expected = await hmac(payload, secret)
  if (!timingSafeEqual(signature, expected)) return null

  const [email, expiresRaw] = payload.split('|')
  const expiresAt = Number(expiresRaw)
  if (!email || !Number.isFinite(expiresAt)) return null
  if (expiresAt * 1000 < Date.now()) return null

  // The allowlist is re-checked on every request, so removing someone from
  // ADMIN_ALLOWED_EMAILS revokes them immediately rather than at session expiry.
  if (!isAllowedAdmin(email)) return null

  return { email, expiresAt }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}
