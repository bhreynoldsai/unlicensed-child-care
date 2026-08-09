'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { TextField } from '@/components/Field'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null
        setError(body?.message ?? 'Those credentials were not accepted.')
        setSubmitting(false)
        return
      }

      // Only ever follow a same-site path, so a crafted ?next= cannot bounce an
      // administrator to an external page after a successful login.
      router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/admin')
      router.refresh()
    } catch {
      setError('We could not reach the server. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-s4">
      {error ? (
        <p
          role="alert"
          className="rounded-md border-[1.5px] border-danger/40 bg-danger/[.12] px-4 py-3.5 text-[15px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <TextField
        id="email"
        label="Your email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={setEmail}
        required
      />

      <div>
        <label className="field-label" htmlFor="password">
          Password{' '}
          <span className="text-danger" aria-hidden>
            *
          </span>
        </label>
        <input
          className="field-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? <span className="spinner" /> : null}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function AdminLogin() {
  return (
    <div className="mx-auto max-w-[420px] px-5 pb-16 pt-12">
      <h1 className="mb-2 text-[28px] leading-[1.15]">Campaign administration</h1>
      <p className="mb-s6 text-sm leading-[1.55] text-ink/[.78]">
        This area shows aggregate district density. It is limited to campaign
        administrators.
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
