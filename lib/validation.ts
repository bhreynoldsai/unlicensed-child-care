import { z } from 'zod'

export const ROLES = [
  'owner',
  'regional_manager',
  'corporate_staff_director',
  'teacher',
  'other',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  regional_manager: 'Regional manager',
  corporate_staff_director: 'Corporate staff director',
  teacher: 'Teacher',
  other: 'Other',
}

/** Normalize a US phone to E.164. Returns null if it isn't a plausible US number. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

const phone = z
  .string()
  .trim()
  .refine((v) => toE164(v) !== null, 'Enter a 10-digit US phone number')
  .transform((v) => toE164(v) as string)

const zip = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, 'Enter a 5-digit ZIP code')

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Required').max(100),
    lastName: z.string().trim().min(1, 'Required').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    cellPhone: phone,
    otherPhone: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? toE164(v) : null)),

    homeStreet: z.string().trim().min(1, 'Required').max(200),
    homeStreet2: z.string().trim().max(200).optional().nullable(),
    homeCity: z.string().trim().min(1, 'Required').max(100),
    homeState: z.string().trim().length(2).default('GA'),
    homeZip: zip,

    employerName: z.string().trim().min(1, 'Required').max(200),
    employerStreet: z.string().trim().min(1, 'Required').max(200),
    employerCity: z.string().trim().min(1, 'Required').max(100),
    employerState: z.string().trim().length(2).default('GA'),
    employerZip: zip,

    role: z.enum(ROLES),
    roleOther: z.string().trim().max(120).optional().nullable(),

    sourceCenterCode: z.string().trim().max(64).optional().nullable(),

    // Doc 03 §2: sign-up must succeed with email consent alone.
    // SMS is additive and separately captured — never bundle them.
    emailConsent: z.literal(true, {
      errorMap: () => ({ message: 'Email consent is required to sign up' }),
    }),
    smsConsent: z.boolean().default(false),
  })
  .refine((d) => d.role !== 'other' || !!d.roleOther, {
    message: 'Tell us your role',
    path: ['roleOther'],
  })

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Flatten a ZodError into one message per field, keyed by field name. The
 * sign-up form validates client-side against the same schema the API enforces,
 * so the two can never disagree about what is valid. This mirrors the shape
 * `app/api/signup/route.ts` returns on a 422.
 */
export function collectIssues(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!errors[key]) errors[key] = issue.message
  }
  return errors
}
