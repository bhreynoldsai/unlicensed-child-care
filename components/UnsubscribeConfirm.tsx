'use client'

import { useState } from 'react'

import { CheckIcon } from '@/components/icons'

/**
 * One-click confirmation for a valid unsubscribe link.
 *
 * The click is deliberate rather than automatic on page load: mail clients and
 * security scanners prefetch links, and an unsubscribe that fires on GET would
 * silently remove people who never asked.
 */
export function UnsubscribeConfirm({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')

  async function confirm() {
    setState('working')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-[32px] bg-white p-6 shadow-card sm:p-9">
        <h2 className="mb-2 flex items-center gap-2 font-heading text-[22px]">
          <CheckIcon size={20} className="text-navy-900" />
          You&rsquo;re unsubscribed.
        </h2>
        <p className="text-[15px] leading-[1.55] text-navy-500">
          You will not receive further email from us. Anything already in transit may
          still arrive shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 text-base leading-[1.65]">
      <p>Confirm below and we will stop sending you email.</p>

      {state === 'error' ? (
        <p
          role="alert"
          className="rounded-md border-[1.5px] border-danger bg-danger-bg px-4 py-3.5 text-[15px] text-danger"
        >
          We could not complete that. Please try again, or reply to any message from us
          and we will remove you by hand.
        </p>
      ) : null}

      <div>
        <button
          type="button"
          className="btn-primary"
          onClick={confirm}
          disabled={state === 'working'}
        >
          {state === 'working' ? <span className="spinner" /> : null}
          {state === 'working' ? 'Unsubscribing…' : 'Unsubscribe me'}
        </button>
      </div>
    </div>
  )
}
