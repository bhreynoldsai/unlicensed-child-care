# Consent and privacy language — counsel review packet

**Status: DRAFT, revision 2. Not legal advice.**
**Originally prepared by the build team 2026-08-09. Revised 2026-08-10 following
a legal review pass.**

> **This document has not been reviewed by a licensed attorney.** Revision 2
> incorporates a structured legal review with citations, but that review was
> produced by an AI assistant, not by counsel. Every statement of law below is
> cited so it can be checked rather than trusted. Items listed in §7 still
> require sign-off from an attorney admitted in Georgia with nonprofit,
> political-law, and TCPA experience.

---

## How to use this document

Everything below is either (a) language currently live on `galicensedcare.org`,
or (b) proposed replacement language with the reasoning behind each clause. Send
it to counsel as-is. The questions in §7 are the ones a developer cannot answer.

`lib/consent.ts` holds the verbatim consent text, and every `consent_events` row
stores both the text shown and its SHA-256 hash. That is deliberate: it lets the
campaign prove what a specific person agreed to on a specific date. Changing a
string is correct and safe — old records keep their old text and hash — but it
should happen once, after review, not iteratively.

The hash alone is not a complete consent record. §8.2 lists the additional
fields required before any consent is relied on.

---

## 0. Summary

### 0.1 The governing constraints, in order of practical bite

The program's exposure is not primarily where the first draft of this packet
assumed it was. In descending order of how quickly and certainly each one
bites:

1. **Carrier and mailbox-provider rules** — CTIA, A2P 10DLC, and the
   Google/Yahoo/Microsoft bulk-sender requirements. Not law. Enforced
   immediately, automatically, and without process.
2. **NLRA § 8(a)(1)**, because the program is distributed through employers.
3. **Deception exposure** under FTC Act § 5 and Georgia's Fair Business
   Practices Act, O.C.G.A. § 10-1-390 et seq., for any privacy-notice promise
   the build does not keep.
4. **TCPA § 227(b)**, which does apply to text messages, but at the *prior
   express consent* standard rather than the written-consent standard.
5. **Georgia statutory law** — breach notification, lobbyist registration, and
   charitable solicitation.

CAN-SPAM and TCPA prior express *written* consent, the two regimes the original
packet was drafted against, most likely do not apply to this program at all.
That is not a reason to relax any of the drafted language — nearly all of it
should be kept — but the reasoning has been corrected throughout, because wrong
reasons produce bad decisions later.

### 0.2 Immediate actions

1. **Hide the SMS checkbox.** Not a judgment call. See §2.4.
2. **Apply an attribution suppression threshold.** See §4.4.
3. **Remove the 24-month retention sentence from `/privacy`.** See §6.3.
4. **Resolve sender of record and tax status.** Blocks five downstream items.
   See §7 Q3 and Q8.

### 0.3 Georgia has enacted a comprehensive privacy statute

Georgia SB 111, the *Georgia Consumer Privacy Protection Act*, was signed
2026-05-11 (Act 462) and is reported effective 2026-07-01. The privacy notice at
`/privacy` was drafted on the assumption that no such statute existed. The
campaign is very likely outside the Act's applicability thresholds and may be
exempt outright as a nonprofit, but the notice cannot silently assume it. See
§6.1.

---

## 1. Email consent

### Previous wording (in records created before 2026-08-09)

> I agree to receive email updates and action alerts about child care policy in
> Georgia. I can unsubscribe at any time.

### Interim wording (live 2026-08-09, superseded)

> I agree to receive email updates and action alerts about child care policy in
> Georgia from the Georgia Licensed Child Care Network. I can unsubscribe at any
> time using the link in any message. See our Privacy notice.

### Recommended wording

> I agree to receive email updates and action alerts about child care policy in
> Georgia from the Georgia Licensed Child Care Network. I can unsubscribe at any
> time using the link in any message, or by replying to any message or
> contacting us at [address]. See our Privacy Notice.

Two changes from the interim text:

- **"or by replying … or contacting us at"** mirrors the SMS revocation rule in
  §2.3 and avoids representing a single exclusive opt-out channel. Keeping email
  and SMS opt-out mechanics parallel is worth more than it costs.
- **"Privacy Notice"** capitalised and linked as a defined term, matching the
  heading actually used at `/privacy`. Trivial, but consent language that
  misnames the document it incorporates is easy to pick at.

### Why each element

| Element | Reason |
|---|---|
| Names the sender | CAN-SPAM's identification requirements apply only to a *commercial electronic mail message* — one whose "primary purpose … is the commercial advertisement or promotion of a commercial product or service," 15 U.S.C. § 7702(2)(A), with the primary-purpose test at 16 C.F.R. § 316.3. Pure legislative-action email from an advocacy organisation is not a commercial message, and CAN-SPAM's substantive requirements do not attach. Naming the sender is still correct for two reasons that do apply: mailbox-provider rules weigh whether recipients recognise the sender, and A2P 10DLC vetting compares the name shown at opt-in against the registered brand. |
| "using the link in any message" | The CAN-SPAM opt-out duty at 15 U.S.C. § 7704(a)(3)–(4) likewise attaches only to commercial messages. The operative requirements are the mailbox providers': RFC 8058 one-click unsubscribe for bulk senders, opt-outs processed within two days, and a Gmail spam-complaint rate kept below 0.10% and never at or above 0.30%. These are stricter than CAN-SPAM and do not exempt nonprofits. |
| Links the privacy notice | Correct, and now load-bearing for a second reason: A2P 10DLC brand vetting checks that Terms and Privacy Notice URLs are live and publicly reachable. |

