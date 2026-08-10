'use client'

import { useEffect, useRef, useState } from 'react'

import { CheckIcon } from '@/components/icons'
import { CONTACT_EMAIL, SHARE_URL } from '@/lib/site'

export interface MatchedDistricts {
  stateHouse: string | null
  stateSenate: string | null
  congressional: string | null
}

export interface Legislator {
  name: string
  party: string | null
  email: string | null
  phone: string | null
  url: string | null
}

export interface MatchedLegislators {
  house: Legislator | null
  senate: Legislator | null
}

/**
 * One seat. The member's name leads and the district number becomes the label
 * above it — a name is what makes this feel like a real person to contact, and
 * it is also what lets a supporter notice a bad address match.
 *
 * A seat can be genuinely vacant between a resignation and its special
 * election, so the district alone has to read as a complete, unbroken result.
 */
function SeatCard({
  chamberLabel,
  district,
  legislator,
}: {
  chamberLabel: string
  district: string | null
  legislator: Legislator | null
}) {
  return (
    <div className="rounded-md bg-white px-[18px] py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-navy-500">
        {chamberLabel}
        {district ? ` · District ${district}` : ''}
      </div>

      {legislator ? (
        <>
          <div className="mt-1 font-heading text-2xl font-bold leading-tight text-navy-900">
            {legislator.name}
          </div>
          {legislator.party ? (
            <div className="mt-0.5 text-sm text-navy-500">{legislator.party}</div>
          ) : null}
          {legislator.url ? (
            <a
              href={legislator.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-sm text-navy-700 underline hover:text-navy-900"
            >
              Official page
            </a>
          ) : null}
        </>
      ) : district ? (
        <div className="mt-1 font-heading text-2xl font-bold leading-tight text-navy-900">
          District {district}
        </div>
      ) : (
        <div className="mt-1 text-[15px] text-navy-500">
          We&rsquo;ll confirm this in your first email.
        </div>
      )}
    </div>
  )
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
export default function SuccessCard({
  districts,
  legislators,
}: {
  districts: MatchedDistricts
  legislators?: MatchedLegislators
}) {
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
    <div className="overflow-hidden rounded-md bg-navy-900">
      <div className="h-1 bg-gold-500" />
      <div className="p-6 sm:p-8">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-2 font-heading text-2xl font-bold text-white outline-none"
      >
        You&rsquo;re connected to your Georgia legislators.
      </h2>

      {matched ? (
        <>
          <p className="mb-5 text-[15px] leading-[1.55] text-navy-100">
            Based on your home address, you are represented by:
          </p>

          <div className="grid gap-3">
            <SeatCard
              chamberLabel="Georgia House"
              district={districts.stateHouse}
              legislator={legislators?.house ?? null}
            />
            <SeatCard
              chamberLabel="Georgia Senate"
              district={districts.stateSenate}
              legislator={legislators?.senate ?? null}
            />
          </div>

          {CONTACT_EMAIL && (legislators?.house || legislators?.senate) ? (
            <p className="mt-3 text-[13px] leading-[1.55] text-navy-200">
              Not who you expected? Addresses near a district line can match the
              wrong side.{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Legislator match looks wrong')}`}
                className="text-gold-300 underline hover:text-white"
              >
                Tell us
              </a>{' '}
              and we&rsquo;ll correct it.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-[15px] leading-[1.55] text-navy-100">
          We could not match your address to a district automatically, but your sign-up is
          recorded. We will confirm your state House and Senate districts in your first
          email.
        </p>
      )}

      <div className="mt-7 border-t border-white/15 pt-6">
        <h3 className="mb-1.5 font-heading text-[17px] font-semibold text-white">
          Share with a coworker
        </h3>
        <p className="mb-3.5 text-sm leading-[1.55] text-navy-100">
          The more licensed providers in each district, the more weight this carries.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-[180px] flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-[1.5px] border-dashed border-gold-300 bg-white/[.08] px-3.5 py-3 text-sm text-gold-300">
            {SHARE_URL.replace(/^https?:\/\//, '')}
          </div>
          <button type="button" className="btn-gold" onClick={copyLink}>
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
    </div>
  )
}
