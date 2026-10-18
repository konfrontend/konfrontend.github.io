---
fix_kinds: [patch, regenerate, remove, ask, stop, none]
cycle_cap: 3
regenerations_per_slot: 2
checks:
  # by: script | model. severity: fail | warn. fix: see fix_kinds. routes: the routes the Check runs on.
  - { id: voice/banned-phrase,        by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/soft-banned,          by: script, severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: voice/exclamation,          by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/first-person-plural,  by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/self-descriptive,     by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/rhetorical-question,  by: model,  severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/apology,              by: model,  severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: voice/semicolon-chain,      by: script, severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: voice/contrast-negation,    by: model,  severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: format/markdown,            by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: format/emoji,               by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: format/all-caps,            by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: format/indentation,         by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: format/contact,             by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: format/url-count,           by: script, severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: format/url-list,            by: script, severity: warn, fix: none, routes: [freelance, employment] }
  - { id: format/char-ceiling,        by: script, severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: slot/parse,                 by: script, severity: fail, fix: stop, routes: [freelance, employment] }
  - { id: slot/missing,               by: script, severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: slot/extra,                 by: script, severity: fail, fix: remove, routes: [freelance, employment] }
  - { id: slot/header-missing,        by: script, severity: fail, fix: patch, routes: [freelance] }
  - { id: slot/header-second-person,  by: script, severity: fail, fix: patch, routes: [freelance] }
  - { id: slot/family-mismatch,       by: script, severity: fail, fix: stop, routes: [freelance, employment] }
  - { id: slot/job-asks-unjustified,  by: model,  severity: warn, fix: none, routes: [freelance, employment] }
  - { id: length/hook,                by: script, severity: fail, fix: regenerate, routes: [freelance] }
  - { id: length/prose-cap,           by: script, severity: fail, fix: regenerate, routes: [freelance] }
  - { id: length/total-ceiling,       by: script, severity: fail, fix: regenerate, routes: [freelance] }
  - { id: length/list-lines,          by: script, severity: fail, fix: regenerate, routes: [freelance] }
  - { id: length/relevant-work-count, by: script, severity: fail, fix: regenerate, routes: [freelance] }
  - { id: length/sentence-cap,        by: model,  severity: warn, fix: patch, routes: [freelance, employment] }
  - { id: terms/hour-range,           by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: terms/bounded-window,       by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: fact/untraceable,           by: model,  severity: fail, fix: ask, routes: [freelance, employment] }
  - { id: fact/arithmetic,            by: model,  severity: warn, fix: none, routes: [freelance] }
  - { id: terms/forbidden-promise,    by: model,  severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: closing/call,               by: script, severity: fail, fix: patch, routes: [freelance, employment] }
  - { id: job/demand-unanswered,      by: model,  severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: job/mandatory-keyword,      by: model,  severity: fail, fix: patch, routes: [freelance] }
  - { id: job/gaps-required,          by: model,  severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: flag/safeguard-missing,     by: model,  severity: fail, fix: regenerate, routes: [freelance, employment] }
  - { id: version/keyword-coverage,   by: script, severity: warn, fix: none, routes: [employment] }
  - { id: version/title-in-summary,   by: script, severity: warn, fix: none, routes: [employment] }
---

# Verify catalogue

`verify` is the last State. It reviews the Letter the way a code review reviews a diff, then applies the Fixes itself: the Letter file after `verify` is the corrected Letter, never a report. The Letter file is `letter.md` on the freelance route and `cover-letter.md` on the employment route; the route's template (`templates/letter-<family>.md` or `templates/letter-employment.md`) sets its Slots and its caps. A Check is one named rule. A Finding is one violation of a Check in one Slot, `fail` or `warn`. A Fix is the change `verify` applies for a Finding. Each Check names the routes it runs on (`routes`); a Check whose `routes` lack the Candidate's route is skipped by the script and by the model pass.

Portable across Profiles. Personal inputs (banned extras, allowed extras, word cap, terms) come from the Profile at run time.

## Inputs