### Note on CAN-SPAM

CAN-SPAM most likely does not apply to this program, because pure issue advocacy
is not commercial advertisement or promotion. Three consequences:

1. **One CAN-SPAM rule applies regardless.** 15 U.S.C. § 7704(a)(1) — no false
   or misleading header information — is not limited to commercial messages.
   From, Reply-To, and originating domain must be accurate.
2. **The analysis flips if content changes.** Paid trainings, conferences,
   merchandise, ticketed events, sponsored or co-branded content, or anything
   promoting a for-profit sponsor makes a message commercial and pulls in the
   full § 7704 apparatus, including the valid physical postal address
   requirement at § 7704(a)(5). Given the sponsor's commercial interest in the
   underlying policy, this is a realistic near-term risk. See §7 Q9.
3. **Include the postal address now.** It costs one footer line, it is required
   if the analysis ever flips, and its absence is a signal mailbox providers
   weight. It cannot be printed until §7 Q3 is resolved.

The opt-in posture is stricter than the law requires and should be kept.

---

## 2. SMS consent

### Previous wording (in records created before 2026-08-09)

> I agree to receive recurring text message alerts (including autodialed
> messages) about child care policy at the mobile number I provided. Consent is
> not a condition of participation. Message and data rates may apply. Reply STOP
> to cancel, HELP for help.

### Interim wording (live 2026-08-09, superseded)

> I agree that the Georgia Licensed Child Care Network may send me recurring
> text message alerts about child care policy in Georgia, including messages
> sent using automated technology, at the mobile number I provided. Consent is
> not a condition of participation or of my employment. Message frequency
> varies. Message and data rates may apply. Reply STOP to cancel or HELP for
> help. Carriers are not liable for delayed or undelivered messages. See our
> Privacy notice.

### Recommended wording

> I agree that the Georgia Licensed Child Care Network may send me recurring
> text message alerts about child care policy in Georgia, including messages
> sent using automated technology, at the mobile number I provided. Consent is
> not a condition of participation or of my employment, and my employer will not
> be told whether I signed up. Message frequency varies; typically [N] messages
> per month. Message and data rates may apply. Reply STOP to cancel or HELP for
> help; I can also opt out at any time by [email address / web form / phone
> number]. Carriers are not liable for delayed or undelivered messages. My
> number will not be sold, rented, or shared with anyone else. See our Terms and
> Privacy Notice.

Four substantive additions, each tied to a specific rule:

- **"and my employer will not be told whether I signed up"** — the highest-value
  sentence in the packet. See §4.1.
- **"typically [N] messages per month"** — CTIA § 5.1.2.1 expects a frequency
  disclosure, and reviewers increasingly want a number rather than "varies."
  Pick a conservative ceiling the program can live with.
- **"I can also opt out at any time by …"** — required in substance by
  47 C.F.R. § 64.1200(a)(10), which forbids designating an exclusive means of
  revocation. See §2.3.
- **"will not be sold, rented, or shared"** — carriers specifically look for this
  representation in the opt-in flow and privacy notice during 10DLC vetting, and
  it is independently true of this build.

### 2.1 The applicable legal standard

Prior express **written** consent is not the governing standard here, for two
independent reasons.

47 C.F.R. § 64.1200(a)(2) imposes the written standard only on a call or text
that "includes or introduces an advertisement or constitutes telemarketing,"
defined at § 64.1200(f)(13) as messaging to encourage "the purchase or rental
of, or investment in, property, goods, or services." Pure legislative advocacy
is not that. Separately, § 64.1200(a)(2) contains an express carve-out for calls
made by or on behalf of a **tax-exempt nonprofit organization**, which drops the
standard to prior express consent even for messages that would otherwise be
telemarketing. The national do-not-call rules exclude tax-exempt nonprofit
messaging on similar terms, § 64.1200(f)(15)(iii).

The governing provision is therefore **47 C.F.R. § 64.1200(a)(1)** — prior
express consent, no writing required.

**This turns on the sender's tax status, which the packet does not state.** If
the sending entity is not itself tax-exempt — if "Georgia Licensed Child Care
Network" is a program name and the sender of record is a for-profit — the
nonprofit carve-out does not apply, and if any message is later held to promote a
sponsor's commercial interest, the written-consent regime governs after all.
This is the same unresolved question as §7 Q3, and it is why that question is
genuinely blocking rather than administrative.

**The recommendation is nonetheless to draft to the written standard**, for
three reasons:

- The identity of the sender is unresolved, so the applicable standard is
  unresolved.
- Carriers apply the strict standard during A2P 10DLC vetting regardless of what
  the FCC requires.
- The written-consent elements at 47 C.F.R. § 64.1200(f)(9) are a well-tested
  template for proving the **scope** of consent, which is what actually gets
  litigated after *Insurance Marketing Coalition Ltd. v. FCC*, No. 24-10277
  (11th Cir. Jan. 24, 2025): consent is effective if "clearly and unmistakably
  stated," and the fight is over what the person clearly agreed to.

