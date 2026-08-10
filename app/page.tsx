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
    <>
      {/* Hero shares the header's navy so the two read as one dark block. */}
      <section className="bg-navy-900 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-frame">
          <div className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.1em] text-gold-300">
            Georgia Licensed Child Care Network
          </div>

          {/* Doc 02 §6 — who is asking, why, and what you're signing up for */}
          <h1 className="mb-4 font-heading text-[28px] font-bold leading-[1.19] text-white sm:text-[32px]">
            Licensed child care providers deserve a level playing field.
          </h1>

          <div className="grid gap-3 text-base leading-[1.56] text-navy-200">
            <p>
              Licensed programs in Georgia meet staffing ratios, training requirements,
              facility standards, and regular inspections. A defined set of license-exempt
              programs serves similar families without those same requirements.
            </p>
            <p>
              We&rsquo;re organizing Georgia&rsquo;s licensed child care community &mdash;
              owners, regional managers, corporate staff, directors, and teachers &mdash; so
              that when this policy is in front of the legislature, lawmakers hear directly
              from the people who run and staff licensed programs in their own districts.
            </p>
            <p className="font-semibold text-white">
              Sign up and we&rsquo;ll match you to your state representative and senator.
              You&rsquo;ll get email updates when this policy is moving, and a ready-to-send
              message you can use in about a minute.
            </p>
          </div>

          {/* Required on the landing screen at readable body size — never
              footnote-small, never dimmed (Doc 03 §4). */}
          <div className="notice-on-dark mt-6">{VOLUNTARY_PARTICIPATION_NOTICE}</div>
        </div>
      </section>

      <div className="mx-auto max-w-frame px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
        <SignupForm centerCode={c ?? null} />
      </div>
    </>
  )
}
