---
fix_kinds: [patch, regenerate, remove, ask, stop, none]
cycle_cap: 3
regenerations_per_slot: 2
checks:
  # severity: fail | warn. fix: see fix_kinds. routes: the routes the Check runs on.
  - { id: voice/rhetorical-question,  severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/apology,              severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/contrast-negation,    severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: length/sentence-cap,        severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: terms/forbidden-promise,    severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: fact/untraceable,           severity: fail, fix: ask, routes: [freelance, employment] }
  - { id: fact/arithmetic,            severity: warn, fix: none, routes: [freelance] }
  - { id: job/demand-unanswered,      severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: job/mandatory-keyword,      severity: fail, fix: patch, routes: [freelance] }
  - { id: flag/safeguard-missing,     severity: fail, fix: regenerate, routes: [freelance] }
---

# Verify catalogue

`verify` is the last step. It reviews the Letter the way a code review reviews a diff, then applies the Fixes itself: `letter.md` after `verify` is the corrected Letter, never a report. The route's template (`templates/letter-freelance.md` or `templates/letter-employment.md`) sets its Slots and its caps. A Check is one named rule, judged by reading. A Finding is one violation of a Check in one Slot, `fail` or `warn`. A Fix is the change `verify` applies for a Finding. Each Check names the routes it runs on (`routes`); a Check whose `routes` lack the Candidate's route is skipped.

Portable across Profiles. Personal inputs (the banned phrases, terms) come from the Profile at run time.

## Inputs

- `letter.md` of the current Candidate: body only, no frontmatter. The Letter ends at the sign-off line; the milestone lines and the bid after it are not part of it, and an optional fenced `Sent` block is skipped. An empty `letter.md` on the employment route is a resume-only application: valid, with no Letter in it, and nothing is checked.
- `job.md`: `route`, `title`, `requirements`, the posting body (client facts, Job demands), and on the freelance route `flags`, from which the Alert Level and the Safeguards are read in the Flag catalogue, and `rate` when the person set one.
- Profile: `profile/profile.md` (`terms`), `profile/projects/<slug>.md` (traceability source: the frontmatter meta, the name, the Description, the Bullets by heading and the Notes), `profile/answers/<slug>.md` (a Letter source, cited as `answer <slug>`), `voice.md` (`banned_phrases`).
- Catalogues: voice rules, Slot catalogue, the route's template, Flag catalogue.

Nothing is stored. The report is session output; a Letter is final only after `verify` passes, so a stored pass carries no information.

## Checks

### voice

- `rhetorical-question`: a question the Letter answers itself or leaves for effect. A client's question used verbatim as a header is not one.
- `apology`: `sorry`, `unfortunately`, `I must admit`, and any sentence that apologises for a shortfall.
- `contrast-negation`: a sentence that defines the work by what it is not (`X, not Y`, `never Y`, `rather than Y`, `nothing changes`). Warn; the sentence is rewritten to state what is done.

### length

- `sentence-cap`: a prose Slot over its Slot `cap.sentences`, or a paragraph over `cap.each.sentences`. Warn.

### fact

- `untraceable`: a fact with no source. List every fact in the Letter (product name, URL, role, period, stack item, number, client quote) with its Slot and source: a Project's frontmatter field, its name, its Description, a Bullet by its heading or a Notes line, `answer <slug>` for an answer cited or tailored, a `profile.md` field, the `job.md` body for client facts, or `derived` for prices and due dates `scripts/proposal.ts milestones` computed from the person's answers and for timezone overlap. `derived` never covers a claim about the person (availability, willingness, a thing done) that no Profile line states. Fix: ask the human once whether the fact is true. True: append it as one line under `## Notes` of the matching `profile/projects/<slug>.md`, then regenerate the Slot. False or unknown: regenerate the Slot without it. No step edits a Description.
- `arithmetic`: a milestone price that is not its hours times the rate (`job.md` `rate`, else Profile `terms.rate`), or a bid that does not sum the funded milestones. Warn.

### terms

- `forbidden-promise`: a rate, a price or a total in the Letter body; subcontracting offered; a start before `terms.availability_from`; a delivery date the plan does not derive.

### job

- `demand-unanswered`: an explicit request in the Job (examples, stack, approach, availability, subcontracting, a specific question) that no Slot answers. Fix: regenerate `answers`, or the Slot the demand maps to. A demand that needs a fact the Profile lacks goes to the human as in `fact/untraceable`. On the employment route it counts only the demands a cover letter can carry (`intro`, `relevant_work`, `terms`); screening questions are form fields answered from the answers, never Findings.
- `mandatory-keyword`: Flag `mandatory-keyword` is in `flags` and the keyword appears anywhere in the Letter. Fix: patch the sentence to drop it. The Letter never complies with a keyword demand.

### flag

- `safeguard-missing`: a triggered risk Flag in `flags` with `slot` other than `none` whose Safeguard the target Slot does not state. `fail` at Alert Level 3 or 4, `warn` at 1 or 2. `plan` resolves to the plan Slot the Letter carries. Freelance only: no employment Flag has a Slot.

## Fixes

- `patch`: rewrite the offending sentence or line; the rest of the Slot stays byte-identical. Used for word-level Findings. Unbounded, re-checked every cycle.
- `regenerate`: refill the whole Slot from the template and the Profile; every other block stays byte-identical. Used when the Slot's content is wrong, not its words. Two regenerations per Slot per run; the third Finding on the same Slot stops.
- `remove`: delete the block and its blank line.
- `ask`: one question to the human, then one regeneration.
- `stop`: no Fix; the run ends with the report and the question.
- `none`: reported only.

## Cycles

One cycle: read every Check, apply the Fixes. Regenerated text can introduce new Findings, so cycles repeat until one pass reports zero `fail`. Cap three cycles; then the run stops with the open Findings listed.

## Report

Printed once, at the end, in this order:

1. Verdict line: `pass` or `stopped`, and the cycle count.
2. Fixes applied, one line each: Check id, Slot, before and after in one clause each.
3. Warnings left open.
4. Fact table: fact, Slot, source.
5. The Letter verbatim in a code block, ready to paste.
6. Every question block that matched no answer, listed by its question, with an offer to draft a new file under `profile/answers/` for it; a draft is printed only when the human says yes, its question worded for reuse across Jobs, and never written by the step.

On `stopped`: the same, plus the one question for the human. The human edits the Letter file or answers, then reruns `verify`.

## End of the Route

`pass` plus the human sending the Letter ends the Route: pasted into Upwork on the freelance route, sent with the application and the PDF on the employment route. No further step and no calibration: the answers in `profile/answers/` calibrate the voice, and `voice.md` has no body.
