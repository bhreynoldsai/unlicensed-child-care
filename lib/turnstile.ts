/**
 * Cloudflare Turnstile verification.
 *
 * Chosen over hCaptcha/reCAPTCHA because it is free, privacy-preserving, and
 * usually invisible — this form is filled on a phone during a break, and an
 * image puzzle between a QR scan and a submit is a real conversion cost.
 *
 * Enabled by the presence of TURNSTILE_SECRET_KEY. With no key configured
 * verification is skipped so local development works without a Cloudflare
 * account; `turnstileConfigured()` exists so launch checks can assert it is on
 * in production.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Turnstile returned ${res.status}`)
    const result = (await res.json()) as { success?: boolean }
    return result.success === true
  } catch (err) {
    // Fail closed. If the challenge cannot be verified we cannot tell a person
    // from a bot, and this endpoint writes to the supporter database.
    console.error('turnstile_unavailable', err instanceof Error ? err.message : 'unknown')
    return false
  }
}