Do not add "one-to-one consent" or "logically and topically related" language to
this flow. That FCC rule was vacated in *IMC* — binding in the Eleventh Circuit
and therefore in Georgia — and removed from the CFR in August 2025.

### 2.2 Why each element

| Element | Reason |
|---|---|
| Names the sender explicitly | CTIA § 5.1.2.2: consent is not transferable or assignable and applies only to the specific campaign and sender that obtained it. A carrier rule, not law, and it binds regardless of the TCPA. It also constrains coalition and affiliate data flows — see §4.5. |
| "including messages sent using automated technology" | Keep, understanding what it now does. The ATDS disclosure element lives in § 64.1200(f)(9)(i)(A), which applies only to telemarketing, and *Facebook, Inc. v. Duguid*, 592 U.S. 395 (2021) narrowed ATDS to equipment using a random or sequential number generator — a platform texting a stored opt-in list generally is not one. The clause is now evidence of the scope of consent rather than compliance with a disclosure rule. That is still worth a sentence. |
| "not a condition of participation **or of my employment**" | Correct and important. The analogous element at § 64.1200(f)(9)(i)(B) is phrased around purchase of goods or services and does not fit this program; the employment clause is the one doing real work, and it is doing NLRA work rather than TCPA work. |
| "my employer will not be told whether I signed up" | The affirmative counterpart. A promise not to condition employment does not address impression of surveillance, which is the actual § 8(a)(1) risk. See §4.1. |
| "Message frequency varies" | Keep, and add a number. CTIA § 5.1.2.1. |
| "Message and data rates may apply" | Standard and expected by carriers. |
| STOP / HELP | Required by carrier rules and, for revocation, by § 64.1200(a)(10) — but STOP cannot be the only route. See §2.3. |
| Carrier liability disclaimer | Industry standard; harmless and expected. |
| Privacy notice link | Correct. Add a **Terms** link: 10DLC vetting checks for both as live public URLs. |
| "will not be sold, rented, or shared" | Carrier vetting checks for this specific representation, and it is true of the build. |

### 2.3 Revocation

**47 C.F.R. § 64.1200(a)(10), effective 2025-04-11**, is the most operationally
demanding TCPA rule now in force. In force today:

- A recipient may revoke consent **by any reasonable method**.
- These are **per se** reasonable and must always be honored in a reply text:
  **stop, quit, end, revoke, opt out, cancel, unsubscribe**. The interim text
  offered only STOP.
- Other wording must be honored if a reasonable person would understand it to
  convey revocation. In practice, a human has to read the inbox.
- Revocation must be honored **within a reasonable time not to exceed ten
  business days**.
- **The sender may not designate an exclusive means of revocation.** Web form,
  email, and phone requests must all work.
- If reply texting is not supported, **every message** must say so and provide an
  alternative.

One piece of the rule — that revocation on one message type applies to all future
robotexts from the same sender on unrelated subjects — has been waived twice and
is currently scheduled to take effect **2027-02-01** (FCC Orders DA 25-312 and
DA 26-12; the DA 26-12 date is taken from a secondary source and should be
confirmed against FCC EDOCS).

**Build requirement:** one **global suppression list keyed to the sender**, not
per-campaign, checked before every send across every channel. Building it
per-campaign now guarantees a migration in early 2027.

### 2.4 Blocking issue

**The SMS box is live on the form and nothing can honour STOP.** No Twilio number
is provisioned and A2P 10DLC is not registered. Every hour it stays up, the
campaign accumulates consent records containing a promise it cannot presently
keep.

The argument for leaving it up — no messages are being sent, so there is nothing
to stop, and the consent is banked for later — does not hold:

1. **It is not only about STOP.** Consent obtained today is consent to be texted
   by the Georgia Licensed Child Care Network. If §7 Q3 resolves such that the
   registered A2P brand is a different legal entity, CTIA § 5.1.2.2 makes that
   consent non-transferable to the registered sender. The campaign would be
   banking consent that carrier rules will not permit it to use, and would not
   discover this until brand vetting.
2. **Scope and staleness.** Consent collected months before the first message,
   with no confirmation message, no frequency actually disclosed, and no
   functioning HELP, is exactly the fact pattern where "clearly and unmistakably
   stated" (*IMC*, binding in Georgia) becomes arguable.
3. **It is a representation the campaign cannot perform.** Telling someone
   "Reply STOP to cancel" when nothing can receive a STOP is a false statement of
   fact in a consumer-facing flow — a deception theory under FTC Act § 5 and
   O.C.G.A. § 10-1-390 et seq., independent of the TCPA, and one that does not
   require anyone to have been texted.
4. **10DLC vetting inspects the live opt-in form.** A form collecting SMS consent
   for an unregistered brand is a rejection ground.

**Resolution: hide the SMS checkbox** until 10DLC clears, Advanced Opt-Out is
enabled, the global suppression list exists, and sender of record is resolved.
One environment variable; the form already succeeds on email consent alone.

