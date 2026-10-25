---
language: en
banned:
  - "I'm excited"
  - "I am excited to"
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
  # L1 openers
  - "I am writing to apply"
  - "I am writing to express my interest"
  - "I saw your job posting"
  # L2 closers
  - "please find my resume attached"
  - "at your convenience"
  - "I would love the opportunity"
soft_banned:
  - "delve"
  - "seamless"
  - "robust"
  - "ensure"
  # L4 overclaim and flattery
  - "exceptional addition"
  - "uniquely positions me"
  - "I love what you're building"
  - "your mission resonates"
  - "most exciting companies"
# L3 self-deprecation, checked by script (voice/self-deprecation)
self_deprecation:
  - "I may not have"
  - "on the off chance"
  - "I know I may not"
banned_patterns:
  - exclamation mark
  - rhetorical question (a client's question used verbatim as a header is not one)
  - first person plural ("we", "our team")
  - self-descriptive adjective or title ("senior", "lead", "expert", "experienced")
  - self-deprecation ("I may not have", "on the off chance", "I know I may not")
  - apology
  - contrastive negation ("X, not Y", "never Y", "rather than Y", "nothing changes")
  - a run of six or more words copied from the posting, ask headers excepted (L5, warn)
  - Markdown syntax ("**", "*", "_", "#", "[text](url)", ">")
  - emoji
  - ALL-CAPS word or line
  - email, phone, messenger handle, social handle, booking link
---

# Voice rules

Profile-independent, route-free rules for every Letter: the proposal on the freelance route and the cover letter on the employment route. Structure is not here: which Slots a Letter has, their order, headers, and every length cap live in the route's template (`templates/letter-freelance.md` or `templates/letter-employment.md`) and the Slot catalogue `templates/letter-slots.md`. Personal parts (greeting per route, sign-off, extra phrases, language variant) live in the Profile's `voice.md`. `proposal` applies all three; `verify` enforces the machine-checkable parts, reading the caps from the route's template.

## Goal

The Letter reads as a person who knows what they are doing and is reliable, without promises. Every sentence carries a fact or a concrete step. Nothing is filler.

## Facts and confidence

- Confidence comes from facts, never from adjectives. No seniority, title, or self-assessment words; a role title only where the route's template allows one. No self-deprecation either: a Gap is never named, and the nearest work done stands on its own.
- A cited fact is a product name with URL, a role, a period in years, or one or two concrete things done there that match the Job; the route's template narrows which of these a Slot may cite. Role and period are cited when the Project has them. Ownership or authorship of a Project is always stated when its role says so: it is the strongest fact a product can carry.
- Not cited: commit counts, percentages, team size, awards.
- No arithmetic for the reader: no derived total, no monthly or annual extrapolation, no comparison the reader did not ask for.
- Every fact traces to a Project file `profile/projects/<slug>.md` (its frontmatter meta, its Overview, a Bullet by its key, or a line of `## Notes`) or to an Answer in `profile/answers/`. When the Letter needs a fact the Profile lacks, `proposal` asks the human for it once, appends it under `## Notes` of the matching Project file, and only then writes the Letter. The Letter holds no fact the Profile lacks.
- The Letter is written in its own words: a run of six or more words copied from the posting reads as an echo (`voice/posting-copy`, warn). An ask header copies the client's question on purpose and is exempt.

## Formatting

Plain text. Short paragraphs separated by one blank line. Lists as lines starting with `-` or `1.`, only where the route's template allows one. Bare `https://` URLs to pages without a contact form; links to relevant work are not capped. No Markdown, no emoji, no ALL-CAPS, no leading indentation, no contact details or off-platform links: the freelance platform carries contact on that route, the application form and the PDF on the employment route.

## Rhythm

Short sentences, one idea each, active voice, present tense where true. No stacked clauses. Two rhythm rules are checked: a line with two or more semicolons (`voice/semicolon-chain`, script) and a sentence built on a contrast with what is not done (`voice/contrast-negation`, model): state what is done and stop.

## Enforcement split

`verify` fails on: banned phrases, self-deprecation, banned patterns, Markdown, contact details, untraceable fact, and every structure and length rule of the route's template (a Slot over its cap, a missing Slot header, more or fewer than one plan Slot, prose over the template's word cap, a Letter over the template's `cap`).

`verify` warns on: soft-banned words, semicolon chains, contrastive negation, posting copy (the model rewrites the sentence; the Letter is not rejected).

The full Check list, Fix kinds, and the review-and-fix cycle are in the Verify catalogue, `catalogue/verify.md`. `verify` applies Fixes to the Letter file itself; it does not hand a report back to `proposal`.

Rhythm, density, and the quality of the opening Slot (Hook Slot or intro) are model judgment, checked by the human at the Letter review.

## Profile `voice.md`

Hard rules and preferences only (`profile/schemas/voice.schema.json`):

```yaml
language: en-US          # en-US | en-GB
greeting:                # line 1 of every Letter, per route
  freelance: "Hi,"
  employment: "Hello,"
sign_off: ""             # first name, rendered on both routes; this file owns it, profile.md carries no sign-off
banned_extra: []         # phrases added to the shared list
allowed_extra: []        # shared banned phrases this Profile permits
```

No body: the schema forbids one. The Answers in `profile/answers/` are the voice calibration, hand-written and polished; nothing a State writes calibrates the voice.
