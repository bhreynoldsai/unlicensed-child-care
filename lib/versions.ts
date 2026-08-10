/**
 * Versions stamped onto every consent record (docs/05 §8.2).
 *
 * The consent text hash proves what the string was. It does not prove that a
 * particular person agreed to it, on a particular form, having been shown a
 * particular privacy notice. These constants close that gap, and they are the
 * same logic that already governs hashing the consent strings: the campaign
 * needs to be able to show what a visitor saw on a given date.
 */

/**
 * Bump on any material change to the sign-up form — fields added or removed, a
 * consent box shown or hidden, wording changed. Not for styling.
 *
 * History:
 *   2026.08.10-1  SMS consent box hidden; email-only consent. Navy/gold brand.
 */
export const FORM_VERSION = '2026.08.10-1'

/**
 * Bump when the substance of /privacy changes, and keep the prior version
 * reachable.
 *
 * History:
 *   2026.08.09-1  First published notice.
 *   2026.08.10-2  Removed the unbuilt 24-month retention promise and the
 *                 characterisation of Georgia statutory coverage; disclosed the
 *                 commercial geocoder; named the consent-record exception to
 *                 deletion; extended the employer firewall claim to cover
 *                 small-cell aggregates.
 */
export const PRIVACY_NOTICE_VERSION = '2026.08.10-2'
