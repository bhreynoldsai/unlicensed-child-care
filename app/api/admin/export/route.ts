import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { SESSION_COOKIE, readSession } from '@/lib/auth'
import { exportSupporters, parseFilter } from '@/lib/export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * CSV download (Doc 02 §5).
 *
 * `middleware.ts` gates /admin, but an API route under /api is NOT covered by
 * that matcher — so this re-checks the session itself. A download endpoint that
 * relied on someone else's gate would be one refactor away from being public.
 *
 * The admin's email comes from the session, never from the request, so
 * `export_audit.admin_email` cannot be spoofed by whoever calls it.
 */
export async function GET(request: Request) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ message: 'Not authorised.' }, { status: 401 })
  }

  const filter = parseFilter(new URL(request.url).searchParams)

  try {
    const { csv, rowCount } = await exportSupporters(session.email, filter)
    const stamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="supporters-${stamp}.csv"`,
        'x-row-count': String(rowCount),
        // Never let an export sit in a shared cache.
        'cache-control': 'no-store, private',
      },
    })
  } catch (err) {
    console.error('export_failed', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ message: 'Export failed.' }, { status: 500 })
  }
}
