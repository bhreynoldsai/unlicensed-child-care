'use client'

import { useRef, useState } from 'react'

import { ConsentCheckbox, Fieldset, SelectField, TextField } from '@/components/Field'
import { HouseIcon } from '@/components/icons'
import SuccessCard, { type MatchedDistricts } from '@/components/SuccessCard'
import { EMAIL_CONSENT_TEXT, SMS_CONSENT_TEXT } from '@/lib/consent'
import { ROLES, ROLE_LABELS, collectIssues, signupSchema } from '@/lib/validation'

type Status = 'idle' | 'submitting' | 'error' | 'success'

type FormState = {
  firstName: string
  lastName: string
  email: string
  cellPhone: string
  otherPhone: string
  homeStreet: string
  homeStreet2: string
  homeCity: string
  homeState: string
  homeZip: string
  employerName: string
  employerStreet: string
  employerCity: string
  employerState: string
  employerZip: string
  role: string
  roleOther: string
  emailConsent: boolean
  smsConsent: boolean
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  cellPhone: '',
  otherPhone: '',
  homeStreet: '',
  homeStreet2: '',
  homeCity: '',
  homeState: 'GA',
  homeZip: '',
  employerName: '',
  employerStreet: '',
  employerCity: '',
  employerState: 'GA',
  employerZip: '',
  role: '',
  roleOther: '',
  emailConsent: false,
  smsConsent: false,
}

const ROLE_OPTIONS = ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }))

const SUBMIT_ERROR =
  'We could not reach the server. Please check your connection and try again.'