**Consents already collected under the interim SMS text should be quarantined**,
not deleted — the records are append-only and must stay — but flagged in the data
model as not-yet-usable pending a re-confirmation decision once the sender is
known. They must not be migrated into a sending list by default.

---

## 3. Voluntary participation notice

### Recommended wording

> Participation is completely voluntary and has no effect on your employment.
> Your employer will not be told whether you signed up, and will never see your
> individual information.

The first sentence is live and unchanged on the landing page and the break room
poster; the same assurance is carried inside the SMS consent text. It should not
be softened, shortened, or moved into a footnote. It is the primary mitigation
for §4.

**Why the second sentence.** "No effect on your employment" answers a question
about *consequences*. The NLRA risk is about *observation* — an employee who
believes management can see the sign-up list is chilled whether or not anything
happens to them. The build already guarantees the firewall (§4.3); the notice
should say so, because a mitigation nobody is told about does not mitigate.

### Poster and distribution mechanics

How the material is distributed matters more than what it says:

- Post it; do not have managers hand it to people.
- Do not distribute the link through employer email, HRIS, timeclock systems,
  shift-scheduling apps, or any channel where the employer can see who clicked.
- No sign-up sheets, clipboards, tablets at the manager's desk, or pre-populated
  forms.
- No manager follow-up of any kind, including encouragement.
- If any employer holds a meeting about this, apply the safe harbour in
  *Amazon.com Services LLC*, 373 NLRB No. 136 (Nov. 13, 2024): advance notice of
  the subject matter, an express statement that attendance is voluntary with no
  adverse consequences for non-attendance, and an assurance that **no attendance
  records will be kept**.

These belong in the materials given to participating centers, not only in this
packet. A one-page "what owners and directors may and may not do" sheet should be
drafted — see §7 Q4.

---

## 4. The employer-context question — the real exposure

The intuitive framing — that employee participation is the thing creating legal
risk — is backwards.

Under *Eastex, Inc. v. NLRB*, 437 U.S. 556 (1978), employee advocacy directed at
legislators about matters bearing on terms and conditions of employment falls
within NLRA § 7's "other mutual aid or protection" clause, provided there is a
nexus between the political issue and an identified employment concern. Child
care funding and licensing legislation, for child care workers, is a strong nexus
case.

**So the likely posture is that employee participation is protected concerted
activity.** The exposure is not that the campaign is doing something to
employees. It is that an employer who facilitates, observes, or tracks that
activity may violate **§ 8(a)(1), 29 U.S.C. § 158(a)(1)** — and the campaign is
the party building the system that determines whether the employer can observe
it.

That changes what the mitigations should be. This is primarily an architecture
problem, not a disclaimer problem.

### 4.1 Perceived coercion and impression of surveillance

An employee may reasonably read a break room poster as something management wants
them to do. The voluntary notice is the mitigation, but a notice is not the same
as an absence of pressure.

The sharper doctrine is **impression of surveillance**. Where an employer can
see, or an employee reasonably believes the employer can see, who participated in
protected activity, the Board can find a violation without any adverse action and
without bad motive. Rosters, manager-collected sign-ups, employer-branded landing
pages that report back, and small-denominator attribution reporting are all
routes to it. The build must foreclose all of them, and must be seen to have
foreclosed them.

### 4.2 Concerted activity

Employer-facilitated solicitation around a workplace-adjacent legislative issue
sits inside NLRA § 7 including in a non-union workplace — § 7 rights do not
depend on union representation. Whether any participating center is unionised or
has a pending petition should be confirmed; if so, direct-dealing and
unilateral-change issues arise on top of the above and the analysis changes
materially.

*Amazon.com Services LLC*, 373 NLRB No. 136 (Nov. 13, 2024), which made mandatory
captive-audience meetings on unionisation unlawful, remains good law as of this
revision. It is under active attack: the General Counsel moved in May 2026 to
have it overruled, and the Board reached a 3–1 majority in August 2026. Its
current status should be confirmed before launch. Its literal holding concerns
unionisation rather than legislative advocacy and should not be relied on either
way, but its three-part safe harbour is cheap and is the right design regardless,
and the surveillance and coercion doctrines in §4.1 are independent of it and
would survive its reversal.

### 4.3 Data flowing back to employers

The system is architected so that it cannot: reporting reads an aggregate view,
and no individual sign-up is ever visible to an owner, manager, or the sponsor.
That is a design constraint, not a policy — see Doc 03 §4.

This is the right constraint, and it should be hardened from a design constraint
into a **written, dated commitment approved at board or principal level**, so
that a future product decision cannot quietly reverse it. Given §4.1, it is the
primary NLRA mitigation in the entire program. It should be the hardest thing in
the system to change, and it should be stated to employees (§3).

### 4.4 Attribution codes

Each center gets a distinct link parameter, so the campaign can see which
outreach worked. Center-level aggregate attribution is **not** acceptable as
currently described, and this is the one place in the build to change before
anything else ships.

The problem is denominator size. "Aggregate" is a meaningful protection at a
200-employee center. At a six-employee center, a report reading "Center 0447: 5
sign-ups" tells an owner almost exactly who signed up, and "Center 0447: 0
sign-ups" tells them something too. If an owner can infer participation in
protected activity from campaign reporting, the firewall in §4.3 does not
actually exist for small centers — and small centers are most of this sector.

