# Design brief — Claude Design

*Georgia Licensed Child Care Network sign-up site · True North Strategies*

**How to use this file:** paste the "Brief" section below into Claude Design at
claude.ai/design as your opening prompt. Everything above it is context for
whoever is running the session. Keep §"Hard constraints" intact when you paste —
those items are compliance requirements, not design preferences, and a design
that breaks one of them cannot ship.

---

## Context for the operator (do not paste)

The site is a single-purpose conversion page. One job: get a licensed child care
worker who scanned a QR code in a break room to complete an 18-field form on
their phone and hit submit. Everything in the design serves that or gets cut.

Two things make this harder than a normal lead form:

1. **The form is long and it asks for a home address.** People hesitate. The
   design has to earn that address before asking for it, and explain why in the
   moment of asking.
2. **It is distributed through employers.** If it looks like an HR mandate,
   participation is both legally risky and practically worse. It must read as an
   invitation from peers, never a directive from a boss.

The engineering scaffold already exists (Next.js + Tailwind, navy/gold
placeholder tokens in `tailwind.config.ts`). Output from Claude Design should be
a component set we can map onto `components/SignupForm.tsx` and `app/page.tsx`.

Open decision that affects branding: **the sponsoring entity is not confirmed.**
Design to a neutral coalition identity ("Georgia Licensed Child Care Network")
with a swappable wordmark slot. Do not bake in a company logo.

---

## Brief (paste from here down)

Design a mobile-first sign-up website for a grassroots advocacy campaign
organizing Georgia's licensed child care community.

### Who uses it

A child care teacher, center director, or center owner in Georgia. Most arrive
by scanning a QR code on a break room poster, on their own phone, on a break,
with maybe two minutes. Some are on older Android devices. Many have never
contacted a legislator before and don't know who theirs is.

Design for the teacher on the phone first. Desktop is secondary and can be a
centered single column — do not design a wide marketing layout with columns and
feature grids.

### What it does

They read a short explanation, fill out a form (name, email, cell phone, home
address, employer name and address, job role), tick a consent box, and submit.
On success they immediately see which Georgia House and Senate districts they
live in — that moment is the emotional payoff and should be designed as the
reward it is, not as a generic "thanks, we got it" state.

### Tone

Serious, warm, credible. This is a professional community asserting itself, not
a petition site and not a political attack campaign. Think "state professional
association" more than "advocacy nonprofit."

Specifically avoid: stock photos of smiling children, primary-color playfulness,
crayon or alphabet-block motifs, urgency countdown patterns, aggressive
red-alert framing, anything that reads as partisan.

Lean toward: confident typography, generous whitespace, a restrained palette,
real texture from type hierarchy rather than decoration.

### Palette and type

Navy and gold, per True North Strategies branding. Current placeholder tokens:

- Navy: `#0f2340` (900), `#1e3a5f` (700), `#3f5f8a` (500), `#9fb2cd` (300), `#e3e9f2` (100), `#f2f5f9` (50)
- Gold: `#9a7b18` (700), `#c9a227` (500), `#e8c97a` (300)

Treat gold as an accent only — rules, focus rings, small emphasis marks. Gold
should never carry body text or large fills; at these values it fails contrast
against white. Navy 900 on white or navy 50 is the workhorse pairing.

Propose a type pairing (one display face for the headline, one highly legible
face for form labels and body) and show it at phone sizes, not just desktop.

### Screens to design

1. **Landing + form (one page, one scroll).** Do not split into a multi-step
   wizard unless you can show the completion argument for it — an extra tap
   between a break-room QR scan and submission is a real cost.
2. **Success state** with matched districts. This is the highest-value screen in
   the system. Design it properly: which House district, which Senate district,
   and a clear "share this with a coworker" moment.
3. **Error states** — field-level validation, and a failed-submission banner.
4. **QR poster** (letter size, for break room walls). Needs to work at three
   feet: headline, one line of explanation, big QR, the voluntary-participation
   line.

### Components needed

Form field (text, with label / required marker / error / helper text), select,
checkbox with long wrapping legal text, primary button with loading state,
section divider with heading, notice/callout box, district result card, and the
footer disclosure block.

### Hard constraints — a design that breaks these cannot ship

1. **The two consent checkboxes are separate and both start unchecked.** They
   cannot be combined into one, pre-checked, styled as a toggle, or visually
   de-emphasized. The SMS one carries about 55 words of legally required text
   that must be fully visible — no truncation, no "read more" collapse, no
   scroll box, no reduced contrast. Design the checkbox component to hold a
   long paragraph gracefully, because it will have to.
2. **The form must be completable and submittable with the email checkbox alone.**
   Nothing in the layout may imply SMS is required.
3. **"Participation is completely voluntary and has no effect on your
   employment"** appears on the landing screen and on the poster, in readable
   body size — not footnote-small, not gray-on-gray.
4. **The home address field needs an inline explanation** of why it's collected
   ("we use this only to find which legislators represent you") positioned so
   it's read before the field, not after.
5. **Footer carries sponsor identity and a physical postal address** (CAN-SPAM).
   Design the slot; content is TBD. Include an unsubscribe link.
6. **Inputs render at 16px minimum** so iOS Safari doesn't zoom on focus.
7. **Touch targets 44px minimum.** Checkboxes especially — the whole label row
   should be tappable.
8. **WCAG AA contrast throughout**, including placeholder text, helper text, and
   the disabled button state.
9. **No individual-level social proof.** No "Dana from Sunrise Learning just
   signed up," no visible participant names, no per-center leaderboards. Aggregate
   framing only ("providers in 42 districts have joined") and even that is
   optional.

### Deliverable

A component library I can map onto a Tailwind + React implementation: tokens
(color, type scale, spacing, radius, shadow), the components listed above with
their states, and the four screens assembled from them. Show the form at 375px
width as the primary artboard.
