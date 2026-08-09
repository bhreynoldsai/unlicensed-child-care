import { describe, expect, it } from 'vitest'

import { collectIssues, signupSchema, toE164 } from '@/lib/validation'

/**
 * The consent rules here are compliance requirements (Doc 03 §2), not product
 * preferences. A regression that let a sign-up through without email consent,
 * or that made SMS consent load-bearing, would be a legal problem rather than
 * a bug — so they get tests.
 */

const valid = {
  firstName: 'Dana',
  lastName: 'Reed',
  email: 'Dana@Example.org',
  cellPhone: '(770) 555-0134',
  homeStreet: '206 Washington St SW',
  homeCity: 'Atlanta',
  homeState: 'GA',
  homeZip: '30334',
  employerName: 'Sunrise Learning',
  employerStreet: '1 Peachtree St NE',
  employerCity: 'Atlanta',
  employerState: 'GA',
  employerZip: '30303',
  role: 'teacher' as const,
  emailConsent: true as const,
  smsConsent: false,
}

describe('signup consent rules', () => {
  it('accepts a sign-up with email consent alone', () => {
    const result = signupSchema.safeParse({ ...valid, smsConsent: false })
    expect(result.success).toBe(true)
  })

  it('rejects a sign-up without email consent', () => {
    const result = signupSchema.safeParse({ ...valid, emailConsent: false })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(collectIssues(result.error).emailConsent).toMatch(/required/i)
    }
  })

  it('never lets SMS consent substitute for email consent', () => {
    const result = signupSchema.safeParse({ ...valid, emailConsent: false, smsConsent: true })
    expect(result.success).toBe(false)
  })

  it('defaults SMS consent to false when the field is absent', () => {
    const { smsConsent: _omitted, ...withoutSms } = valid
    const result = signupSchema.safeParse(withoutSms)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.smsConsent).toBe(false)
  })
})

describe('signup field handling', () => {
  it('lowercases email so one person cannot become two supporters', () => {
    const result = signupSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('dana@example.org')
  })

  it('normalizes phone numbers to E.164', () => {
    const result = signupSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cellPhone).toBe('+17705550134')
  })

  it('requires a descriptor when the role is "other"', () => {
    const result = signupSchema.safeParse({ ...valid, role: 'other', roleOther: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(collectIssues(result.error).roleOther).toBeTruthy()
  })

  it('accepts "other" once a descriptor is given', () => {
    const result = signupSchema.safeParse({ ...valid, role: 'other', roleOther: 'Bus driver' })
    expect(result.success).toBe(true)
  })

  it('rejects a role outside the sponsor-fixed list', () => {
    const result = signupSchema.safeParse({ ...valid, role: 'volunteer' })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed ZIP but accepts ZIP+4', () => {
    expect(signupSchema.safeParse({ ...valid, homeZip: '303' }).success).toBe(false)
    expect(signupSchema.safeParse({ ...valid, homeZip: '30334-1234' }).success).toBe(true)
  })

  it('strips unknown keys rather than rejecting them', () => {
    // The client posts turnstileToken alongside the form fields.
    const result = signupSchema.safeParse({ ...valid, turnstileToken: 'abc' })
    expect(result.success).toBe(true)
    if (result.success) expect('turnstileToken' in result.data).toBe(false)
  })
})

describe('toE164', () => {
  it.each([
    ['7705550134', '+17705550134'],
    ['(770) 555-0134', '+17705550134'],
    ['1-770-555-0134', '+17705550134'],
    ['770.555.0134', '+17705550134'],
  ])('normalizes %s', (input, expected) => {
    expect(toE164(input)).toBe(expected)
  })

  it.each(['555', '', '01234567890123'])('rejects %s', (input) => {
    expect(toE164(input)).toBeNull()
  })
})