Required changes, all mechanical:

1. **Suppression threshold.** Do not report a center-level count below a minimum
   cell size — use **n < 5** — in any output an owner, manager, or the sponsor
   can see. Report "fewer than 5" or suppress the row entirely.
2. **No zero-reporting.** Never report a count of zero to anyone outside the
   campaign. Absence of sign-ups is itself information about protected activity.
3. **No center-level reporting to the sponsor at all**, at any denominator. The
   sponsor's interest in the policy is commercial; its interest in which centers
   performed is not one the firewall should serve.
4. **Internal-only rollups.** Attribution below the suppression threshold may
   exist inside the campaign's own systems for operational purposes. It must be
   access-controlled and must never be the basis of a communication to a center.
5. **Write the threshold into the privacy notice** — a checkable promise, like
   the firewall claim, and cheap to keep.

Whether any center-level figure has already been shared with an owner, director,
or the sponsor should be established. If so, that is a separate conversation.

### 4.5 Consent is not transferable

CTIA § 5.1.2.2 provides that an opt-in is not transferable or assignable and
applies only to the specific campaign and sender that obtained it. Combined with
the firewall in §4.3:

- Phone numbers and email addresses may not be passed to a coalition partner, a
  state or national affiliate, a sibling entity, the sponsor, or a vendor sending
  under its own brand.
- A vendor sending **on behalf of** the named sender, under the sender's
  registered brand, is fine. A vendor sending as itself is not.
- If any partner sharing is contemplated, it must be disclosed at the point of
  consent, by name, before the first record is collected. Retrofitting is not
  possible — existing consents would not cover it.

If the answer is "not currently, but possibly later," the answer is still no as
to existing records.

---

## 5. Home address explanation

### Currently live, unchanged

> We use this only to find which state legislators represent you. Legislators
> weigh messages from their own constituents most heavily.

Positioned immediately **before** the address fields, not after. This is accurate
to the implementation: the address is geocoded for district matching and is not
used for any other purpose.

The language is good. Two changes to the implementation behind it:

1. **Discard the address after geocoding.** If the address exists solely to
   derive a district, then once the district is derived the address is pure
   liability: it is "personal information" for purposes of Georgia's breach
   statute, it enlarges every subsequent disclosure and deletion obligation, and
   it is the field most likely to make a breach notifiable. Store the district
   identifier plus ZIP and drop street address, immediately or on a short timer.
   This also makes the §5 sentence literally rather than substantially true.
   Confirm first whether the address is needed for anything else — printed
   constituent letters, legislator-office verification, deduplication. If it is,
   the sentence is not accurate as written and must change.
2. **Disclose the geocoding vendor.** The address leaves the system to reach a
   third party. The privacy notice must say a third-party geocoding service is
   used, and the vendor contract must carry the 24-hour notification obligation
   that O.C.G.A. § 10-1-912 imposes on third-party service providers who discover
   a breach. The same applies to the ESP and, later, the SMS provider.

---

## 6. Privacy notice

The full notice is live at `/privacy` and is reproduced by the running code
rather than duplicated here — read it at the URL so you review what visitors
actually see.

It was written against the implementation field by field rather than from a
template. Every factual claim traces to a specific table or module, listed in the
file header of `app/privacy/page.tsx`. If the data handling changes, the notice
changes with it. That method is correct and should be preserved; the notes below
are corrections and additions rather than a rewrite.

### 6.1 The notice's governing-law premise is stale

The notice was drafted assuming Georgia has no comprehensive privacy statute.
Georgia enacted one during the 2026 session: **SB 111, the Georgia Consumer
Privacy Protection Act, Act 462, signed 2026-05-11, reported effective
2026-07-01.**

The enrolled text must be read directly, because secondary reporting conflicts
materially:

- One line of reporting gives thresholds of **$25M revenue plus 175,000 Georgia
  residents**, or 25,000 residents with more than 50% of revenue from data sales,
  and states that **nonprofits are exempt**.
- Another gives **100,000 Georgia consumers**, or 25,000 plus 25% of revenue from
  data sales, with no nonprofit exemption stated.
- At least one national law-firm survey published in July 2026 does not list
  Georgia among the states with comprehensive privacy laws at all.

The bill was substantially amended by House substitute in March 2026, which
likely explains the divergence — much of the available commentary describes the
introduced version.

On any of these readings a campaign of this size is outside the thresholds, and
if the nonprofit exemption is real it is outside on that ground too. But the
notice cannot state that Georgia has no privacy law, and any sentence to that
effect must come out.

**Preferred approach: the notice should not characterise the state of Georgia law
at all.** Describe what the campaign does and what rights it offers. Do not make
representations about statutory coverage that go stale in a legislative session.

### 6.2 The employer firewall claim

The notice states plainly that employers, owners, managers, and the sponsor never
receive individual sign-up information. That is true of the current build. It is
a strong, checkable promise, and it should not be made unless the campaign
intends to keep it permanently.

Keep it, and **extend it to cover the attribution suppression threshold** in
§4.4. A promise that no *individual* information flows back is incomplete if a
small-denominator aggregate discloses the same thing.

### 6.3 Retention

The notice commits to re-confirming or deleting after 24 months of inactivity.
**That job is not built.**

