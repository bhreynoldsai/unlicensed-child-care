import { createHash } from 'crypto'

/**
 * Consent language.
 *
 * ⚠️ PLACEHOLDER PENDING COUNSEL REVIEW (2026-08-09).
 *
 * Email is the only channel. SMS was removed on 2026-08-10 — the programme is
 * not being run. Consent rows already collected on the `sms` channel remain in
 * `consent_events` (append-only) and stay quarantined; nothing reads them.
 *
 * These strings were drafted by the build team against TCPA and CAN-SPAM
 * requirements and are NOT yet lawyer-reviewed. The reasoning for every clause,
 * and the open questions, are in docs/05-consent-and-privacy-language-review.md.
 * Send that document to counsel; replace this notice with the review date once
 * it comes back.
 *
 * They are hashed and stored with every consent record so we can prove exactly
 * what a supporter was shown. Changing a string changes its hash, which is
 * correct — old records keep the old hash and text, because that is what those
 * people actually saw. Change them once, after review, not iteratively.
 *
 * Do not edit for tone or length. Every clause is load-bearing; see the review
 * packet for which requirement each one serves.
 */

/**
 * CAN-SPAM is an opt-out regime, so prior consent is not legally required for
 * commercial email. We use opt-in anyway: it is stricter than the law and it is
 * what Gmail and Yahoo's bulk-sender rules effectively require.
 */
export const EMAIL_CONSENT_TEXT =
  'I agree to receive email updates and action alerts about child care policy in Georgia from the Georgia Licensed Child Care Network. I can unsubscribe at any time using the link in any message. See our Privacy notice.'

/**
 * Required on every distribution material and on the sign-up page itself.
 * docs/03-data-privacy-and-compliance-plan.md §4 — employer-context guardrails.
 * Do not soften, shorten, or move into a footnote: it is the primary mitigation
 * for recruiting employees through their employers.
 */
export const VOLUNTARY_PARTICIPATION_NOTICE =
  'Participation is completely voluntary and has no effect on your employment.'

export function consentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export const CONSENT_VERSION = {
  email: consentHash(EMAIL_CONSENT_TEXT),
} as const
