---
language: en
banned:
  - "I'm excited"
  - "passionate"
  - "perfect fit"
  - "I have carefully read"
  - "I can assure"
  - "hit the ground running"
  - "leverage"
  - "cutting-edge"
  - "world-class"
  - "Dear"
  - "hope this finds you well"
  - "don't hesitate"
  - "look forward to hearing"
  - "extensive experience"
  - "proven track record"
  - "team of experts"
  - "guarantee"
  - "unlimited revisions"
  - "24/7"
soft_banned:
  - "delve"
  - "seamless"
  - "robust"
  - "ensure"
banned_patterns:
  - exclamation mark
  - rhetorical question (a client's question used verbatim as a header is not one)
  - first person plural ("we", "our team")
  - self-descriptive adjective or title ("senior", "lead", "expert", "experienced")
  - apology
  - contrastive negation ("X, not Y", "never Y", "rather than Y", "nothing changes")
  - Markdown syntax ("**", "*", "_", "#", "[text](url)", ">")
  - emoji
  - ALL-CAPS word or line
  - email, phone, messenger handle, social handle, booking link
---

# Voice rules

Profile-independent, route-free rules for every Letter: the proposal on the freelance route and the cover letter on the employment route. Structure is not here: which Slots a Letter has, their order, headers, and every length cap live in the route's template (a Family template `templates/letter-<family>.md` on the freelance route, `templates/letter-employment.md` on the employment route) and the Slot catalogue `templates/letter-slots.md`. Personal parts (greeting per route, sign-off, extra phrases, language variant) live in the Profile's `voice.md`. `proposal` applies all three; `verify` enforces the machine-checkable parts, reading the caps from the route's template.

## Goal

The Letter reads as a person who knows what they are doing and is reliable, without promises. Every sentence carries a fact or a concrete step. Nothing is filler.

## Facts and confidence

- Confidence comes from facts, never from adjectives. No seniority, title, or self-assessment words; a role title only where the route's template allows one.
- A cited fact is a product name with URL, a role, a period in years, or one or two concrete things done there that match the Job; the route's template narrows which of these a Slot may cite. On the freelance route, role and period only when Profile `voice.md` `cite_role_period` is true (the default). Ownership or authorship of a Project is always stated when its role says so: it is the strongest fact a product can carry.
- Not cited: commit counts, percentages, team size, awards.
- No arithmetic for the reader: no derived total, no monthly or annual extrapolation, no comparison the reader did not ask for.
- Every fact traces to a Project file `data/projects/<slug>.md`: its frontmatter meta or one of its Stories. When the Letter needs a fact the Profile lacks, `proposal` asks the human for it, appends it as a context line under the nearest Story of the matching Project file, and only then writes the Letter. The Letter holds no fact the Profile lacks.

## Formatting

Plain text. Short paragraphs separated by one blank line. Lists as lines starting with `-` or `1.`, only where the route's template allows one. Bare `https://` URLs to pages without a contact form; links to relevant work are not capped. No Markdown, no emoji, no ALL-CAPS, no leading indentation, no contact details or off-platform links: the freelance platform carries contact on that route, the application form and the PDF on the employment route.

## Rhythm

Short sentences, one idea each, active voice, present tense where true. No stacked clauses. Two rhythm rules are checked: a line with two or more semicolons (`voice/semicolon-chain`, script) and a sentence built on a contrast with what is not done (`voice/contrast-negation`, model): state what is done and stop.

## Enforcement split

`verify` fails on: banned phrases, banned patterns, Markdown, contact details, untraceable fact, and every structure and length rule of the route's template (a Slot over its cap, a missing Slot header, prose over the word cap, a Letter over the template's `cap`, a missing gaps Slot when a required item of the Job is outside the ledger's `shipped` Skills).

`verify` warns on: soft-banned words, semicolon chains, contrastive negation (the model rewrites the sentence; the Letter is not rejected).

The full Check list, Fix kinds, and the review-and-fix cycle are in the Verify catalogue, `catalogue/verify.md`. `verify` applies Fixes to the Letter file itself; it does not hand a report back to `proposal`.

Rhythm, density, and the quality of the opening Slot (Hook Slot or intro) are model judgment, checked by the human at the Letter review.

## Profile `voice.md`

Hard rules and preferences only (`scripts/schemas/voice.schema.json`):

```yaml
language: en-US          # en-US | en-GB
greeting:                # line 1 of every Letter, per route
  freelance: "Hi,"
  employment: "Hello,"
sign_off: ""             # first name, rendered on both routes; this file owns it, profile.md carries no sign-off
banned_extra: []         # phrases added to the shared list
allowed_extra: []        # shared banned phrases this Profile permits
cite_role_period: true   # freelance route only; false: relevant_work cites product name, URL and things done, no role or years
```

No body: the schema forbids one. The Answers in `data/profile/answers/` are the voice calibration, hand-written and polished; nothing a State writes calibrates the voice.
