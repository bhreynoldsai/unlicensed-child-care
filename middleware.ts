import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, authConfigured, readSession } from '@/lib/auth'

/**
 * Gates `/admin`. The page reads supporter density (Doc 03 §4) and must never
 * be publicly reachable.
 *
 * Fails closed: if AUTH_SECRET, ADMIN_PASSWORD, or ADMIN_ALLOWED_EMAILS is
 * missing, the route is unavailable rather than unprotected.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (!authConfigured()) {
    return new NextResponse(
      'Admin access is not configured. Set AUTH_SECRET, ADMIN_PASSWORD, and ADMIN_ALLOWED_EMAILS.',
      { status: 503, headers: { 'content-type': 'text/plain' } },
    )
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (session) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
