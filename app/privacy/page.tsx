import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy notice' }

/**
 * Placeholder. The footer must link to a privacy notice (CAN-SPAM, and the form
 * collects home addresses), but the actual text is counsel's to write against
 * docs/03-data-privacy-and-compliance-plan.md — an invented policy would be
 * worse than an honest placeholder.
 */
export default function Privacy() {
  return (
    <div className="mx-auto max-w-[640px] px-5 pb-16 pt-7 sm:px-8 sm:pt-12">
      <h1 className="mb-s4 text-[28px] leading-[1.15] sm:text-[36px]">Privacy notice</h1>
      <div className="grid gap-s3 text-base leading-[1.65]">
        <p>
          This notice is being finalized. In summary: we collect your contact information,
          home address, and employer information so we can match you to your Georgia state
          House and Senate districts and send you the updates you asked for.
        </p>
        <p>
          Your home address is used for legislative district matching and constituent
          verification. We never report individual sign-ups to your employer, a center
          owner, or a manager &mdash; only aggregate counts by district.
        </p>
        <p>
          We do not sell or share your information. You can unsubscribe from email at any
          time, and reply STOP to any text message to stop texts.
        </p>
        <p className="font-semibold">
          [Full privacy notice text &mdash; TBD, pending counsel review against Doc 03.]
        </p>
      </div>
    </div>
  )
}
