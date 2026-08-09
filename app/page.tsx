import Image from 'next/image'

import SignupForm from '@/components/SignupForm'
import { HeartIcon, InfoIcon } from '@/components/icons'
import { VOLUNTARY_PARTICIPATION_NOTICE } from '@/lib/consent'
import classroomPhoto from '@/public/assets/classroom-photo.jpg'

/**
 * Aggregate framing only. Doc 03 §4 and CLAUDE.md guardrail 5 forbid any
 * individual-level social proof — no names, no centers, no leaderboards. Set
 * NEXT_PUBLIC_SHOW_AGGREGATE_STAT=false to hide even this line.
 */
const SHOW_AGGREGATE_STAT =
  String(process.env.NEXT_PUBLIC_SHOW_AGGREGATE_STAT ?? 'true').trim().toLowerCase() !==
  'false'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  // Per-center attribution parameter (Doc 02 §7). Used for aggregate
  // enrollment attribution only — never surfaced per individual.
  const { c } = await searchParams

  return (
    <div className="mx-auto max-w-[640px] px-5 pb-16 pt-7 sm:px-8 sm:pt-12">
      {/* Doc 02 §6 — landing: who is asking, why, what you're signing up for */}
      <section className="mb-s8">
        <h1 className="mb-s4 text-[30px] leading-[1.15] tracking-[-0.01em] sm:text-[40px]">
          Licensed child care providers deserve a level playing field.
        </h1>

        <div className="grid gap-s3 text-base leading-[1.65] text-ink/[.88]">
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
          <p className="font-semibold">
            Sign up and we&rsquo;ll match you to your state representative and senator.
            You&rsquo;ll get email updates when this policy is moving, and a ready-to-send
            message you can use in about a minute.
          </p>
        </div>

        {/* Required on the landing screen at readable body size — never
            footnote-small, never gray-on-gray (Doc 03 §4). */}
        <div className="mt-s4 flex items-start gap-3 rounded-md bg-sage-100 px-[18px] py-4">
          <InfoIcon size={20} className="mt-0.5 flex-none text-sage-800" />
          <p className="text-[15px] font-semibold leading-[1.55] text-sage-800">
            {VOLUNTARY_PARTICIPATION_NOTICE}
          </p>
        </div>

        <div className="relative mt-s6 overflow-hidden rounded-lg shadow-soft">
          <Image
            src={classroomPhoto}
            alt=""
            placeholder="blur"
            sizes="(max-width: 704px) 100vw, 640px"
            priority
            className="washed aspect-video w-full object-cover"
          />
          {/* Soft fade so the photo dissolves into the page rather than sitting
              on it as a stock-photo block. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sand/60" />
        </div>

        {SHOW_AGGREGATE_STAT ? (
          <div className="mt-s4 flex items-center gap-2.5">
            <HeartIcon size={18} className="flex-none text-accent-700" />
            {/* 70% ink, not 60%: at 13px the lighter value falls to 4.14:1,
                under the AA floor the brief requires for helper text. */}
            <p className="text-[13px] text-ink/[.7]">
              Providers in more than 40 Georgia House and Senate districts have joined so
              far.
            </p>
          </div>
        ) : null}
      </section>

      <SignupForm centerCode={c ?? null} />
    </div>
  )
}
