import type { Metadata } from 'next'
import QRCode from 'qrcode'

import { LayersIcon } from '@/components/icons'
import { VOLUNTARY_PARTICIPATION_NOTICE } from '@/lib/consent'
import { SHARE_URL } from '@/lib/site'

import './poster.css'

export const metadata: Metadata = {
  title: 'Break room poster',
  robots: { index: false, follow: false },
}

/**
 * Letter-size printable poster for break room walls (Doc 04 — distribution).
 * It has to work at three feet: headline, one line of explanation, a big QR,
 * and the voluntary-participation line, which is required on every distribution
 * material (Doc 03 §4).
 *
 * The QR is generated from the same SHARE_URL the confirmation screen hands
 * out, so the printed code and the share link can never disagree. Print from
 * the browser at Letter, no margins, background graphics on.
 */
export default async function Poster() {
  const qrSvg = await QRCode.toString(SHARE_URL, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#201e1d', light: '#0000' },
  })

  const printedUrl = SHARE_URL.replace(/^https?:\/\//, '')

  return (
    <div className="poster-sheet">
      <section className="poster-page">
        <span className="poster-badge">
          <LayersIcon size={34} />
        </span>

        <h1 className="poster-headline">
          Licensed child care providers deserve a level playing field.
        </h1>

        <p className="poster-lede">
          Scan to sign up and find out which Georgia legislators represent you &mdash; it
          takes about two minutes.
        </p>

        <div
          className="poster-qr"
          role="img"
          aria-label={`QR code linking to ${printedUrl}`}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <p className="poster-notice">{VOLUNTARY_PARTICIPATION_NOTICE}</p>

        <p className="poster-url">{printedUrl}</p>
      </section>
    </div>
  )
}
