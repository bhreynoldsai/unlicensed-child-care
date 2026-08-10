# Consent and privacy language — counsel review packet

**Status: DRAFT. Not legal advice. Prepared by the build team for review.**
**Prepared 2026-08-09. Nothing here has been reviewed by a lawyer.**

## How to use this document

Everything below is either (a) language currently live on
`galicensedcare.org`, or (b) proposed replacement language with the reasoning
behind each clause. Send it to counsel as-is. The questions in §7 are the ones
a developer cannot answer.

**The proposed language in §1 and §2 is now live as a placeholder** (applied
2026-08-09) and marked as such in `lib/consent.ts`. It is drafted to the
stricter standard so the site is defensible in the meantime, but it is not
reviewed — getting it reviewed is the point of this packet.

**Whatever counsel changes should be changed once, not iteratively.** `lib/consent.ts` holds the
verbatim text, and every `consent_events` row stores both the text shown and its
SHA-256 hash. That is deliberate: it lets the campaign prove what a specific
person agreed to on a specific date. Changing a string is correct and safe —
old records keep their old text and hash — but it should happen once, after
review, not iteratively.

---

## 1. Email consent

### Previous wording (in records created before 2026-08-09)

> I agree to receive email updates and action alerts about child care policy in
> Georgia. I can unsubscribe at any time.

### Now live, pending review

> I agree to receive email updates and action alerts about child care policy in
> Georgia from the Georgia Licensed Child Care Network. I can unsubscribe at any
> time using the link in any message. See our Privacy notice.

### Why each element

| Element | Reason |
|---|---|
| Names the sender | CAN-SPAM requires the sender be identifiable. Naming it *at the point of consent* also matters for deliverability: Gmail and Yahoo's bulk-sender rules weigh whether recipients recognise who is writing. |
| "using the link in any message" | CAN-SPAM requires a functioning opt-out mechanism. Saying where it is reduces spam complaints, which are the main deliverability risk. |
| Links the privacy notice | Not required by CAN-SPAM. Included because the form collects a home address, and consent given without access to the notice is weak consent. |

**Note:** CAN-SPAM is an opt-*out* regime — prior consent is not legally
required for commercial email. This program uses opt-in anyway, which is
stricter than the law and is what modern deliverability requires. Nothing here
should be relaxed to the statutory floor.

---

## 2. SMS consent

### Previous wording (in records created before 2026-08-09)

> I agree to receive recurring text message alerts (including autodialed
> messages) about child care policy at the mobile number I provided. Consent is
> not a condition of participation. Message and data rates may apply. Reply STOP
> to cancel, HELP for help.

### Now live, pending review

> I agree that the Georgia Licensed Child Care Network may send me recurring
> text message alerts about child care policy in Georgia, including messages
> sent using automated technology, at the mobile number I provided. Consent is
> not a condition of participation or of my employment. Message frequency
> varies. Message and data rates may apply. Reply STOP to cancel or HELP for
> help. Carriers are not liable for delayed or undelivered messages. See our
> Privacy notice.

### Why each element

The text now live is written to the **stricter** standard — TCPA prior express
*written* consent — even though a good argument exists that non-commercial
advocacy messaging faces a lower bar. Two reasons: the line between issue
advocacy and marketing is not always clean, and carriers apply the strict
standard regardless during A2P 10DLC campaign vetting.

| Element | Reason |
|---|---|
| Names the sender explicitly | Express written consent must identify who is authorised to send. "Consent to receive texts" without a named sender is the single most common defect. |
| "including messages sent using automated technology" | Discloses the autodialer. Plainer than "autodialed", which many readers will not parse. |
| "not a condition of participation **or of my employment**" | The added clause is the employer-context mitigation. This program is distributed *through employers*, and that is its distinctive legal exposure — see §4. |
| "Message frequency varies" | A frequency disclosure is expected. "Recurring" alone is thin; carriers ask for this during campaign registration. |
| "Message and data rates may apply" | Standard, expected by carriers. |
| STOP / HELP | Required, and must actually work — see the blocking note below. |
| Carrier liability disclaimer | Industry standard; harmless and expected. |
| Privacy notice link | Same reasoning as email. |

### Blocking issue

**The SMS box is currently live on the form and nothing can honour STOP.** No
Twilio number is provisioned and A2P 10DLC is not registered. Every hour it
stays up, the campaign accumulates consent records containing a promise it
cannot presently keep.

Two acceptable resolutions:

1. **Hide the SMS checkbox** until 10DLC clears and Advanced Opt-Out is enabled.
   One environment variable; the form already succeeds on email consent alone.
2. **Leave it**, on the reasoning that no messages are being sent, so there is
   nothing to stop, and the consent is banked for later.

The build team's recommendation is (1). Counsel should decide.

