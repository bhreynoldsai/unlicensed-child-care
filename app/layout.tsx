import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'

import { BrandMark } from '@/components/BrandMark'
import { SITE_NAME } from '@/lib/site'
import { SPONSOR_NAME, SPONSOR_POSTAL_ADDRESS } from '@/lib/sponsor'
import './globals.css'

const sourceSerif = Source_Serif_4({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Stand Up for Licensed Child Care in Georgia',
  description:
    'Join Georgia child care professionals speaking up about license-exempt programs. Sign up to be matched with your state legislators.',
  // Launched 2026-08-10. Set back to false only if the site is taken down or
  // paused — a page that is up but noindex is invisible to anyone searching for
  // it by name.
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F2340',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col">
          {/* Navy band with a 3px gold rule. The header and the hero below it
              read as one continuous dark block. */}
          <header className="flex items-center gap-3 border-b-[3px] border-gold-500 bg-navy-900 px-4 py-4 sm:px-6">
            <span className="flex size-[52px] flex-none items-center justify-center rounded-md bg-white sm:size-[76px]">
              <BrandMark size={36} className="sm:hidden" />
              <BrandMark size={50} className="hidden sm:block" />
            </span>
            <span className="font-heading text-xl font-bold leading-tight text-white sm:text-3xl">
              {SITE_NAME}
            </span>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="bg-navy-900 px-4 py-8 text-[13px] leading-[1.6] text-navy-300 sm:px-6">
            <div className="mx-auto grid max-w-frame gap-1.5">
              {/* Sender identity and a physical postal address.
                  No "Paid for by" line: O.C.G.A. § 21-5-34(f)(3) attribution is
                  triggered by communications intended to affect an election, and
                  this is pure legislative advocacy. A voluntary attribution that
                  named the wrong payer would be worse than none (docs/05 §7 Q3). */}
              <p className="font-bold text-white">{SPONSOR_NAME}</p>
              <p>
                {SPONSOR_POSTAL_ADDRESS ?? (
                  <span className="text-gold-300">
                    [Postal address required before launch &mdash; set
                    NEXT_PUBLIC_SPONSOR_POSTAL_ADDRESS]
                  </span>
                )}
              </p>
              <p>
                <a className="text-gold-300 underline hover:text-white" href="/privacy">
                  Privacy notice
                </a>{' '}
                &middot;{' '}
                <a className="text-gold-300 underline hover:text-white" href="/unsubscribe">
                  Unsubscribe
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
