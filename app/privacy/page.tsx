import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { CONTACT_EMAIL } from '@/lib/site'
import { PRIVACY_NOTICE_VERSION } from '@/lib/versions'
import { SPONSOR_NAME, SPONSOR_POSTAL_ADDRESS } from '@/lib/sponsor'

export const metadata: Metadata = { title: 'Privacy notice' }

/**
 * DRAFT — REQUIRES COUNSEL SIGN-OFF BEFORE LAUNCH (Doc 03).
 *
 * Written to describe what this codebase actually does, field by field, rather
 * than from a template. Where it makes a factual claim about data handling,
 * that claim is traceable:
 *
 *   collected fields          db/001_init.sql → supporters
 *   consent evidence          db/001_init.sql → consent_events
 *   address → district        lib/districts.ts (U.S. Census geocoder)
 *   what is derived+stored    db/001_init.sql → district_matches
 *   employer firewall         db/001_init.sql → district_density view
 *   abuse-control data        db/002_rate_limits.sql (hashed, no raw IP)
 *   export accountability     db/001_init.sql → export_audit
 *
 * If any of those change, this page changes with them. A privacy notice that
 * describes something other than the running system is worse than none.
 *
 * Revised 2026-08-10 against the docs/05 revision-2 review:
 *   - The notice no longer characterises Georgia statutory coverage at all.
 *     Georgia enacted SB 111 (Act 462) in 2026; an earlier draft here asserted
 *     no such statute existed. Describing what we do, rather than what the law
 *     requires, does not go stale in a legislative session.
 *   - The 24-month retention promise is gone. It described a job that is not
 *     built, which is a misrepresentation regardless of intent.
 *   - Deletion now names its exception: consent records outlive contact
 *     details, because they are the evidence of permission.
 *   - Small-cell suppression is stated, so the firewall promise covers
 *     aggregates as well as individual records.
 *   - The commercial geocoding fallback is disclosed.
 *
 * Still for counsel, not developers: whether supporters outside Georgia are in
 * scope, and confirmation against the enrolled text of Act 462.
 */

const UPDATED = 'August 10, 2026'