---

## 3. Voluntary participation notice

### Live, unchanged

> Participation is completely voluntary and has no effect on your employment.

This appears on the landing page and on the break room poster, and the same
assurance is now carried inside the SMS consent text. It should not be softened, shortened, or moved
into a footnote. It is the primary mitigation for §4.

---

## 4. The employer-context question — the real exposure

This is where the build team most needs counsel's judgment, and it is not a
copy question.

The program recruits employees **through their employers**: posters go up in
break rooms, and owners and directors are asked to pass the link along. The
sign-up collects home addresses and asks people to contact legislators about a
policy in their employer's commercial interest.

Risks the build team can see, without knowing how serious each is:

- **Perceived coercion.** An employee may reasonably read a break room poster as
  something management wants them to do. The voluntary notice is the mitigation,
  but a notice is not the same as an absence of pressure.
- **Concerted activity.** Employer-facilitated solicitation of employees around
  a workplace-adjacent political issue may touch NLRA §7 considerations even in
  a non-union workplace. The build team does not know whether it does here.
- **Data flowing back to employers.** The system is architected so it cannot:
  reporting reads an aggregate view, and no individual sign-up is ever visible to
  an owner, manager, or the sponsor. That is a design constraint, not a policy —
  see Doc 03 §4. Counsel should confirm it is the *right* constraint.
- **Attribution codes.** Each center gets a distinct link parameter, so the
  campaign can see which outreach worked. It is never used to report an
  individual's enrolment back to a center. Counsel should confirm that
  center-level aggregate attribution is acceptable.

---

## 5. Home address explanation

### Currently live

> We use this only to find which state legislators represent you. Legislators
> weigh messages from their own constituents most heavily.

Positioned immediately **before** the address fields, not after. This is
accurate to the implementation: the address is geocoded for district matching
and is not used for any other purpose.

Live, unchanged.

---

## 6. Privacy notice

The full notice is live at `/privacy` and is reproduced by the running code
rather than duplicated here — read it at the URL so you review what visitors
actually see.

It was written against the implementation field by field rather than from a
template. Every factual claim traces to a specific table or module, listed in
the file header of `app/privacy/page.tsx`. If the data handling changes, the
notice changes with it.

Points counsel should focus on:

- **The employer firewall claim.** The notice states plainly that employers,
  owners, managers, and the sponsor never receive individual sign-up
  information. That is true of the current build. It is a strong, checkable
  promise, and it should not be made unless the campaign intends to keep it
  permanently.
- **Retention.** The notice commits to re-confirming or deleting after 24 months
  of inactivity. **That job is not built yet.** Either it gets built before
  launch or the sentence should be softened to describe intent rather than
  practice.
- **Breach notification.** The notice references Georgia law generally rather
  than citing a statute, deliberately — see §7.
- **Rights language.** It offers access, correction, deletion, and opt-out to
  everyone rather than only to residents of states that mandate them. Simpler to
  administer, and it cannot be wrong by being too generous.

---

## 7. Questions only counsel can answer

1. **Has Georgia enacted a comprehensive consumer privacy statute?** The notice
   is drafted assuming it has not, relying on sectoral federal law plus
   Georgia's breach-notification statute. The build team's knowledge has a
   cutoff and this must be verified against current law.
2. **Are out-of-state supporters in scope?** Several state privacy statutes
   reach residents wherever the controller sits. The form does not restrict to
   Georgia residents.
3. **Who is the sender of record?** The site says "Paid for by Georgia Licensed
   Child Care Network" and carries True North Strategies' Alpharetta address.
   If the Network is not itself a registered entity, the disclosure may need to
   name the funding organisation. **This is now blocking three things at once:**
   the CAN-SPAM footer, the "Paid for by" line, and the Twilio A2P brand
   registration, which must match the sender identity shown on the website.
4. **Does the employer-distribution model need its own consent or disclosure?**
   See §4.
5. **Is the SMS consent text sufficient for TCPA express written consent**, and
   is that even the applicable standard for issue advocacy?
6. **Is the 24-month retention commitment right**, and should it be built before
   launch or the language softened?
7. **Should the privacy notice carry an effective date and a change-notification
   commitment** beyond the current "we will tell subscribers by email before
   significant changes take effect"?

---

## 8. If the language changes

1. Update the strings in `lib/consent.ts`. Nothing else needs touching — the
   hash is computed from the text.
2. Existing `consent_events` rows keep their original text and hash. That is
   correct and required: they record what those people actually saw.
3. Re-read `CLAUDE.md` guardrails 1–3 before editing. In particular, consent
   records are append-only, and the two checkboxes stay separate and unticked.
4. Update `/privacy` in the same pass if the change affects data handling, so
   the notice and the system never describe different things.