**The sentence comes out now; the job gets built on its own schedule.** A privacy
notice describing a practice the system does not perform is a misrepresentation
to consumers — an FTC Act § 5 deception theory and a Georgia Fair Business
Practices Act theory, O.C.G.A. § 10-1-390 et seq., enforceable without anyone
being harmed. It is also the most common way small organisations get into privacy
trouble: not by doing something bad with data, but by describing a program they
have not built.

Interim language — intent, not practice, and no date certain:

> We do not keep information longer than we need it. We are building a process to
> re-confirm or delete the records of supporters who have been inactive for an
> extended period.

Restore the specific commitment when the job ships, not before.

**The same test applies to every other sentence in the notice.** Walk it line by
line against the build and ask, of each sentence, "does the code do this today?"
— not "will it." The file-header tracing method in `app/privacy/page.tsx` makes
this a short exercise. It should be a release gate, not a one-time review.

### 6.4 Breach notification

The notice references Georgia law generally rather than citing a statute. That is
the right drafting choice and should be kept — notices that cite statutes go
stale and invite arguments about whether the citation is right.

The obligations behind it, for the build team rather than the notice:

- **O.C.G.A. §§ 10-1-910 to -912.** Applies to any entity maintaining
  computerised personal information about Georgia residents. **No size
  threshold** — unlike the new privacy act, this reaches the campaign now.
- **Trigger:** unauthorised acquisition of **unencrypted** personal information.
  Encryption at rest for the address and phone fields materially reduces the
  chance of a notifiable event, and is worth doing on that basis alone.
- **Timing:** "most expedient time possible and without unreasonable delay." No
  fixed day count.
- **Third-party service providers must notify within 24 hours** of discovery.
  This belongs in the geocoding, ESP, and SMS vendor contracts (§5).
- If more than **10,000** Georgia residents are affected, the nationwide consumer
  reporting agencies must also be notified.
- **No Attorney General notification requirement** in the current statute.
  Whether SB 111 added one should be confirmed.

A **written incident response procedure** should exist before launch. One page is
enough. The statute's "without unreasonable delay" standard is judged against
what the organisation could have done, and an organisation inventing a process
during an incident does badly on that measure.

### 6.5 Rights language

The notice offers access, correction, deletion, and opt-out to everyone rather
than only to residents of states that mandate them. The stated reasoning was that
this is simpler to administer and cannot be wrong by being too generous.

**It can be wrong by being too generous.** A promise of rights is a promise of
performance. If the campaign commits to deletion but cannot actually delete a
record from the ESP, the SMS provider, backups, and the analytics store within
the timeframe implied, the generous promise creates an exposure the narrow one
would not. This is §6.3 wearing a different hat.

Keep the universal offer — the policy is right — and make it survivable:

1. **State a response window the campaign can hit**, and hold to it. 45 days is
   the common statutory standard and is achievable.
2. **Name the exception for consent records.** `consent_events` is append-only by
   design and must be: those rows are the campaign's evidence of what a person
   agreed to. The notice must say plainly that the record of a person's consent
   is retained even after their contact information is deleted, and why. A
   deletion promise that silently does not cover consent records reads as a lie
   after the fact, and is entirely defensible when disclosed.
3. **Confirm that deletion actually propagates** to every downstream system
   before the notice promises it does.

### 6.6 Effective date and change notification

The notice should carry an **effective date and a version identifier**, and prior
versions should be retained and reachable. This is less a legal requirement than
the same logic already governing `consent_events`: the campaign needs to prove
what a visitor saw on a given date. It is inconsistent to hash consent strings for
exactly that reason and then serve an undated privacy notice.

The existing commitment — "we will tell subscribers by email before significant
changes take effect" — is above market. Keep it, and ensure a process exists to
honour it, per §6.3.

---

## 7. Questions only counsel can answer

Answers are supplied where the research is now clear. What remains genuinely open
is marked as such.

**1. Has Georgia enacted a comprehensive consumer privacy statute?**
**Answered: yes.** SB 111, the Georgia Consumer Privacy Protection Act, Act 462,
signed 2026-05-11, reported effective 2026-07-01. The campaign is very likely
outside its scope on thresholds and possibly exempt as a nonprofit, but this must
be confirmed against the enrolled act — secondary reporting on thresholds and on
the nonprofit exemption conflicts, and the bill was substantially amended by House
substitute. See §6.1. Separately, Georgia's breach statute, O.C.G.A.
§§ 10-1-910 to -912, applies to the campaign **now**, with no size threshold. See
§6.4.

**2. Are out-of-state supporters in scope?**
**Open, and now more pointed.** Several state privacy statutes reach residents
wherever the controller sits, and the form does not restrict to Georgia
residents. The mini-TCPA landscape has also become a larger practical litigation
exposure than the federal TCPA — Florida, Oklahoma, Maryland, and Washington have
active plaintiff bars, and Texas SB 140 extended its telemarketing statute to
text messages with a private right of action. Determine whether the campaign
wants out-of-state sign-ups at all. If they are not useful for constituent
contact, restricting the form to Georgia addresses avoids the entire question.

