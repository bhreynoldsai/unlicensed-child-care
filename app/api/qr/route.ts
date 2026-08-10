import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

import { SHARE_URL } from '@/lib/site'

export const runtime = 'nodejs'

/**
 * Downloadable QR code for the sign-up link.
 *
 * Generated from the same SHARE_URL the poster and the confirmation screen use,
 * so a code printed on a flyer, a name badge, or a slide can never point
 * somewhere different from the one on the break room poster.
 *
 * Public on purpose: it encodes a public URL, and the whole point is that
 * anyone making materials can grab it without asking.
 *
 *   /api/qr            → PNG, 1024px, for print
 *   /api/qr?format=svg → vector, for a designer
 *   /api/qr?size=2048  → larger PNG (capped at 4096)
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const format = params.get('format') === 'svg' ? 'svg' : 'png'

  // Large enough to print at poster size without softening. Capped so the
  // endpoint cannot be used to burn CPU.
  const requested = Number(params.get('size') ?? 1024)
  const size = Number.isFinite(requested) ? Math.min(Math.max(requested, 256), 4096) : 1024

  const options = {
    errorCorrectionLevel: 'M' as const,
    // A quiet zone is not decoration — scanners need it to find the code.
    margin: 2,
    color: { dark: '#0F2340', light: '#FFFFFFFF' },
  }

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(SHARE_URL, { ...options, type: 'svg', width: size })
      return new NextResponse(svg, {
        headers: {
          'content-type': 'image/svg+xml',
          'content-disposition': 'attachment; filename="glccn-signup-qr.svg"',
          'cache-control': 'public, max-age=3600',
        },
      })
    }

    const png = await QRCode.toBuffer(SHARE_URL, { ...options, type: 'png', width: size })
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'content-type': 'image/png',
        'content-disposition': `attachment; filename="glccn-signup-qr-${size}.png"`,
        'cache-control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('qr_generation_failed', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ message: 'Could not generate the QR code.' }, { status: 500 })
  }
}
