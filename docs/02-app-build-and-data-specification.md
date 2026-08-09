**TRUE NORTH STRATEGIES**

**App Build & Data Specification**

*Sign-up platform, supporter database, and legislative district
matching*

Georgia Child Care Grassroots Activation Initiative \| August 2026 \|
Internal Working Document — Draft for Discussion

1\. Product Summary

A mobile-friendly web sign-up form (no app-store install) reached by
link or QR code, feeding a supporter database with automatic legislative
district matching and an admin dashboard for segmentation and campaign
export. Optimized for a teacher completing it on a phone in under 90
seconds.

2\. Data Collected

Collect the minimum needed to identify, district-match, and contact each
supporter. Every field below maps to a specific operational use; nothing
is collected without one.

| **Field**                             | **Required** | **Operational use**                                                                  |
|---------------------------------------|--------------|--------------------------------------------------------------------------------------|
| First / last name                     | Yes          | Identity; personalization of legislator contact                                      |
| Cell phone number                     | Yes          | SMS action alerts (separate express consent — Doc 03)                                |
| Phone number (other/landline)         | No           | Backup contact; patch-through call campaigns                                         |
| Email address                         | Yes          | Primary alert channel; one-click email-your-legislator actions                       |
| Home address (street, city, ZIP)      | Yes          | Legislative district matching; constituent verification when contacting legislators  |
| Employer (organization / center name) | Yes          | Segmentation by company and center; density reporting                                |
| Employer address                      | Yes          | Center-level mapping; a center's district also matters when its staff live elsewhere |
| Role                                  | Yes          | Activation laddering — see §2.1                                                      |
| Consent checkboxes (email, SMS)       | Yes          | Lawful contact basis — Doc 03                                                        |

2.1 Role field

Single-select, exactly as specified by the sponsor:

- Owner

- Regional manager

- Corporate staff director

- Teacher

- Other (free-text descriptor)

Role drives everything downstream: which asks a supporter receives, how
their voice is framed to a legislator (business owner vs. classroom
teacher), and how density reports are built.

3\. Build vs. Buy

| **Option**                                                                        | **Strengths**                                                                                                 | **Weaknesses**                                                                                                                                      | **Cost profile**                           |
|-----------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| Custom build (recommended) — Next.js form + Postgres, hosted on Vercel or similar | Full control of fields (employer, role), branding, district matching, and data ownership; no per-contact fees | TNS owns maintenance; SMS/email sending still needs a provider (Twilio, SendGrid)                                                                   | Low monthly hosting; build effort up front |
| Advocacy SaaS (Action Network, Phone2Action/Capitol Canary, VoterVoice)           | Legislator lookup, email-to-legislator, and compliance tooling out of the box                                 | Custom fields and role-based segmentation are clumsier; data portability and per-record pricing; some platforms restrict corporate-backed campaigns | Per-supporter or per-seat subscription     |
| Form tool + spreadsheet (Google Forms/Airtable)                                   | Fastest possible start; near-zero cost                                                                        | No district matching, weak consent management, unsuitable for PII at scale — acceptable only as a short pilot                                       | Minimal                                    |

Recommendation: custom build. The role and employer fields,
district-density reporting, and unconstrained data ownership are the
core of the strategy, and they are exactly what the SaaS platforms
handle worst. Reserve a SaaS platform decision for the
email-to-legislator delivery layer, which can be added later if needed.

4\. District Matching

- Geocode each home address at submission using the U.S. Census Bureau
  geocoder (free, no key) with a commercial fallback (Google/Mapbox) for
  addresses the Census service cannot resolve.

- Resolve point-in-polygon against Georgia House, Georgia Senate, and
  congressional district boundaries (TIGER/Line shapefiles, refreshed
  each cycle for redistricting).

- Store district assignments on the supporter record; re-run the batch
  when boundaries change.

- Match employer address the same way, so campaigns can target both
  where staff live and where centers sit.

5\. Admin Dashboard (v1)

- Supporter list with filters: role, employer, county, House/Senate
  district, consent status.

- District density view: supporters per district, broken out by role;
  exportable one-pagers per legislator.

- Campaign export: CSV of a filtered segment for the email/SMS provider.

- Audit basics: who exported what, when — exports of home addresses are
  the highest-sensitivity event in the system (Doc 03).

6\. Sign-up Flow

- Landing: one screen stating who is asking, why, and what the supporter
  is signing up for — in plain language.

- Form: the fields in §2, grouped contact → home address → employer →
  role; inline validation; address autocomplete to cut errors.

- Consent: two unticked checkboxes (email, SMS) with the exact language
  from Doc 03; sign-up succeeds with email-only consent.

- Confirmation: shows the supporter their matched legislators
  immediately (“Your Representative is …”) — the single best moment to
  make the program feel real — plus a shareable link/QR.

7\. Distribution Kit

- Per-center QR poster (break room) and a one-paragraph email
  owners/directors can forward — with mandatory voluntary-participation
  language from Doc 03.

- Unique link parameter per center so enrollment can be attributed
  without asking supporters anything extra.

8\. Environment and Credentials

All keys (geocoder fallback, SMS, email) are read from environment
variables; none are committed or pasted into chat. A .env.example in the
repository will document each variable and where Bernard should add the
value.
