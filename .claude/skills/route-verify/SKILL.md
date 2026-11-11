---
name: route-verify
description: Review a Candidate's letter.md against the Checks and apply the Fixes in place; ends with the Letter ready to paste.
argument-hint: "<YYYY-MM-DD-slug>"
---
!`node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/guard.ts verify $ARGUMENTS`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

This skill is a code review of `letter.md` that applies its own Fixes: after it, `letter.md` is the corrected Letter, never a report. The guard output above names the route and its template. The rules are in the Verify catalogue `autotriage/catalogue/verify.md` (Checks by id with their `routes`, Fix kinds, the cycle, the report order); this file only sequences them. A Check whose `routes` lack the Candidate's route is skipped. Every Check is judged here, by reading. Nothing is stored besides the corrected Letter: the report, the fact table, and the Finding list are session output.

Inputs, read all before step 1: `letter.md` and `job.md` in `private/candidates/$ARGUMENTS/` (`route`, `title`, `requirements`, the posting verbatim in the body, `flags` and `rate` on the freelance route), the Profile (`profile/profile.md` for `terms`; `profile/projects/*.md`, frontmatter meta, Description, Bullets by heading and Notes, as the source of facts about the person; `profile/answers/*.md`; `profile/voice.md` for `banned_phrases`), the route's template (`autotriage/catalogue/templates/letter-freelance.md` or `letter-employment.md`, with its Slot notes and rule switches), the Slot catalogue `autotriage/catalogue/templates/letter-slots.md`, the voice rules `autotriage/catalogue/voice.md`, and on the freelance route the Flag catalogue `autotriage/catalogue/flags.md`, for the Alert Level and the Safeguards of the `flags`. Every edit goes through the Edit tool on `letter.md`; the write hook blocks a Letter that gains frontmatter.

## Fixes

Each Finding names its Fix in the catalogue; apply exactly that one.

- `patch`: rewrite the offending sentence or line with one Edit; the rest of the Slot stays byte-identical.
- `regenerate`: refill the whole Slot from the Slot catalogue entry, the template's Slot notes, the voice rules, and the Profile facts, then replace the Slot's block with one Edit; every other block stays byte-identical. Keep a tally per Slot: the third Finding on a Slot already regenerated twice is a stop.
- `remove`: delete the block and the blank line after it.
- `ask`: one message to the human holding every open question of this cycle, then wait; after the answer, one regeneration of the Slot.
- `stop`: no edit; the run ends with the report and the question.
- `none`: reported only.

Length Fixes shrink in this order: the prose Slot most over its own catalogue cap first, then `relevant_work` by its weakest Project, never below the template's default count and never below the number the Job asks for, then `answers` paragraphs merged. `hook`, `terms`, `closing`, `sign_off` are never shrunk for length.

## Steps

1. **Read the Letter.** The Letter is the body of `letter.md` from the greeting to the sign-off; the milestone lines and the bid after the sign-off and an optional fenced `Sent` block are skipped. An empty `letter.md` on the employment route is a resume-only application: the run goes to step 4 with no Letter. Map each block to its Slot by the route's template. On the freelance route, recompute the Alert Level from `flags` and list the Safeguards with their target Slots from the Flag catalogue. Done when every block has a Slot.

2. **Check.** Judge every Check of the route, Slot by Slot:
   - `voice/rhetorical-question`, `voice/apology`: any question the Letter answers itself or leaves for effect (a client's question used verbatim as a header is not one); `sorry`, `unfortunately`, `I must admit`, any sentence that apologises for a shortfall.
   - `voice/contrast-negation`: a sentence that defines the work by what it is not (`X, not Y`, `never Y`, `rather than Y`, `nothing changes`); warn, rewrite to state what is done.
   - `length/sentence-cap`: count sentences per prose Slot against the Slot catalogue caps; over is a warn.
   - `relevant_work` on both routes: each Project as its product and URL, one or two things done, ownership where the role says so, no role and no period; a breach is patched like a `voice/*` Finding.
   - On the employment route: read the Letter against the rule switches of `letter-employment.md` (a role title and `10+ years` in `intro` only, no date anywhere); a breach is patched like a `voice/*` Finding.
   - `fact/untraceable`: build the fact table. Every fact in the Letter (product name, URL, role, period, stack item, number, client quote) with its Slot and source: a Project's frontmatter field, name, Description, Bullet by heading or Notes line, `answer <slug>` for an answer cited or tailored, a `profile.md` field, the `job.md` body for client facts, or `derived` for prices and due dates from `scripts/proposal.ts milestones` and for timezone overlap. `derived` never covers a claim about the person (availability, willingness, a thing done) that no Profile line states. A fact with no source is a Finding.
   - `fact/arithmetic`: in the milestone lines after the sign-off, a price that is not its hours times the rate (`job.md` `rate`, else Profile `terms.rate`), or a bid that does not sum the funded milestones. Warn.
   - `terms/forbidden-promise`: a rate, a price or a total in the Letter body, subcontracting offered, a start before `terms.availability_from`, a delivery date the plan does not derive.
   - `job/demand-unanswered`: walk the Job body and list every explicit request of the proposal (examples, stack, approach, availability, subcontracting, a specific question), then name the Slot that answers each; one with no Slot is a Finding. On the freelance route screening questions are demands: each one is a header in the Letter with its answer under it. On the employment route count only the demands a cover letter can carry (`intro`, `relevant_work`, `terms`); screening questions are form fields answered by hand from `profile/answers/`, never Findings.
   - `job/mandatory-keyword`: when `flags` holds the Flag, the keyword from the Job appears nowhere in the Letter; found is a fail, patched out.
   - `flag/safeguard-missing`: for each Safeguard from step 1, the target Slot states it in its own words; missing is `fail` at Alert Level 3 or 4, `warn` at 1 or 2.
   Done when every Check has a verdict and the fact table has a row per fact.

3. **Fixes.** Apply the Fix of every `fail` as in the Fixes section. For `fact/untraceable`, ask the human about every unsourced fact in one message, naming the Project each belongs to, and wait: a confirmed fact is appended as one line under `## Notes` of the matching `profile/projects/<slug>.md` with the Edit tool, then the Slot is regenerated; a denied or unknown fact is dropped and the Slot regenerated without it. No step edits a Description. Then start the next cycle at step 2. A cycle that finds zero `fail` is a `pass`. Three cycles without a pass, a third Finding on the same Slot, or a `stop` Fix ends the run as `stopped`. Done when the run is `pass` or `stopped`.

4. **Report.** Print once, in this order: the verdict line (`pass` or `stopped`, cycle count); the Fixes applied, one line each as Check id, Slot, before and after in one clause each; the warnings left open; the fact table (fact, Slot, source); the Letter verbatim from `letter.md` in a code block, ready to paste; then every question block that matched no answer, by its question, with an offer to draft a new file under `profile/answers/` for it; a draft is printed only on the person's yes, its question worded for reuse across Jobs (`Describe an MCP integration you've built`, never `a similar integration`), and never written. On `stopped`, add the one question for the human; they edit the Letter file or answer, then rerun `/route-verify $ARGUMENTS`. Done when the Letter is on screen.

5. **End of the Route.** One line: on `pass`, that the Route ends when the human has sent the Letter (pasted into Upwork on the freelance route, sent with the application and the Version the human chose on the employment route) and set `outcome: sent` in `job.md` by hand; on `stopped`, the question again.

Argument received: $ARGUMENTS