export default function SignupForm({ centerCode }: { centerCode: string | null }) {
  const [fields, setFields] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState(SUBMIT_ERROR)
  const [districts, setDistricts] = useState<MatchedDistricts | null>(null)
  const bannerRef = useRef<HTMLParagraphElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFields((current) => ({ ...current, [key]: value }))
    // Clear a field's error as soon as it is touched. Re-validation happens on
    // the next submit, so leaving stale red text under a corrected field would
    // just be nagging.
    setErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  /** Put focus on the first thing that needs fixing, top to bottom. */
  function focusFirstError(next: Record<string, string>) {
    const firstKey = Object.keys(next)[0]
    if (!firstKey) return
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)
    el?.focus()
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      ...fields,
      homeStreet2: fields.homeStreet2 || null,
      otherPhone: fields.otherPhone || undefined,
      roleOther: fields.roleOther || null,
      sourceCenterCode: centerCode,
    }

    // Validate against the same schema the API enforces.
    const parsed = signupSchema.safeParse(payload)
    if (!parsed.success) {
      const next = collectIssues(parsed.error)
      setErrors(next)
      setStatus('idle')
      focusFirstError(next)
      return
    }

    setErrors({})
    setStatus('submitting')

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 422) {
        const body = (await res.json()) as { errors?: Record<string, string> }
        const next = body.errors ?? {}
        setErrors(next)
        setStatus('idle')
        focusFirstError(next)
        return
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null
        setMessage(body?.message ?? SUBMIT_ERROR)
        setStatus('error')
        requestAnimationFrame(() => bannerRef.current?.focus())
        return
      }

      const body = (await res.json()) as { districts: MatchedDistricts }
      setDistricts(body.districts)
      setStatus('success')
    } catch {
      // Never log PII — and the caught value may carry the request body.
      setMessage(SUBMIT_ERROR)
      setStatus('error')
      requestAnimationFrame(() => bannerRef.current?.focus())
    }
  }

  if (status === 'success' && districts) {
    return <SuccessCard districts={districts} />
  }

  const submitting = status === 'submitting'

  return (
    <>
      {status === 'error' ? (
        <p
          ref={bannerRef}
          role="alert"
          tabIndex={-1}
          className="mb-s4 rounded-md border-[1.5px] border-danger/40 bg-danger/[.12] px-4 py-3.5 text-[15px] leading-[1.5] text-danger outline-none"
        >
          {message}
        </p>
      ) : null}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-s8">
        <Fieldset legend="Your contact information">
          <div className="grid grid-cols-1 gap-s4 sm:grid-cols-2">
            <TextField
              id="firstName"
              label="First name"
              required
              autoComplete="given-name"
              value={fields.firstName}
              onChange={(v) => set('firstName', v)}
              error={errors.firstName}
            />
            <TextField
              id="lastName"
              label="Last name"
              required
              autoComplete="family-name"
              value={fields.lastName}
              onChange={(v) => set('lastName', v)}
              error={errors.lastName}
            />
          </div>
          <div className="mt-s4 grid grid-cols-1 gap-s4 sm:grid-cols-2">
            <TextField
              id="email"
              label="Email"
              required
              type="email"
              autoComplete="email"
              inputMode="email"
              value={fields.email}
              onChange={(v) => set('email', v)}
              error={errors.email}
            />
            <TextField
              id="cellPhone"
              label="Cell phone"
              required
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={fields.cellPhone}
              onChange={(v) => set('cellPhone', v)}
              error={errors.cellPhone}
            />
          </div>
          <div className="mt-s4">
            <TextField
              id="otherPhone"
              label="Other phone (optional)"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={fields.otherPhone}
              onChange={(v) => set('otherPhone', v)}
              error={errors.otherPhone}
            />
          </div>
        </Fieldset>

        {/* Doc 03 §4 / brief hard constraint 4: the explanation is positioned so
            it is read before the address fields, not after. */}
        <Fieldset
          legend="Your home address"
          helper="We use this only to find which state legislators represent you. Legislators weigh messages from their own constituents most heavily."
        >
          <TextField
            id="homeStreet"
            label="Street address"
            required
            autoComplete="address-line1"
            value={fields.homeStreet}
            onChange={(v) => set('homeStreet', v)}
            error={errors.homeStreet}
          />
          <div className="mt-s4">
            <TextField
              id="homeStreet2"
              label="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
              value={fields.homeStreet2}
              onChange={(v) => set('homeStreet2', v)}
              error={errors.homeStreet2}
            />
          </div>
          <div className="mt-s4 grid grid-cols-[2fr_1fr_1fr] gap-s4">
            <TextField
              id="homeCity"
              label="City"
              required
              autoComplete="address-level2"
              value={fields.homeCity}
              onChange={(v) => set('homeCity', v)}
              error={errors.homeCity}
            />
            <TextField
              id="homeState"
              label="State"
              required
              autoComplete="address-level1"
              maxLength={2}
              value={fields.homeState}
              onChange={(v) => set('homeState', v.toUpperCase())}
              error={errors.homeState}
            />
            <TextField
              id="homeZip"
              label="ZIP"
              required
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              value={fields.homeZip}
              onChange={(v) => set('homeZip', v)}
              error={errors.homeZip}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Where you work">
          <TextField
            id="employerName"
            label="Center or organization name"
            required
            autoComplete="organization"
            value={fields.employerName}
            onChange={(v) => set('employerName', v)}
            error={errors.employerName}
          />
          <div className="mt-s4">
            <TextField
              id="employerStreet"
              label="Street address"
              required
              value={fields.employerStreet}
              onChange={(v) => set('employerStreet', v)}
              error={errors.employerStreet}
            />
          </div>
          <div className="mt-s4 grid grid-cols-[2fr_1fr_1fr] gap-s4">
            <TextField
              id="employerCity"
              label="City"
              required
              value={fields.employerCity}
              onChange={(v) => set('employerCity', v)}
              error={errors.employerCity}
            />
            <TextField
              id="employerState"
              label="State"
              required
              maxLength={2}
              value={fields.employerState}
              onChange={(v) => set('employerState', v.toUpperCase())}
              error={errors.employerState}
            />
            <TextField
              id="employerZip"
              label="ZIP"
              required
              inputMode="numeric"
              maxLength={10}
              value={fields.employerZip}
              onChange={(v) => set('employerZip', v)}
              error={errors.employerZip}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Your role" icon={<HouseIcon size={18} className="text-accent-700" />}>
          <SelectField
            id="role"
            label="Which best describes you?"
            required
            options={ROLE_OPTIONS}
            value={fields.role}
            onChange={(v) => set('role', v)}
            error={errors.role}
          />
          {fields.role === 'other' ? (
            <div className="mt-s4">
              <TextField
                id="roleOther"
                label="Tell us your role"
                required
                value={fields.roleOther}
                onChange={(v) => set('roleOther', v)}
                error={errors.roleOther}
              />
            </div>
          ) : null}
        </Fieldset>

        {/* Two separate, unticked checkboxes. Never combine, pre-check, style as
            a toggle, or gate sign-up on SMS (CLAUDE.md guardrail 1). The strings
            come from lib/consent.ts and are counsel-reviewed — do not reword. */}
        <Fieldset legend="How we can reach you">
          <ConsentCheckbox
            id="emailConsent"
            checked={fields.emailConsent}
            onChange={(v) => set('emailConsent', v)}
            error={errors.emailConsent}
          >
            {EMAIL_CONSENT_TEXT}
          </ConsentCheckbox>

          <div className="mt-s3">
            <ConsentCheckbox
              id="smsConsent"
              checked={fields.smsConsent}
              onChange={(v) => set('smsConsent', v)}
            >
              {SMS_CONSENT_TEXT}
            </ConsentCheckbox>
          </div>

          <p className="mt-s3 text-sm text-ink/[.75]">
            Text alerts are optional &mdash; you can sign up with email only.
          </p>
        </Fieldset>

        <div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : null}
            {submitting ? 'Signing you up…' : 'Sign up and find my legislators'}
          </button>
          {/* 70% ink, not 60% — see the note in app/page.tsx. */}
          <p className="mt-s3 text-center text-[13px] text-ink/[.7]">
            We never sell or share your information. You can unsubscribe at any time.
          </p>
        </div>
      </form>
    </>
  )
}