**3. Who is the sender of record?**
**Open, and the top blocker.** The site says "Paid for by Georgia Licensed Child
Care Network" and carries True North Strategies' Alpharetta address. If the
Network is not itself a registered entity, the disclosure may need to name the
funding organisation.

This blocks, at minimum:

- the email footer and postal address (§1);
- the "Paid for by" line;
- Twilio A2P brand registration, which must match the sender identity shown on
  the website (§2.4);
- the TCPA analysis itself, because the tax-exempt nonprofit carve-out at
  47 C.F.R. § 64.1200(a)(2) turns on the sender's tax status (§2.1);
- whether CAN-SPAM applies, for the same reason plus the sponsor question at Q9.

Three Georgia-specific points bear on it:

- **There is no general "Paid for by" requirement for pure issue advocacy in
  Georgia.** The attribution provision, O.C.G.A. § 21-5-34(f)(3), is triggered by
  an independent committee financing a communication "intended to affect the
  outcome of an election." Legislative advocacy that does not support or oppose a
  candidate or ballot question is outside it. The line is therefore voluntary,
  which means it can and should be made accurate rather than defended as
  required. Confirm the campaign is not doing anything touching candidates or a
  ballot question, now or in the session ahead.
- **Georgia lobbyist registration is a live question with personal exposure.**
  O.C.G.A. § 21-5-70(5)(A) reaches a natural person who receives or anticipates
  receiving **more than $250 in a calendar year** as compensation for promoting or
  opposing legislation before the General Assembly; (5)(B) reaches lobbying
  expenditures over $1,000. Practitioners differ on whether grassroots lobbying —
  asking members of the public to contact legislators — falls within "promoting"
  legislation, and there appears to be no controlling Georgia appellate authority;
  the Alliance for Justice's Georgia guide reads it as covered. If paid staff time
  creating and distributing these action alerts counts, the $250 threshold is
  trivially crossed, and registration is **individual, not organisational**. This
  needs an answer before the next legislative session.
- **The Georgia Charitable Solicitations Act is not triggered today but is one
  button away.** "Solicit" under O.C.G.A. § 43-17-2 means requesting money,
  credit, property, financial assistance, or any other thing of value. Collecting
  advocacy sign-ups is not solicitation. The moment a donate button appears on the
  confirmation page or in a follow-up email, registration with the Secretary of
  State is triggered unless an exemption applies — the most likely being the
  under-$25,000 exemption at § 43-17-9. Whoever owns the roadmap should know this,
  because it will not look like a legal decision when someone makes it.

**4. Does the employer-distribution model need its own consent or disclosure?**
**Partly answered; the harder half is design, not disclosure.** See §4. Consent
from the employee is not the issue — the issue is the employer's conduct and what
the employer can observe. A one-page written instruction sheet for participating
owners and directors should be produced, covering §3's poster mechanics. Counsel
should decide whether participating centers acknowledge it in writing. That sheet
is also the campaign's best evidence if a charge is ever filed.

**5. Is the SMS consent text sufficient for TCPA express written consent, and is
that even the applicable standard for issue advocacy?**
**The second half is answered: no, on the facts as described.** 47 C.F.R.
§ 64.1200(a)(1) governs — prior express consent — because pure legislative
advocacy is not telemarketing under § 64.1200(f)(13), and because
§ 64.1200(a)(2) carves out messaging by or on behalf of a tax-exempt nonprofit.
**That carve-out depends on Q3.** On the first half, the recommended text in §2 is
sufficient, subject to the revocation build in §2.3 actually existing.

**6. Is the 24-month retention commitment right, and should it be built before
launch or the language softened?**
**Soften now; build on its own schedule.** See §6.3. Whether 24 months is the
right number is secondary to the fact that the sentence currently describes
something that does not happen.

**7. Should the privacy notice carry an effective date and a change-notification
commitment?**
**Yes to the effective date and version history.** The existing
change-notification commitment is already stronger than required; keep it and
ensure it is operationally real. See §6.6.

**8. Is the sending entity tax-exempt, and under which subsection?**
501(c)(3) versus 501(c)(4) versus for-profit changes the TCPA analysis (§2.1),
the CAN-SPAM analysis (§1), the permissible volume of lobbying, and whether a
501(h) election is needed. This is a prerequisite to Q3 rather than a separate
question, and nothing in the packet answers it.

**9. Does any message promote the sponsor's commercial interest?**
The program asks people to contact legislators about a policy in their employer's
commercial interest, and True North Strategies' address appears on the site.
Confirm that no message, landing page, or follow-up promotes, names favourably,
or links to a for-profit sponsor's products or services. If one does, the message
may become a "commercial electronic mail message" under 15 U.S.C. § 7702(2)(A)
and an "advertisement" for TCPA purposes, and the analysis in §1 and §2 shifts to
the strict regime. This is a content-governance question as much as a legal one
and should be written into the review process for outbound copy.

**10. What are the consent record-retention and evidentiary requirements?**
See §8.2. The current build hashes the text, which is good and unusual. It does
not appear to capture the surrounding metadata that makes a consent record
provable.

---

## 8. If the language changes

1. Update the strings in `lib/consent.ts`. Nothing else needs touching — the hash
   is computed from the text.
2. Existing `consent_events` rows keep their original text and hash. That is
   correct and required: they record what those people actually saw.
