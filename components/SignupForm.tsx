'use client'

import { useState } from 'react'
import { ROLES, ROLE_LABELS, type Role } from '@/lib/validation'
import { EMAIL_CONSENT_TEXT, SMS_CONSENT_TEXT } from '@/lib/consent'

type Errors = Record<string, string>

interface MatchedLegislators {
  stateHouse: string | null
  stateSenate: string | null
  congressional: string | null
}

export default function SignupForm({ centerCode }: { centerCode: string | null }) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [role, setRole] = useState<Role | ''>('')
  const [done, setDone] = useState<MatchedLegislators | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    const fd = new FormData(e.currentTarget)
    const payload = {
      firstName: fd.get('firstName'),
      lastName: fd.get('lastName'),
      email: fd.get('email'),
      cellPhone: fd.get('cellPhone'),
      otherPhone: fd.get('otherPhone') || undefined,
      homeStreet: fd.get('homeStreet'),
      homeStreet2: fd.get('homeStreet2') || null,
      homeCity: fd.get('homeCity'),
      homeState: fd.get('homeState') || 'GA',
      homeZip: fd.get('homeZip'),
      employerName: fd.get('employerName'),
      employerStreet: fd.get('employerStreet'),
      employerCity: fd.get('employerCity'),
      employerState: fd.get('employerState') || 'GA',
      employerZip: fd.get('employerZip'),
      role: fd.get('role'),
      roleOther: fd.get('roleOther') || null,
      sourceCenterCode: centerCode,
      emailConsent: fd.get('emailConsent') === 'on',
      smsConsent: fd.get('smsConsent') === 'on',
    }

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()

      if (!res.ok) {
        setErrors(body.errors ?? { _form: body.message ?? 'Something went wrong. Please try again.' })
        setSubmitting(false)
        // Move focus to the first problem so screen readers announce it.
        document.querySelector<HTMLElement>('[data-error="true"]')?.focus()
        return
      }

      setDone(body.districts as MatchedLegislators)
    } catch {
      setErrors({ _form: 'We could not reach the server. Please check your connection and try again.' })
      setSubmitting(false)
    }
  }

  if (done) return <Confirmation districts={done} />

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {errors._form && (
        <p role="alert" className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          {errors._form}
        </p>
      )}

      <fieldset>
        <legend className="section-heading w-full">Your contact information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="firstName" label="First name" autoComplete="given-name" error={errors.firstName} required />
          <Field name="lastName" label="Last name" autoComplete="family-name" error={errors.lastName} required />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="email" label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email} required />
          <Field name="cellPhone" label="Cell phone" type="tel" autoComplete="mobile tel" inputMode="tel" error={errors.cellPhone} required />
        </div>
        <div className="mt-4">
          <Field
            name="otherPhone"
            label="Other phone (optional)"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            error={errors.otherPhone}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="section-heading w-full">Your home address</legend>
        <p className="-mt-2 mb-4 text-sm text-navy-700">
          We use this only to find which state legislators represent you. Legislators
          weigh messages from their own constituents most heavily.
        </p>
        <Field name="homeStreet" label="Street address" autoComplete="address-line1" error={errors.homeStreet} required />
        <div className="mt-4">
          <Field name="homeStreet2" label="Apartment, suite, etc. (optional)" autoComplete="address-line2" error={errors.homeStreet2} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field name="homeCity" label="City" autoComplete="address-level2" error={errors.homeCity} required />
          <Field name="homeState" label="State" autoComplete="address-level1" defaultValue="GA" maxLength={2} error={errors.homeState} required />
          <Field name="homeZip" label="ZIP" autoComplete="postal-code" inputMode="numeric" error={errors.homeZip} required />
        </div>
      </fieldset>

      <fieldset>
        <legend className="section-heading w-full">Where you work</legend>
        <Field name="employerName" label="Center or organization name" autoComplete="organization" error={errors.employerName} required />
        <div className="mt-4">
          <Field name="employerStreet" label="Street address" error={errors.employerStreet} required />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field name="employerCity" label="City" error={errors.employerCity} required />
          <Field name="employerState" label="State" defaultValue="GA" maxLength={2} error={errors.employerState} required />
          <Field name="employerZip" label="ZIP" inputMode="numeric" error={errors.employerZip} required />
        </div>
      </fieldset>

      <fieldset>
        <legend className="section-heading w-full">Your role</legend>
        <label htmlFor="role" className="field-label">
          Which best describes you? <span className="text-red-700">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          className="field-input"
          value={role}
          data-error={errors.role ? 'true' : undefined}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="">Select one…</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        {errors.role && <p className="field-error">{errors.role}</p>}

        {role === 'other' && (
          <div className="mt-4">
            <Field name="roleOther" label="Tell us your role" error={errors.roleOther} required />
          </div>
        )}
      </fieldset>

      {/* --------------------------------------------------------------
          CONSENT — Doc 03 §2.
          Two separate, unticked checkboxes. Email is required; SMS is
          additive and must never be pre-checked, bundled, or made a
          condition of signing up. Do not change this markup or the
          language without counsel review.
         -------------------------------------------------------------- */}
      <fieldset>
        <legend className="section-heading w-full">How we can reach you</legend>

        <label className="flex gap-3 rounded-md border border-navy-300 bg-white p-4 cursor-pointer">
          <input
            type="checkbox"
            name="emailConsent"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-300 text-navy-700 focus:ring-gold-500"
            data-error={errors.emailConsent ? 'true' : undefined}
          />
          <span className="text-sm leading-relaxed text-navy-900">{EMAIL_CONSENT_TEXT}</span>
        </label>
        {errors.emailConsent && <p className="field-error">{errors.emailConsent}</p>}

        <label className="mt-4 flex gap-3 rounded-md border border-navy-300 bg-white p-4 cursor-pointer">
          <input
            type="checkbox"
            name="smsConsent"
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-navy-300 text-navy-700 focus:ring-gold-500"
          />
          <span className="text-sm leading-relaxed text-navy-900">{SMS_CONSENT_TEXT}</span>
        </label>

        <p className="mt-3 text-sm text-navy-700">
          Text alerts are optional — you can sign up with email only.
        </p>
      </fieldset>

      <div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Signing you up…' : 'Sign up and find my legislators'}
        </button>
        <p className="mt-3 text-center text-xs text-navy-700">
          We never sell or share your information. You can unsubscribe at any time.
        </p>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  error,
  required,
  ...rest
}: {
  name: string
  label: string
  error?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        data-error={error ? 'true' : undefined}
        className="field-input"
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Doc 02 §6 — showing matched legislators immediately is "the single best
 * moment to make the program feel real."
 */
function Confirmation({ districts }: { districts: MatchedLegislators }) {
  const matched = districts.stateHouse || districts.stateSenate

  return (
    <div className="rounded-lg border border-navy-300 bg-white p-6">
      <h2 className="text-xl font-bold text-navy-900">You&apos;re signed up. Thank you.</h2>

      {matched ? (
        <>
          <p className="mt-3 text-navy-900">Based on your home address, you are represented by:</p>
          <dl className="mt-4 space-y-3">
            {districts.stateHouse && (
              <div className="rounded-md bg-navy-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-700">
                  Georgia House
                </dt>
                <dd className="text-lg font-semibold text-navy-900">
                  District {districts.stateHouse}
                </dd>
              </div>
            )}
            {districts.stateSenate && (
              <div className="rounded-md bg-navy-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-700">
                  Georgia Senate
                </dt>
                <dd className="text-lg font-semibold text-navy-900">
                  District {districts.stateSenate}
                </dd>
              </div>
            )}
            {districts.congressional && (
              <div className="rounded-md bg-navy-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-navy-700">
                  U.S. Congress
                </dt>
                <dd className="text-lg font-semibold text-navy-900">
                  District {districts.congressional}
                </dd>
              </div>
            )}
          </dl>
          {/* TODO: join district numbers to legislator names/photos from the
              GA legislator roster once it is loaded (Doc 04). */}
        </>
      ) : (
        <p className="mt-3 text-navy-900">
          We&apos;re still matching your address to your legislative districts — we&apos;ll
          include them in your first email.
        </p>
      )}

      <div className="mt-6 border-t border-navy-100 pt-6">
        <h3 className="font-semibold text-navy-900">Help us reach your coworkers</h3>
        <p className="mt-1 text-sm text-navy-700">
          The more licensed providers in each district, the more weight this carries.
          Share this link with anyone in licensed child care.
        </p>
        {/* TODO: render the shareable link + QR code (Doc 02 §6). */}
      </div>
    </div>
  )
}
