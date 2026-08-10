'use client'

import Script from 'next/script'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile widget. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is unset, so local development and tests run without a Cloudflare account —
 * the server side skips verification under the same condition.
 *
 * Managed mode is usually invisible. Whether it stays invisible is Cloudflare's
 * call, so the widget occupies real layout space rather than being absolutely
 * positioned: a challenge that appears must not cover the submit button.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const domId = useId()

  const render = useCallback(() => {
    if (!siteKey || !scriptReady || !containerRef.current || widgetId.current) return
    if (!window.turnstile) return

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'light',
      callback: (token) => onToken(token),
      // A token is single-use and expires. Clearing it forces a fresh one
      // rather than letting the form submit something already spent.
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    })
  }, [onToken, scriptReady, siteKey])

  useEffect(() => {
    render()
  }, [render])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} id={domId} className="mt-3" />
    </>
  )
}
