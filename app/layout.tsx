import type { Metadata, Viewport } from 'next'
import { Caprasimo, Figtree } from 'next/font/google'

import { PeopleIcon } from '@/components/icons'
import { SITE_NAME } from '@/lib/site'
import './globals.css'

const caprasimo = Caprasimo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const figtree = Figtree({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Stand Up for Licensed Child Care in Georgia',
  description:
    'Join Georgia child care professionals speaking up about license-exempt programs. Sign up to be matched with your state legislators.',
  robots: { index: false, follow: false }, // flip to true at launch
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5ead8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caprasimo.variable} ${figtree.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col">
          {/* The wordmark slot is deliberately typographic. The sponsoring
              entity is unconfirmed (Doc 01), so nothing here bakes in a company
              logo — swap the badge and the name together once it is. */}
          <header className="flex items-center gap-3 border-b border-ink/[.16] px-5 py-s4 sm:px-12">
            <span className="grid h-[34px] w-[34px] flex-none place-content-center rounded-full bg-sage-200">
              <PeopleIcon size={18} className="text-sage-800" />
            </span>
            <span className="font-heading text-lg tracking-[-0.01em]">{SITE_NAME}</span>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-ink/[.16] px-5 py-s6 text-[13px] leading-[1.6] text-ink/[.65] sm:px-8">
            <div className="mx-auto grid max-w-[640px] gap-1.5">
              {/* CAN-SPAM: real sender identity + physical postal address.
                  Fill these in once the sponsoring entity is confirmed. */}
              <p className="font-semibold text-ink/[.85]">{SITE_NAME}</p>
              <p>[Street address] &middot; [City], GA [ZIP]</p>
              <p>
                Paid for by [SPONSORING ENTITY &mdash; TO BE CONFIRMED]. Not authorized by
                any candidate or candidate committee.
              </p>
              <p>
                <a className="text-accent-700 underline hover:text-accent" href="/privacy">
                  Privacy notice
                </a>{' '}
                &middot;{' '}
                <a className="text-accent-700 underline hover:text-accent" href="/unsubscribe">
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