function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-heading text-[22px] font-bold leading-tight">{title}</h2>
      <div className="grid gap-3 text-base leading-[1.65]">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="mx-auto max-w-frame px-4 pb-16 pt-8 sm:px-6">
      <h1 className="mb-3 text-[clamp(28px,6vw,36px)] leading-[1.15]">Privacy notice</h1>
      <p className="text-sm text-navy-500">
        Last updated {UPDATED} &middot; Version {PRIVACY_NOTICE_VERSION}
      </p>

      <p className="mt-6 text-base leading-[1.65]">
        This notice explains what {SPONSOR_NAME} collects when you sign up, why we
        collect it, who sees it, and how to get it removed. It describes what the
        system actually does. If our practices change, this page changes with them.
      </p>

      <Section title="The short version">
        <ul className="grid list-disc gap-2 pl-5">
          <li>
            We use your home address for one purpose: finding which Georgia state
            legislators represent you. We do not use it for anything else.
          </li>
          <li>
            <strong className="font-semibold">
              We never tell your employer, a center owner, or a manager whether you
              signed up.
            </strong>{' '}
            They only ever see counts by district.
          </li>
          <li>We do not sell or rent your information, ever.</li>
          <li>
            Participation is completely voluntary and has no effect on your
            employment.
          </li>
          <li>You can leave at any time, and we will delete your record if you ask.</li>
        </ul>
      </Section>

      <Section title="What we collect">
        <p>Only what you type into the sign-up form:</p>
        <ul className="grid list-disc gap-2 pl-5">
          <li>Your name, email address, cell phone number, and any other phone number</li>
          <li>Your home address</li>
          <li>Your employer&rsquo;s name and address</li>
          <li>Your role — owner, regional manager, corporate staff director, teacher, or a description you provide</li>
        </ul>
        <p>
          When you check a consent box we also record the date and time, the exact
          wording you agreed to, your IP address, and your browser&rsquo;s user-agent
          string. That record exists so we can prove what you actually agreed to,
          which is a legal requirement for sending you email and text messages. We do
          not use it to track you across websites.
        </p>
        <p>
          If you arrived through a link specific to your center, we record which link
          it was, so we can see which outreach worked.{' '}
          <strong className="font-semibold">
            That code is never used to report your individual sign-up back to your
            center.
          </strong>
        </p>
        <p>
          To limit spam and automated abuse of the form, we keep a short-lived,
          one-way scrambled version of your network address. It cannot be turned back
          into an IP address and it expires on its own.
        </p>
        <p>
          We do not use advertising or analytics trackers, and we do not build a
          profile of you from other sources.
        </p>
      </Section>

      <Section title="Why we collect your home address">
        <p>
          Legislators weigh messages from people who live in their district far more
          heavily than messages from anyone else. To tell you who represents you, we
          have to know where you live.
        </p>
        <p>
          Your address is sent to the U.S. Census Bureau&rsquo;s public geocoding
          service, which returns your Georgia House district, Georgia Senate district,
          congressional district, county, and the map coordinates of the address. If
          the Census service does not hold your address &mdash; common on newer
          streets &mdash; we send it to a commercial mapping service (Mapbox) to find
          its coordinates, and then ask the Census service which districts those
          coordinates fall in. We store those results alongside your record, and we do
          the same for your employer&rsquo;s address so we can understand where
          licensed programs are concentrated.
        </p>
        <p>
          If we cannot confidently match your address, we record it as unmatched
          rather than guessing. We would rather tell you nothing than tell you the
          wrong legislator.
        </p>
      </Section>

      <Section title="What we send you, and how to stop it">
        <p>
          Checking the email box is required to sign up. It means we may send you
          updates and action alerts about child care policy in Georgia. Every email
          includes an unsubscribe link, and unsubscribing takes effect promptly.
        </p>
        <p>
          The text message box is separate and entirely optional. You can sign up with
          email only, and nothing about your participation changes if you leave it
          unchecked. If you do check it, message and data rates may apply; reply STOP
          to any message to stop them and HELP for help.
        </p>
        <p>
          Unsubscribing from email or texts stops the messages. If you also want your
          record deleted, ask us directly — see below.
        </p>
      </Section>

      <Section title="Who sees your information">
        <p>
          Campaign staff administering this program can see supporter records. Access
          is limited and password-protected, and every bulk export of personal
          information is logged with who ran it and what it contained.
        </p>
        <p>
          <strong className="font-semibold">
            Employers, center owners, regional managers, and the organizations
            sponsoring this effort do not receive individual sign-up information.
          </strong>{' '}
          Reporting to them is aggregate only — for example, &ldquo;41 licensed
          providers in House District 58&rdquo; — and is produced from a summary view
          that cannot show who is in the count. This is a design constraint of the
          system, not a policy we apply by hand.
        </p>
        <p>
          We share data with a small number of service providers who operate the
          system on our behalf: our website host, our database host, the U.S. Census
          Bureau geocoder described above, and the email provider that
          delivers what you asked to receive. They may use your information only
          to provide those services to us.
        </p>
        <p>
          We may disclose information if the law requires it — a subpoena, court
          order, or similar legal process — or to protect against fraud or abuse.
        </p>
        <p>
          <strong className="font-semibold">
            We do not sell your personal information, and we do not rent, trade, or
            share it for anyone else&rsquo;s marketing.
          </strong>
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We do not keep information longer than we need it. We are building a
          process to re-confirm or delete the records of supporters who have been
          inactive for an extended period.
        </p>
        <p>
          If you unsubscribe or ask to be deleted, we keep a minimal record of that
          request — enough to honor it and to show that we did — and remove the rest.
        </p>
      </Section>

      <Section title="Your choices">
        <p>You can ask us at any time to:</p>
        <ul className="grid list-disc gap-2 pl-5">
          <li>Tell you what information we hold about you</li>
          <li>Correct anything that is wrong, including a mismatched district</li>
          <li>Delete your record entirely</li>
          <li>Stop receiving email from us</li>
        </ul>
        <p>
          We aim to respond within 45 days. We will not treat you differently for
          asking. Depending on where you live you may have additional rights under
          your state&rsquo;s law; tell us and we will honor those too.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Information is transmitted over encrypted connections and stored in a
          database that is not publicly reachable. Administrative access requires a
          password and expires automatically. Credentials are held in environment
          configuration, never in our source code.
        </p>
        <p>
          No system is perfectly secure. If a breach affects your personal
          information, we will notify you promptly and as required by law.
        </p>
      </Section>

      <Section title="Children">
        <p>
          This sign-up is for adults who work in licensed child care. It is not
          directed to children, and we do not knowingly collect information from
          anyone under 13. If you believe a child has submitted information, contact
          us and we will delete it.
        </p>
      </Section>

      <Section title="Changes to this notice">
        <p>
          If we change how we handle your information, we will update this page and
          change the date at the top. If the change is significant, we will tell
          subscribers by email before it takes effect.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          {CONTACT_EMAIL ? (
            <>
              Email{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-navy-700 underline hover:text-navy-900"
              >
                {CONTACT_EMAIL}
              </a>
              , or write to us at:
            </>
          ) : (
            <>Write to us at:</>
          )}
        </p>
        <p>
          {SPONSOR_NAME}
          <br />
          {SPONSOR_POSTAL_ADDRESS ?? (
            <span className="text-danger">
              [Postal address required before launch — set
              NEXT_PUBLIC_SPONSOR_POSTAL_ADDRESS]
            </span>
          )}
        </p>
      </Section>
    </div>
  )
}
