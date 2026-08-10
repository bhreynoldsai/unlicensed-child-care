import { beforeEach, describe, expect, it } from 'vitest'

import { createUnsubscribeToken, readUnsubscribeToken, unsubscribeUrl } from '@/lib/unsubscribe'

/**
 * An unsubscribe token is the only thing standing between a stranger and the
 * ability to silence someone else's mail, so forging one must be infeasible
 * and a tampered one must never resolve.
 */

const ID = '3f2b8c1a-9d4e-4f7a-8b2c-1e5d6a7b8c9d'

describe('unsubscribe tokens', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-not-used-anywhere-real'
  })

  it('round-trips a supporter id', () => {
    const token = createUnsubscribeToken(ID)
    expect(token).toBeTruthy()
    expect(readUnsubscribeToken(token!)).toBe(ID)
  })

  it('rejects a token whose signature was altered', () => {
    const token = createUnsubscribeToken(ID)!
    const tampered = token.slice(0, -1) + (token.at(-1) === 'A' ? 'B' : 'A')
    expect(readUnsubscribeToken(tampered)).toBeNull()
  })

  it('rejects a different id pasted onto a valid signature', () => {
    const token = createUnsubscribeToken(ID)!
    const signature = token.slice(token.lastIndexOf('.'))
    const other = '00000000-0000-4000-8000-000000000000'
    expect(readUnsubscribeToken(other + signature)).toBeNull()
  })

  it('rejects an unsigned bare id', () => {
    expect(readUnsubscribeToken(ID)).toBeNull()
  })

  it.each([undefined, '', '.', 'nodot', `${ID}.`])('rejects malformed input %j', (input) => {
    expect(readUnsubscribeToken(input as string | undefined)).toBeNull()
  })

  it('stops working when the signing key changes', () => {
    const token = createUnsubscribeToken(ID)!
    process.env.AUTH_SECRET = 'a-different-secret'
    expect(readUnsubscribeToken(token)).toBeNull()
  })

  it('cannot mint or read a token with no signing key', () => {
    const token = createUnsubscribeToken(ID)!
    delete process.env.AUTH_SECRET
    expect(createUnsubscribeToken(ID)).toBeNull()
    expect(readUnsubscribeToken(token)).toBeNull()
  })

  it('builds a link without a double slash when the site URL has a trailing one', () => {
    const url = unsubscribeUrl('https://galicensedcare.org/', ID)
    expect(url).toMatch(/^https:\/\/galicensedcare\.org\/unsubscribe\?u=/)
  })

  it('percent-encodes the token so a mail client cannot truncate it', () => {
    const url = unsubscribeUrl('https://galicensedcare.org', ID)!
    const token = new URL(url).searchParams.get('u')
    expect(readUnsubscribeToken(token!)).toBe(ID)
  })
})
