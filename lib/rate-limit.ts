import { createHash } from 'node:crypto'

import { pool } from '@/lib/db'

/**
 * Fixed-window rate limiting backed by Postgres (db/002_rate_limits.sql).
 *
 * Postgres rather than process memory because on a serverless host consecutive
 * requests land on different instances, where an in-memory counter limits
 * nothing.
 *
 * Never stores a raw IP — see the privacy note in the migration.
 */

export interface RateLimitOptions {
  scope: 'signup' | 'admin_login'
  identifier: string
  max: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

function hashIdentifier(scope: string, identifier: string): string {
  return createHash('sha256').update(`${scope}:${identifier}`, 'utf8').digest('hex')
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { scope, identifier, max, windowSeconds } = options
  const identifierHash = hashIdentifier(scope, identifier)

  // Truncate now() to the current window so every request in the same window
  // increments one row, and the upsert stays a single atomic statement.
  const sql = `
    INSERT INTO rate_limits (scope, identifier_hash, window_start, hits)
    VALUES ($1, $2, to_timestamp(floor(extract(epoch FROM now()) / $3) * $3), 1)
    ON CONFLICT (scope, identifier_hash, window_start)
      DO UPDATE SET hits = rate_limits.hits + 1
    RETURNING hits, window_start
  `

  try {
    const { rows } = await pool.query<{ hits: number; window_start: Date }>(sql, [
      scope,
      identifierHash,
      windowSeconds,
    ])

    const hits = rows[0]?.hits ?? 1
    const windowStart = rows[0]?.window_start ?? new Date()
    const resetAt = windowStart.getTime() + windowSeconds * 1000
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

    return {
      allowed: hits <= max,
      remaining: Math.max(0, max - hits),
      retryAfterSeconds,
    }
  } catch (err) {
    // A limiter outage must not take the sign-up form down with it. Fail open
    // and say so loudly — losing a real supporter costs more than letting a
    // burst through, and Turnstile is still in front of this.
    console.error('rate_limit_unavailable', err instanceof Error ? err.message : 'unknown')
    return { allowed: true, remaining: max, retryAfterSeconds: 0 }
  }
}
