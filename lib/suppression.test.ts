import { describe, expect, it } from 'vitest'

import { MIN_CELL_SIZE, maySeeCenterDetail, suppressCount } from '@/lib/suppression'

/**
 * These are NLRA controls, not formatting. If a center owner can infer from
 * campaign reporting who took part in protected activity, the employer firewall
 * does not exist for that center (docs/05 §4.4).
 */
describe('small-cell suppression', () => {
  it('shows real numbers to campaign staff', () => {
    expect(suppressCount(0, 'campaign')).toBe('0')
    expect(suppressCount(3, 'campaign')).toBe('3')
    expect(suppressCount(41, 'campaign')).toBe('41')
  })

  it.each([1, 2, 3, 4])('bands a count of %i for a center', (n) => {
    expect(suppressCount(n, 'center')).toBe(`fewer than ${MIN_CELL_SIZE}`)
  })

  it('reports counts at or above the threshold', () => {
    expect(suppressCount(5, 'center')).toBe('5')
    expect(suppressCount(12, 'center')).toBe('12')
  })

  it('never reports a zero outside the campaign', () => {
    // "Nobody at your center signed up" is itself information about protected
    // activity, so it is withheld rather than shown as 0.
    expect(suppressCount(0, 'center')).toBe('not reported')
    expect(suppressCount(0, 'sponsor')).toBe('not reported')
  })

  it('suppresses for the sponsor exactly as for a center', () => {
    expect(suppressCount(2, 'sponsor')).toBe(`fewer than ${MIN_CELL_SIZE}`)
  })

  it('allows center-level detail only to campaign staff', () => {
    expect(maySeeCenterDetail('campaign')).toBe(true)
    expect(maySeeCenterDetail('center')).toBe(false)
    // The sponsor gets no center-level figure at any denominator (§4.4 item 3).
    expect(maySeeCenterDetail('sponsor')).toBe(false)
  })
})
