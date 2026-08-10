import type { ReactNode } from 'react'

import { AlertIcon } from '@/components/icons'

/**
 * Form primitives for the sign-up page.
 *
 * Every control renders at 16px so iOS Safari does not zoom on focus, and at a
 * 48px minimum height for touch (see .field-input in app/globals.css).
 */

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}{' '}
        {required ? (
          <span className="text-danger" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          <AlertIcon size={15} className="mt-px flex-none" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  type?: 'text' | 'email' | 'tel'
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  maxLength?: number
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <input
        className="field-input"
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldShell>
  )
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  required?: boolean
  error?: string
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <select
        className="field-input"
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">Select one…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

/**
 * The whole row is the label, so the tap target is the full block rather than a
 * 22px box. The text renders at full contrast and full length — the SMS variant
 * carries counsel-reviewed language that may never be truncated, collapsed, or
 * de-emphasized (CLAUDE.md guardrails 1 and 2).
 */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  children: ReactNode
}) {
  return (
    <>
      <label className="consent-row" htmlFor={id} data-invalid={Boolean(error)}>
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          <AlertIcon size={15} className="mt-px flex-none" />
          <span>{error}</span>
        </p>
      ) : null}
    </>
  )
}

export function Fieldset({
  legend,
  icon,
  helper,
  children,
}: {
  legend: string
  icon?: ReactNode
  helper?: string
  children: ReactNode
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="section-heading">
        {icon}
        {legend}
      </legend>
      {helper ? <p className="notice mb-4">{helper}</p> : null}
      {children}
    </fieldset>
  )
}
