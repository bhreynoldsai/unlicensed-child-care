import { NextResponse } from 'next/server'

import {
  SESSION_COOKIE,
  authConfigured,
  createSession,
  isAllowedAdmin,
  sessionCookieOptions,
  verifyPassword,
} from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One generic message for every rejection. Distinguishing "unknown email" from
 * "wrong password" would let anyone enumerate the campaign's staff.
 */
const REJECTED = 'Those credentials were not accepted.'

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip')
}

export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json({ message: 'Admin access is not configured.' }, { status: 503 })
  }

  // A shared password is guessable at scale; throttle attempts hard.
  const limit = await checkRateLimit({
    scope: 'admin_login',
    identifier: clientIp(req) ?? 'unknown',
    max: 5,
    windowSeconds: 15 * 60,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { message: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: REJECTED }, { status: 400 })
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ message: REJECTED }, { status: 401 })
  }

  // Always run the password check, even for an unknown email, so the response
  // time does not reveal whether the address is on the allowlist.
  const passwordOk = await verifyPassword(password)
  if (!isAllowedAdmin(email) || !passwordOk) {
    return NextResponse.json({ message: REJECTED }, { status: 401 })
  }

  const token = await createSession(email)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
  return response
}
