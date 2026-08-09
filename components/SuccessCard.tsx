'use client'

import { useEffect, useRef, useState } from 'react'

import { CheckIcon } from '@/components/icons'
import { SHARE_URL } from '@/lib/site'

export interface MatchedDistricts {
  stateHouse: string | null
  stateSenate: string | null
  congressional: string | null
}

/**
 * The highest-value screen in the system (Doc 02 §6): seeing your own districts
 * named back to you is the reward for an 18-field form, so it is designed as a
 * payoff rather than a generic "thanks, we got it".
 *
 * Only the two state districts are shown. The API also returns the
 * congressional district, but this campaign's ask is to the General Assembly.
 *
 * Gap (CLAUDE.md): once the legislator roster lands, join the district numbers
 * to names so this can read "Your Representative is …".
 */
export default function SuccessCard({ districts }: { districts: MatchedDistricts }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const matched = Boolean(districts.stateHouse || districts.stateSenate)

  // The form this replaced had focus; move it here so keyboard and screen
  // reader users land on the confirmation rather than the top of the page.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SHARE_URL)
      setCopied(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setCopied(false), 2400)
    } catch {
      // Clipboard access can be blocked (insecure context, permissions). The
      // link is visible on screen, so failing quietly is the right outcome.
      setCopied(false)
    }
  }

  return (
    <div className="rounded-[32px] bg-surface p-6 shadow-card sm:p-9">
      <h2 ref={headingRef} tabIndex={-1} className="mb-2 font-heading text-[26px] outline-none">
        You&rsquo;re signed up. Thank you.
      </h2>

      {matched ? (
        <>
          <p className="mb-5 text-[15px] leading-[1.55] text-ink/80">
            Based on your home address, you are represented by:
          </p>

          <div className="grid gap-3">
            <div className="rounded-md bg-accent-100 px-[18px] py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-800">
                Georgia House
              </div>
              <div className="mt-1 font-heading text-2xl">
                {districts.stateHouse ? `District ${districts.stateHouse}` : 'Not matched'}
              </div>
            </div>
            <div className="rounded-md bg-sage-100 px-[18px] py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sage-800">
                Georgia Senate
              </div>
              <div className="mt-1 font-heading text-2xl">
                {districts.stateSenate ? `District ${districts.stateSenate}` : 'Not matched'}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[15px] leading-[1.55] text-ink/80">
          We could not match your address to a district automatically, but your sign-up is
          recorded. We will confirm your state House and Senate districts in your first
          email.
        </p>
      )}

      <div className="mt-s6 border-t border-ink/[.16] pt-5">
        <h3 className="mb-1.5 font-heading text-lg">Help us reach your coworkers</h3>
        <p className="mb-4 text-sm leading-[1.55] text-ink/[.78]">
          The more licensed providers in each district, the more weight this carries. Share
          this link with anyone in licensed child care.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[200px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-[1.5px] border-dashed border-ink/[.16] bg-sand px-3.5 py-2.5 text-sm text-ink/[.65]">
            {SHARE_URL.replace(/^https?:\/\//, '')}
          </div>
          <button type="button" className="btn-primary btn-compact" onClick={copyLink}>
            {copied ? (
              <>
                <CheckIcon size={16} />
                Copied
              </>
            ) : (
              'Copy link'
            )}
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          {copied ? 'Link copied to clipboard.' : ''}
        </p>
      </div>
    </div>
  )
}
