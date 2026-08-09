import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Unsubscribe' }

/**
 * Placeholder. Once an email service provider is chosen, this route should
 * either become that provider's hosted unsubscribe flow or post to an endpoint
 * that sets `supporters.status = 'unsubscribed'`. The link is a CAN-SPAM
 * requirement and has to actually work before launch.
 */
export default function Unsubscribe() {
  return (
    <div className="mx-auto max-w-[640px] px-5 pb-16 pt-7 sm:px-8 sm:pt-12">
      <h1 className="mb-s4 text-[28px] leading-[1.15] sm:text-[36px]">Unsubscribe</h1>
      <div className="grid gap-s3 text-base leading-[1.65]">
        <p>
          To stop receiving email, use the unsubscribe link at the bottom of any message we
          send you. To stop text messages, reply STOP to any text.
        </p>
        <p>
          You can also write to us at the postal address in the footer and we will remove
          you.
        </p>
        <p className="font-semibold">
          [Self-service unsubscribe form &mdash; TBD. Wire to the email service provider
          once selected, and set supporters.status = &lsquo;unsubscribed&rsquo;.]
        </p>
      </div>
    </div>
  )
}
