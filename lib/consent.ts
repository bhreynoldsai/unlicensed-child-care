import { createHash } from 'crypto'

/**
 * VERBATIM consent language from docs/03-data-privacy-and-compliance-plan.md §2.
 *
 * DO NOT EDIT these strings without counsel review. They are hashed and stored
 * with every consent record so we can prove exactly what a supporter was shown.
 * Changing a string changes its hash, which is correct — old records keep the
 * old hash and text.
 */
export const EMAIL_CONSENT_TEXT =
  'I agree to receive email updates and action alerts about child care policy in Georgia. I can unsubscribe at any time.'

export const SMS_CONSENT_TEXT =
  'I agree to receive recurring text message alerts (including autodialed messages) about child care policy at the mobile number I provided. Consent is not a condition of participation. Message and data rates may apply. Reply STOP to cancel, HELP for help.'

/**
 * Required on every distribution material and on the sign-up page itself.
 * docs/03 §4 — employer-context guardrails.
 */
export const VOLUNTARY_PARTICIPATION_NOTICE =
  'Participation is completely voluntary and has no effect on your employment.'

export function consentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export const CONSENT_VERSION = {
  email: consentHash(EMAIL_CONSENT_TEXT),
  sms: consentHash(SMS_CONSENT_TEXT),
} as const
