import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stand Up for Licensed Child Care in Georgia',
  description:
    'Join Georgia child care professionals speaking up about license-exempt programs. Sign up to be matched with your state legislators.',
  robots: { index: false, follow: false }, // flip to true at launch
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a5f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-navy-900 text-white">
            <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
              <div className="h-8 w-1.5 rounded bg-gold-500" aria-hidden />
              <span className="font-semibold tracking-tight">
                Georgia Licensed Child Care Network
              </span>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="bg-navy-900 text-navy-100 text-xs">
            <div className="mx-auto max-w-2xl px-4 py-6 space-y-2">
              {/* CAN-SPAM: real sender identity + physical postal address.
                  Fill these in once the sponsoring entity is confirmed. */}
              <p className="font-medium text-white">
                Paid for by [SPONSORING ENTITY — TO BE CONFIRMED]
              </p>
              <p>[Street address] · [City], GA [ZIP]</p>
              <p>
                <a className="underline hover:text-gold-300" href="/privacy">
                  Privacy notice
                </a>{' '}
                ·{' '}
                <a className="underline hover:text-gold-300" href="/unsubscribe">
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
