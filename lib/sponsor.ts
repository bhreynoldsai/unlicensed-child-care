/**
 * Sponsor identity — the CAN-SPAM and "Paid for by" disclosure block.
 *
 * Confirmed 2026-08-09: the site presents as a coalition,
 * "Georgia Licensed Child Care Network", matching the wordmark. Doc 01's open
 * branding decision is settled.
 *
 * STILL OPEN, and it is a legal question rather than a copy one: a "Paid for
 * by" line and a CAN-SPAM sender identify *who actually paid*. If the Network
 * is not itself a registered entity with its own postal address — if it is a
 * project or DBA of another organization — the disclosure may need to name that
 * organization. Confirm with counsel before launch. Both answers are a config
 * change here, not a code change.
 *
 * The postal address is deliberately env-driven and deliberately not defaulted:
 * a wrong address in a disclosure is worse than an obviously missing one, and
 * `npm run preflight` fails when it is unset.
 */

export const SPONSOR_NAME =
  process.env.NEXT_PUBLIC_SPONSOR_NAME ?? 'Georgia Licensed Child Care Network'

/** The legal payer, if it differs from the public-facing coalition name. */
export const SPONSOR_PAID_FOR_BY = process.env.NEXT_PUBLIC_SPONSOR_PAID_FOR_BY ?? SPONSOR_NAME

export const SPONSOR_POSTAL_ADDRESS = process.env.NEXT_PUBLIC_SPONSOR_POSTAL_ADDRESS ?? null

export const SPONSOR_DISCLAIMER =
  `Paid for by ${SPONSOR_PAID_FOR_BY}. Not authorized by any candidate or candidate committee.` as const

/** True when the disclosure block is complete enough to publish. */
export function sponsorDisclosureComplete(): boolean {
  return Boolean(SPONSOR_POSTAL_ADDRESS)
}
