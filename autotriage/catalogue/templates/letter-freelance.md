---
route: freelance
cap: { chars: 4500, prose_words: 350, total_words: 700 }
slots:
  - greeting
  - hook
  - { id: deliverables, plan: true }
  - { id: milestones, plan: true }
  - { id: working_model, plan: true }
  - relevant_work
  - answers
  - billing
  - terms
  - closing
  - sign_off
---

# Letter template: freelance

The proposal pasted into Upwork, selected by `route: freelance` in `job.md`. One template for every Job: `proposal` picks exactly one plan Slot from what the Job asks, and `verify` checks that exactly one is present (`slot/plan-count`). Order and the filling rules are in the Slot catalogue `letter-slots.md`, `Freelance route`.

Caps: 4,500 characters for the whole Letter, 350 prose words (header, list and `answers` lines excluded), 700 words in all.

## Picking the plan Slot

Read the Job, the triggered Flags first; model judgment, guided by cues, no keyword rule. The client's project type (greenfield, inherited code, live product) is a cue, not the answer.

- `deliverables`: assessment is the deliverable. The client offers or expects a paid review, a scoping phase, a second opinion or an architecture proposal before any build. Cues: `paid scoping`, `review`, `assessment`, `second opinion`, `do not submit a fixed-price bid`, `shortlist then paid assignment`; the green Flag `paid-first-milestone`; `free-discovery` inverts when the client pays for the discovery.
- `milestones`: the client wants something built or changed. Existing code with a bounded change list, a bug list, security concerns, a deadline (Flags `client-code-self-assessment`, `burned-before`, `subjective-acceptance`): the audit is milestone 1, then fixes by risk. Greenfield, or a rewrite where the existing code is not the starting point (`MVP`, `from scratch`, a feature list, no codebase mentioned, designs or a PRD provided, a fixed budget; Flags `fixed-price-unbounded`, `budget-scope-mismatch`): our own plan with prices. `partnership-anchor` never turns a bounded change list into a retainer; the future is priced at zero.
- `working_model`: live product, open-ended engagement, no bounded change list. Cues: `ongoing`, `retainer`, `hours per week`, `support`, `long-term maintenance`, an existing team, a product already in production. A Job that lists a bounded change set takes `milestones`.

Two plan Slots fit about equally: pick the one the client's own words lean to and say so in the session; the human corrects it at the Letter review. None fits: the posting is vague (`vague-posting`); `milestones` with scoping as milestone 1.

## Slot notes

- `deliverables`: a list only for three or more distinct artifacts; fewer, and the block is prose that names them in its first sentence. When the Job lists what the review should cover, answer that list in our own words, one artifact per line, never an echo of the client's items. When the Job has no list, four lines: findings ranked by severity, the map of what to keep, fix, or rebuild, effort and order for the next stage, assumptions and deferred items. The block closes with one to three sentences of prose: what the review does not touch, why a deliverable that carries a Safeguard gets its own hours, and how the next stage continues from the list, in one sentence and never priced.
- `milestones`, existing code: milestone 1 is a read-only audit with an hour cap and a ranked findings list; the client approves the scope of the rest from that list. Then fixes ordered by risk, highest first, each with an hour range as a cap. Five lines is the usual size; six is the ceiling. The Letter keeps the client's stack.
- `milestones`, greenfield: our plan, not the client's feature list. Milestone 1 is a thin end-to-end slice (one user, one path, deployed). Each line carries a price from the Profile rate, except on a client-priced test (no prices); weights uneven. When the posted budget covers a minimum viable scope at the Profile floor, deferred milestones are listed last and marked as deferred so the funded total fits the budget. Otherwise the plan ignores the posted budget. The stack rationale is one sentence inside the milestone that sets it, or an `answers` paragraph when the Job asks for a proposed stack.
- `working_model`: queue, acceptance rule, response window, weekly summary. Two or three sentences, all prose, no list.
- `relevant_work`: two Projects with `deliverables` and `working_model` (prefer ones where an existing system was read and judged, or long engagements on a live product), three with `milestones` (prefer the same concern class, or something built from nothing and shipped).
- `billing`: with `deliverables`, capped hours for the assessment, billed on actual, unused hours not billed, no rate unless the Job states neither budget nor rate. With `milestones` on existing code, hours are caps billed on actual; the audit may shrink or grow milestones 2 onward; each is re-quoted before it starts; when the posted budget is fixed and below the plan, state both figures and that milestone 1 fits inside the posted budget and prices the rest. With `milestones` greenfield, the funded total, what is deferred, acceptance against a written check per milestone; the rate appears here. With `working_model`, rate, weekly hours, billed weekly on actual hours, notice period; the rate appears when the Job states neither budget nor rate, otherwise hours and rhythm only.
- Legal and copyright topics enter only when the Job asks. Flags carry all risk; the plan Slot does not change the Alert Level.
