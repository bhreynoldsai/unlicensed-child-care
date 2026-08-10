/**
 * Small-cell suppression for anything an owner, manager, or the sponsor can see.
 *
 * Governing analysis: docs/05 §4.4. The short version — "aggregate" is only a
 * protection at a large denominator. At a six-person center, "Center 0447:
 * 5 sign-ups" identifies almost everyone who signed up, and "Center 0447: 0"
 * says something too. Most centers in this sector are small, so an unsuppressed
 * center-level count reverses the employer firewall for exactly the employers
 * it matters most against.
 *
 * The NLRA doctrine this serves is impression of surveillance: where an
 * employee reasonably believes their employer can see who took part in
 * protected activity, that is the violation, with no adverse action and no bad
 * motive required.
 */

/** Minimum cell size. Below this, report a band rather than a number. */
export const MIN_CELL_SIZE = 5

export type Audience =
  /** Campaign staff. Sees real numbers; access-controlled and export-audited. */
  | 'campaign'
  /** A center owner or director. Suppressed, and never told about their own zero. */
  | 'center'
  /** The sponsor. No center-level figure at any denominator (§4.4 item 3). */
  | 'sponsor'

/**
 * Zero is not a safe number to report. "Nobody at your center signed up" is
 * itself information about protected activity, so it is suppressed the same way
 * a small count is rather than shown as 0.
 */
export function suppressCount(count: number, audience: Audience): string {
  if (audience === 'campaign') return String(count)
  if (count === 0) return 'not reported'
  if (count < MIN_CELL_SIZE) return `fewer than ${MIN_CELL_SIZE}`
  return String(count)
}

/**
 * Whether a center-level row may be shown to this audience at all.
 * The sponsor never sees one — its interest in the policy is commercial, and
 * its interest in which centers performed is not one the firewall should serve.
 */
export function maySeeCenterDetail(audience: Audience): boolean {
  return audience === 'campaign'
}
