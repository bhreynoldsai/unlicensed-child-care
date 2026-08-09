import { describe, expect, it } from 'vitest'

import { relaxedMatchIsTrustworthy, type AddressInput } from '@/lib/districts'

/**
 * These guard the one failure mode that is invisible in production: a relaxed
 * geocode that returns a *different* address and gets believed. A supporter
 * filed under the wrong legislator looks exactly like one filed correctly.
 */

const submitted = (over: Partial<AddressInput> = {}): AddressInput => ({
  street: '1500 N Patterson St',
  city: 'Valdosta',
  state: 'GA',
  zip: '31698',
  ...over,
})

describe('relaxedMatchIsTrustworthy', () => {
  it('rejects the real-world case that motivated it', () => {
    // Observed: dropping the ZIP turned N Patterson/31698 into S Patterson/31601,
    // which sits in different House, Senate, and congressional districts.
    expect(
      relaxedMatchIsTrustworthy(submitted(), '1500 S PATTERSON ST, VALDOSTA, GA, 31601'),
    ).toBe(false)
  })

  it('accepts a match that only differs by normalization', () => {
    expect(
      relaxedMatchIsTrustworthy(submitted(), '1500 N PATTERSON ST, VALDOSTA, GA, 31698'),
    ).toBe(true)
  })

  it('rejects a different ZIP even when the street is identical', () => {
    expect(
      relaxedMatchIsTrustworthy(submitted(), '1500 N PATTERSON ST, VALDOSTA, GA, 31601'),
    ).toBe(false)
  })

  it('rejects a different house number', () => {
    expect(
      relaxedMatchIsTrustworthy(submitted(), '1502 N PATTERSON ST, VALDOSTA, GA, 31698'),
    ).toBe(false)
  })

  it('rejects a flipped directional', () => {
    expect(
      relaxedMatchIsTrustworthy(
        submitted({ street: '206 Washington St SW', city: 'Atlanta', zip: '30334' }),
        '206 WASHINGTON ST NW, ATLANTA, GA, 30334',
      ),
    ).toBe(false)
  })

  it('treats a spelled-out directional as equal to its abbreviation', () => {
    expect(
      relaxedMatchIsTrustworthy(
        submitted({ street: '1500 North Patterson St' }),
        '1500 N PATTERSON ST, VALDOSTA, GA, 31698',
      ),
    ).toBe(true)
  })

  it('allows a directional the submitter omitted', () => {
    // Normalization commonly adds one. Only a contradiction is disqualifying.
    expect(
      relaxedMatchIsTrustworthy(
        submitted({ street: '206 Washington St', city: 'Atlanta', zip: '30334' }),
        '206 WASHINGTON ST SW, ATLANTA, GA, 30334',
      ),
    ).toBe(true)
  })

  it('accepts a ZIP+4 response against a 5-digit submission', () => {
    expect(
      relaxedMatchIsTrustworthy(submitted(), '1500 N PATTERSON ST, VALDOSTA, GA, 31698-1234'),
    ).toBe(true)
  })

  it('rejects a response with no parseable ZIP', () => {
    expect(relaxedMatchIsTrustworthy(submitted(), 'PATTERSON ST, VALDOSTA, GA')).toBe(false)
  })

  it('ignores a unit that the submitter supplied and the geocoder dropped', () => {
    expect(
      relaxedMatchIsTrustworthy(
        submitted({ street: '860 Peachtree St NE Apt 1502', city: 'Atlanta', zip: '30308' }),
        '860 PEACHTREE ST NE, ATLANTA, GA, 30308',
      ),
    ).toBe(true)
  })
})