3. Re-read `CLAUDE.md` guardrails 1–3 before editing. In particular, consent
   records are append-only, and the two checkboxes stay separate and unticked.
4. Update `/privacy` in the same pass if the change affects data handling, so the
   notice and the system never describe different things.
5. Increment a `form_version` value stored on each consent row, so a record can be
   tied to a specific deployed version of the form and not only to a text hash.
6. Add the change to a version history reachable from `/privacy` (§6.6).

### 8.2 What a consent record should contain

Storing the verbatim text and its hash is the hard part and is already done. The
rest is cheap, and without it the hash proves what the string was but not that a
particular person agreed to it:

- **Timestamp** (UTC, with the displayed local time if it differs)
- **IP address** and **user agent** at submission
- **`form_version`**, per §8.5
- **The URL of the page**, including the center attribution parameter
- **Which boxes were checked**, stored separately per channel — never a single
  combined consent flag
- **Double opt-in confirmation** for email, and the confirmation timestamp, once
  sending begins
- **Full text and hash of the Privacy Notice version in force at the time**, or a
  pointer to it

This matters because "signature" for consent purposes includes an electronic
signature valid under the E-SIGN Act, 15 U.S.C. §§ 7001 et seq., and what makes a
checkbox an electronic signature is the surrounding evidentiary record, not the
checkbox. It also matters because *IMC* makes the litigable question "what did
this person clearly and unmistakably agree to," and the metadata is how that gets
answered.

**Retention:** consent records should outlive the contact record and should
survive a deletion request, disclosed per §6.5(2). A common period is the
limitations period plus a margin; the TCPA's is four years, 28 U.S.C. § 1658. The
retention period should be confirmed with counsel.

---

## 9. Recommended sequence

Items 1–3 are build work and do not require a lawyer to unblock.

### Before anything else

1. Hide the SMS checkbox (§2.4). Quarantine SMS consents already collected.
2. Apply the attribution suppression threshold (§4.4).
3. Remove the 24-month retention sentence from `/privacy` (§6.3).

### Before launch

4. Resolve sender of record and tax status (§7 Q3, Q8).
5. Re-read `/privacy` line by line against the build (§6.3); remove any
   characterisation of Georgia statutory coverage (§6.1).
6. Add the effective date and version history (§6.6).
7. Add a postal address to the email footer (§1).
8. Vendor contracts: 24-hour breach notification (§5, §6.4).
9. Owner/director instruction sheet (§3, §7 Q4).
10. Consent record metadata (§8.2).
11. Written incident response procedure (§6.4).

### Before the first SMS send

12. A2P 10DLC brand and campaign registration matching the resolved sender.
13. Global suppression list, all seven revocation keywords, non-exclusive
    revocation channels, working HELP (§2.3).
14. Confirmation/welcome message meeting CTIA § 5.1.2.1.

### Before the next legislative session

15. Georgia lobbyist registration determination (§7 Q3).

---

## 10. Authorities

**Federal statutes and rules.** 47 U.S.C. § 227; 47 C.F.R. § 64.1200,
particularly (a)(1), (a)(2), (a)(10), (f)(9), (f)(13), (f)(15)(iii); 15 U.S.C.
§§ 7701–7713, particularly §§ 7702(2), 7702(17), 7704; 16 C.F.R. Part 316;
15 U.S.C. §§ 7001 et seq. (E-SIGN); 29 U.S.C. §§ 157, 158(a)(1); 28 U.S.C.
§ 1658.

**Cases and agency decisions.** *Insurance Marketing Coalition Ltd. v. FCC*,
No. 24-10277 (11th Cir. Jan. 24, 2025); *Facebook, Inc. v. Duguid*, 592 U.S. 395
(2021); *McLaughlin Chiropractic Assocs. v. McKesson Corp.*, 606 U.S. ___ (2025);
*Eastex, Inc. v. NLRB*, 437 U.S. 556 (1978); *Amazon.com Services LLC*, 373 NLRB
No. 136 (2024); FCC Orders FCC 24-24, DA 25-312, DA 25-621, DA 26-12.

**Georgia.** SB 111 / Act 462 (2026), the Georgia Consumer Privacy Protection
Act; O.C.G.A. §§ 10-1-910 to -912; O.C.G.A. § 10-1-390 et seq.; O.C.G.A.
§ 21-5-34(f)(3); O.C.G.A. § 21-5-70(5); O.C.G.A. §§ 43-17-2, 43-17-9; O.C.G.A.
§ 46-5-27 (telephone solicitation — voice-only on its face and limited to
commercial purposes; not applicable to this program).

**Industry.** CTIA Messaging Principles and Best Practices (May 2023), §§ 5.1.1,
5.1.2.1, 5.1.2.2, 5.1.4; A2P 10DLC / The Campaign Registry brand and campaign
vetting requirements; Google, Yahoo, and Microsoft bulk-sender requirements.

**Not independently verified.** The enrolled text of Georgia Act 462, including
thresholds and any nonprofit exemption; the exact date and terms of FCC Order
DA 26-12; whether the NLRB has acted on the General Counsel's May 2026 motion
regarding *Amazon.com Services*; whether any CTIA Messaging Principles version
supersedes May 2023.