- The Letter file of the current Candidate: body is the Letter; frontmatter `slug`, `family`, `date` in `letter.md`, `slug`, `date`, `version` in `cover-letter.md`. An empty `cover-letter.md` body is a resume-only application: valid, with no Letter in it.
- `job.md`: `route`, posting body (client facts, Job demands), `verdict.flags`, `verdict.alert_level`, `verdict.family` on the freelance route, `title` and `requirements` on the employment route.
- The Version on the employment route, named by `version` in `cover-letter.md`: `general` or `frontend` reads its summary from `profile.md` `summaries` and its role from the `role` frontmatter of `versions/<version>.md`; `tailored` reads the Candidate's `version.md`.
- Profile: `profile.md` (`terms`, `word_cap`, `summaries`), the Skills (every Project's `keywords`: names for the acronym list and for `gaps-required`), `profile/projects/<slug>.md` (traceability source: the frontmatter meta and the Stories by key, harvested by the script into the brief), `voice.md` (`banned_extra`, `allowed_extra`).
- Catalogues: voice rules, Slot catalogue, the route's template (the Family template named by `family`, or `letter-employment`), Flag catalogue.

Nothing is stored. The report is session output; a Letter is final only after `verify` passes, so a stored pass carries no information.

## Finding Slots in plain text

The Letter carries no markers. `verify` segments it deterministically: on the freelance route from the fixed Slot order and the mandatory headers, on the employment route from the fixed Slot order alone.

Freelance route:

1. Line 1 is the greeting Slot, checked for presence only.
2. Block 2 is `hook`.
3. Every following block whose first line ends with `:` is a headered Slot. Header text from the Slot catalogue maps to its id; any other colon-terminated single line maps to `answers`, one `answers` paragraph per header. A block without a header continues the Slot before it (`relevant_work` holds one paragraph per Project); prose after the plan block, with or without a blank line before it, is `follow_on`. A list block without a header is the plan Slot with its header missing.
4. The last three blocks are `terms`, `closing`, `sign_off`. `terms` may open with a header that is not a catalogue header: the availability question of a question-structured Letter (Slot catalogue, `Ask headers`). A header is a single line ending with a colon (at most twelve words) or a line ending with `?` (the client's question verbatim, any length). Other question headers segment as `answers` paragraphs, so a question-structured Letter leans on the template's `cap.total_words` more than on the prose cap.

Employment route (no headers, every block prose):

1. Block 1 is the greeting Slot, one line.
2. Block 2 is `intro`.
3. The last two blocks are `closing` and `sign_off`.
4. The blocks between are `relevant_work`, then `gaps` and `terms` in that order. With one block after `relevant_work`, it is `terms` when it names availability, notice, a start, a timezone or overlap, where the person is based, the remote setup, a relocation or a salary, and `gaps` otherwise; the model corrects the label at the Letter review when it reads wrong.

A cover letter with fewer than five blocks, more than seven, or any header line raises `slot/parse`.

Blocks are separated by one blank line. A Letter this procedure cannot segment (too few blocks, a header where none is allowed, a block without a header straight after the hook, the same header twice) raises `slot/parse` and stops for the human. Hand-edited Letters go through the same procedure.

`scripts/verify.ts <candidate>` reads the route from `job.md`, runs the Version pass on the employment route, then the segmentation and every script Check of the route, and prints the Version pass first, then the Letter pass: its Findings, the Slot map with file line numbers, the counts, and the brief for the model pass (route and template, Safeguards to look for with their target Slot when the template has that Slot, `when: job asks` Slots present, Profile terms). Exit 1 while any script Check fails. An empty `cover-letter.md` body is a resume-only application: the Version pass runs alone and the Letter pass is skipped. Its fixtures in `scripts/verify.test.ts` seed one Finding per Check group, on both routes.

## Checks

Script Checks read text and counts; model Checks read meaning. The script runs first; the model pass runs only when the script reports no `fail`, so cheap Findings never reach the model.

### version

The Version pass, employment route only, by script, before the Letter pass. The Version is the human's document: both Checks `warn` with Fix `none`, and the human tailors the Version or sends it as it is.

- `keyword-coverage`: a `job.md` `requirements` entry found neither in the Version's summary nor among the ledger rows of the Version's role. Found in the summary: the entry's text, or the name or an alias of a ledger row the entry matches, appears in it. Found among the rows: a row the entry matches lists the Version's role in `roles`. On `version: tailored` both read the whole `version.md` text instead. One Finding per entry; no `requirements` is reported in the pass and checks nothing.
- `title-in-summary`: the posting's role noun is absent from the Version's summary. The role noun is the `job.md` `title` without seniority words (`Senior`, `Lead`, `Staff`, `Principal`, `Junior`, `Mid`), a parenthesis, or anything after a dash, a bar or a comma. `front-end` reads as `frontend`. A missing summary is reported here.

### voice

- `banned-phrase`: any phrase from the shared `banned` list plus Profile `banned_extra`, minus Profile `allowed_extra`. Case-insensitive.
- `soft-banned`: any word from `soft_banned`. Warn; the sentence is rewritten anyway.
- `exclamation`: any `!`.
- `first-person-plural`: `we`, `our`, `us` as a whole word outside a quoted client phrase.
- `self-descriptive`: `senior`, `lead`, `expert`, `experienced`, `seasoned`, `veteran` applied to the writer.
- `rhetorical-question`: a question the Letter answers itself or leaves for effect. A client's question used verbatim as a header is not one. Model.
- `apology`: `sorry`, `unfortunately`, `I must admit`, and any sentence that apologises for a gap. Model.
- `semicolon-chain`: a line with two or more semicolons. Warn; the sentence is split.
- `contrast-negation`: a sentence that defines the work by what it is not (`X, not Y`, `never Y`, `rather than Y`, `nothing changes`). Warn; the sentence is rewritten to state what is done. Model.

### format

- `markdown`: `**`, `*`, `_` used as emphasis, `#` at line start, `[text](url)`, `>` at line start, backticks.
- `emoji`: any emoji or pictographic character.
- `all-caps`: a word of three or more capitals that is not a known acronym: one the Skill ledger names, the Project bodies, or the Job body use, or a common web and business abbreviation (URL, API, MVP, HIPAA).
- `indentation`: a line starting with a space or tab.
- `contact`: email, phone number, `@handle`, messenger or social handle, booking-page domain, any URL to a page the Profile marks as carrying a contact form. Both routes: the platform carries contact on the freelance route, the application form and the PDF on the employment route.
- `url-count`: any URL that is not `https://`. The number of links is not capped.
- `url-list`: the Letter carries at least one URL. Warn, lists them, reported only.
- `char-ceiling`: more characters than the route's template `cap.chars`, greeting and sign-off included: 4,500 in the Family templates (Upwork's cover letter limit is about 5,000 and unconfirmed), 500 in `letter-employment`.

### slot

- `parse`: segmentation failed. Stop.
- `missing`: a Slot the route always renders (Slot catalogue, route sections) is absent, or `gaps` is absent while `job/gaps-required` holds.
- `extra`: a block maps to a Slot the route's template does not list, or to a `when: job asks` Slot with no ask. Fix: remove the block.
- `header-missing`: a Slot the catalogue lists under `headers` opens without its header line. The script sees this for the plan Slot (a list without a header); a prose Slot without its header reads as a continuation of the Slot before it, so the model reports it when a paragraph's content belongs to another Slot.
- `header-second-person`: a colon-terminated header with `you`, `your`, `you've`, `you're` as a whole word. Only a real client question ending in `?` keeps the client's pronouns; a request fragment is reworded in first person (`Products I've built:`). Fix: patch the header.
- `family-mismatch`: on the freelance route `letter.md` `family` differs from `job.md` `verdict.family`; on both routes the Letter file's `slug` and `date` do not match the Candidate folder. Stop.
- `job-asks-unjustified`: a `when: job asks` Slot is present and the model cannot point at the ask in the Job. Warn.

### length

Each length Check runs only when the route's template has the cap it reads; `letter-employment` has `cap.chars` alone, so its length is `format/char-ceiling`.

- `hook`: `hook` block over its Slot `cap.chars`.
- `prose-cap`: prose words over Profile `word_cap` (the template's `cap.prose_words` when unset). Prose excludes header lines, list lines, and the `answers` Slot.
- `total-ceiling`: all words over the template's `cap.total_words`.
- `list-lines`: `deliverables` or `milestones` over its Slot `cap.lines`, or a second list anywhere.
- `relevant-work-count`: more paragraphs in `relevant_work` than its Slot `cap.paragraphs`.
- `sentence-cap`: a prose Slot over its Slot `cap.sentences`, or a paragraph over `cap.each.sentences`. Warn; model counts.

### fact

- `untraceable`: a fact with no source. The model lists every fact in the Letter (product name, URL, role, period, stack item, number, client quote) with its Slot and source: a Project's frontmatter field or Story (lead line or context) as the brief lists them, a `profile.md` field, the `job.md` body for client facts, or `derived` for hours and prices computed from the Profile rate. Fix: ask the human once whether the fact is true. True: append it as a context line under the nearest Story of the matching `profile/projects/<slug>.md`, then regenerate the Slot. False or unknown: regenerate the Slot without it.
- `arithmetic`: a milestone price that is not hours times the Profile rate, or a total that does not sum. Warn.

### terms

- `hour-range`: a clock time or an am/pm range in `terms`. Overlap is the client's part of the day, never hours they must convert.
- `bounded-window`: `through the next`, `for the next`, `until` in `terms`. Availability is `available now` or `from <date>`.
- `forbidden-promise`: a promise the Profile `terms` forbid: a fixed price when `billing: hourly-caps`; hourly caps when `billing: milestones`; subcontracting mentioned when `subcontracting: none`; weekly hours outside `weekly_hours`; a start date before `availability_from`, or a bounded availability window; a rate below `rate_floor`; IP wording against `ip_stance`; a delivery date the plan does not derive. Generic promise words (`guarantee`, `unlimited revisions`, `24/7`) live in the shared `banned` list so the script catches them.

### closing

- `call`: `closing` offers a call, a walkthrough, a screen share, or a demo. Questions are answered in writing; Project codebases are never shown.

### job

- `demand-unanswered`: an explicit request in the Job (examples, stack, approach, availability, subcontracting, a specific question) that no Slot answers. Fix: regenerate `answers`, or the Slot the demand maps to. A demand that needs a fact the Profile lacks goes to the human as in `fact/untraceable`. On the employment route it counts only the demands a cover letter can carry (`intro`, `relevant_work`, `gaps`, `terms`); screening questions are form fields answered from the Answers, never Findings.
- `mandatory-keyword`: Flag `mandatory-keyword` is triggered and the keyword appears anywhere in the Letter. Fix: patch the sentence to drop it. The Letter never complies with a keyword demand.
- `gaps-required`: a required item of the Job (a must, a required skill, the codebase; never a preferred or nice-to-have item) is outside the ledger's `shipped` Skills and `gaps` is absent or does not name it; or `gaps` names an item that is not required. Fix: regenerate `gaps` (which renders nothing when no required gap remains).

### flag

- `safeguard-missing`: a triggered risk Flag in `verdict.flags` with `slot` other than `none` whose Safeguard the target Slot does not state. `fail` at Alert Level 3 or 4, `warn` at 1 or 2. `plan` resolves to the Family's plan Slot.

## Fixes

- `patch`: rewrite the offending sentence or line; the rest of the Slot stays byte-identical. Used for word-level Findings. Unbounded, re-checked every cycle.
- `regenerate`: refill the whole Slot from the template and the Profile; every other block stays byte-identical. Used when the Slot's content is wrong, not its words. Two regenerations per Slot per run; the third Finding on the same Slot stops.
- `remove`: delete the block and its blank line.
- `ask`: one question to the human, then one regeneration.
- `stop`: no Fix; the run ends with the report and the question.
- `none`: reported only.

Length Fixes shrink in this order: the prose Slot most over its own catalogue cap first, then `relevant_work` by its weakest Project, never below the Family default count and never below the number the Job asks for, then `answers` paragraphs merged. `hook`, `terms`, `closing`, `sign_off` are never shrunk.

## Cycles

One cycle: script Checks, apply their Fixes, model pass, apply its Fixes, script again. Regenerated text can introduce new Findings, so cycles repeat until one script-and-model pass reports zero `fail`. Cap three cycles; then the run stops with the open Findings listed.

## Report

Printed once, at the end, in this order:

1. Verdict line: `pass` or `stopped`, and the cycle count.
2. Fixes applied, one line each: Check id, Slot, before and after in one clause each.
3. Warnings left open.
4. Fact table: fact, Slot, source.
5. The Letter verbatim in a code block, ready to paste.

On `stopped`: the same, plus the one question for the human. The human edits the Letter file or answers, then reruns `verify`.

## End of the Route

`pass` plus the human sending the Letter ends the Route: pasted into Upwork on the freelance route, sent with the application and the PDF on the employment route. No further State, and no calibration step: the Answers in `profile/answers/` calibrate the voice, and `voice.md` has no body.
