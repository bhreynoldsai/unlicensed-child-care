import SignupForm from '@/components/SignupForm'
import { VOLUNTARY_PARTICIPATION_NOTICE } from '@/lib/consent'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  // Per-center attribution parameter (Doc 02 §7). Used for aggregate
  // enrollment attribution only — never surfaced per individual.
  const { c } = await searchParams

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Doc 02 §6 — landing: who is asking, why, what you're signing up for */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Licensed child care providers deserve a level playing field.
        </h1>
        <div className="mt-4 space-y-3 text-navy-900/90 leading-relaxed">
          <p>
            Licensed programs in Georgia meet staffing ratios, training requirements,
            facility standards, and regular inspections. A defined set of
            license-exempt programs serves similar families without those same
            requirements.
          </p>
          <p>
            We are organizing Georgia&apos;s licensed child care community — owners,
            regional managers, corporate staff, directors, and teachers — so that when
            this policy is in front of the legislature, lawmakers hear directly from
            the people who run and staff licensed programs in their own districts.
          </p>
          <p className="font-medium">
            Sign up and we&apos;ll match you to your state representative and senator.
            You&apos;ll get email updates when this policy is moving, and a
            ready-to-send message you can use in about a minute.
          </p>
        </div>

        <p className="mt-4 rounded-md border border-gold-300 bg-gold-300/10 px-4 py-3 text-sm font-medium text-navy-900">
          {VOLUNTARY_PARTICIPATION_NOTICE}
        </p>
      </section>

      <SignupForm centerCode={c ?? null} />
    </div>
  )
}
