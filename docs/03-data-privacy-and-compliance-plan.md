**TRUE NORTH STRATEGIES**

**Data Privacy & Compliance Plan**

*Consent, contact-law compliance, and safeguards for supporter data*

Georgia Child Care Grassroots Activation Initiative \| August 2026 \|
Internal Working Document — Draft for Discussion

*This plan sets the guardrails for collecting and using supporter PII —
home addresses, personal phone numbers, and employer affiliations. It is
a working program document, not legal advice; counsel should review the
consent language and the employer-solicitation guardrails before
launch.*

1\. Principles

- **Minimum necessary:** every field collected has a stated operational
  use (Doc 02, §2); nothing else is collected.

- **Voluntary, always:** enrollment and every subsequent action are
  voluntary, and materials say so. No manager may be given
  individual-level visibility into who has or has not enrolled or acted.

- **No surprises:** supporters are told at sign-up exactly what contact
  they will receive and can stop it at any time.

- **Supporter data is never sold, rented, or shared** outside the
  sponsoring organization and its engaged consultants.

2\. Consent at Sign-up

Email consent (checkbox 1, unticked by default)

*“I agree to receive email updates and action alerts about child care
policy in Georgia. I can unsubscribe at any time.”*

SMS consent (checkbox 2, unticked by default)

*“I agree to receive recurring text message alerts (including autodialed
messages) about child care policy at the mobile number I provided.
Consent is not a condition of participation. Message and data rates may
apply. Reply STOP to cancel, HELP for help.”*

Sign-up must succeed with email consent alone; SMS is additive. Store a
timestamped consent record (what was shown, what was checked, when, from
what IP).

3\. Contact-Law Compliance

| **Regime**                         | **What it requires here**                                                                                       | **Implementation**                                                                                                         |
|------------------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| TCPA (texts/calls)                 | Prior express written consent for autodialed texts to cell phones; honored opt-outs                             | Separate SMS checkbox (§2); STOP keyword auto-processed by SMS provider; quiet hours (8am–9pm local); consent log retained |
| CAN-SPAM (email)                   | Truthful sender identity, physical postal address in footer, working unsubscribe honored promptly               | Standard footer template; suppression list enforced at the sending platform                                                |
| Georgia lobbying/ethics disclosure | Grassroots activity backed by a corporate sponsor may intersect with lobbyist registration and disclosure rules | Counsel to advise on registration posture and any disclaimer language before Phase 3 campaigns                             |

4\. Employer-Context Guardrails

Because recruitment runs through workplaces, the program must never look
— or be — coercive:

- All distribution materials carry: “Participation is completely
  voluntary and has no effect on your employment.”

- No individual-level enrollment or action data is reported to owners,
  managers, or the sponsor; reporting is aggregate only (counts by
  district, center, role).

- No sign-up during mandatory meetings as a condition of anything; the
  QR poster and forwardable email are passive channels.

- Counsel reviews the model against labor-law and political-solicitation
  considerations before the recruitment drive.

5\. Data Security

| **Control**       | **Standard**                                                                                                                              |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Encryption        | TLS in transit; encryption at rest for the database and backups                                                                           |
| Access            | Named accounts only, role-based; home addresses and phone numbers visible only to campaign administrators                                 |
| Exports           | Logged (who, what segment, when); exported files expire from shared storage on a schedule                                                 |
| Vendors           | SMS/email/geocoding providers bound by their standard DPAs; list kept in the program record                                               |
| Incident response | Any suspected breach: contain, assess scope, notify sponsor within 24 hours; Georgia breach-notification statute governs supporter notice |

6\. Retention and Hygiene

- Supporter records retained while the program is active; supporters
  inactive for 24 months are re-consented or purged.

- Deletion on request, honored within 30 days, including from campaign
  exports still in circulation.

- Annual data-hygiene pass: bounced emails, dead numbers, movers
  (district re-match).
