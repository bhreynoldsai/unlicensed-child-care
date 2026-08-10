import type { Metadata } from 'next'

import { UnsubscribeConfirm } from '@/components/UnsubscribeConfirm'
import { CONTACT_EMAIL } from '@/lib/site'
import { SPONSOR_NAME, SPONSOR_POSTAL_ADDRESS } from '@/lib/sponsor'
import { readUnsubscribeToken } from '@/lib/unsubscribe'

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } }

/**
 * Unsubscribe landing page (CAN-SPAM).
 *
 * With a valid token from an email link, this confirms in one click. Without
 * one — someone who navigated here from the footer — it explains the routes
 * that do work, rather than offering an email box. An open "type any address"
 * form would let a stranger unsubscribe someone else and would double as a way
 * to test whether an address is on the list.
 */
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>
}) {
  const { u } = await searchParams
  const valid = Boolean(readUnsubscribeToken(u))

  return (
    <div className="mx-auto max-w-[640px] px-5 pb-16 pt-7 sm:px-8 sm:pt-12">
      <h1 className="mb-s4 text-[clamp(28px,6vw,36px)] leading-[1.15]">Unsubscribe</h1>

      {valid ? (
        <UnsubscribeConfirm token={u as string} />
      ) : (
        <div className="grid gap-s3 text-base leading-[1.65]">
          {u ? (
            <p className="rounded-md border-[1.5px] border-danger/40 bg-danger/[.12] px-4 py-3.5 text-danger">
              That unsubscribe link is not valid — it may have been truncated by your email
              client. Use the options below and we will take care of it.
            </p>
          ) : null}
          <p>
            The quickest way to stop email is the <strong>unsubscribe link at the bottom
            of any message</strong> we have sent you. It works in one click, no sign-in.
          </p>
          <p>To stop text messages, reply STOP to any text.</p>
          <p>
            {CONTACT_EMAIL ? (
              <>
                Or email{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Unsubscribe')}`}
                  className="text-accent-700 underline hover:text-accent"
                >
                  {CONTACT_EMAIL}
                </a>{' '}
                and we will remove you promptly.
              </>
            ) : (
              <>Or write to us and we will remove you promptly.</>
            )}
          </p>
          <p className="text-sm text-ink/[.7]">
            {SPONSOR_NAME}
            {SPONSOR_POSTAL_ADDRESS ? ` · ${SPONSOR_POSTAL_ADDRESS}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
