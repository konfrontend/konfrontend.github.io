---
name: verify
description: Review a Candidate's Letter against the Checks and apply the Fixes in place; ends with the Letter ready to paste.
argument-hint: "<YYYY-MM-DD-slug>"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.ts verify $ARGUMENTS`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

This State is a code review of the Letter file that applies its own Fixes: after it, the Letter file is the corrected Letter, never a report. The Letter file is `letter.md` on the freelance route and `cover-letter.md` on the employment route; the guard output above names it and the route's template. The rules are in the Verify catalogue `${CLAUDE_PLUGIN_ROOT}/catalogue/verify.md` (Checks by id with their `routes`, Fix kinds, the cycle, the report order); this file only sequences them. A Check whose `routes` lack the Candidate's route is skipped. The script `node ${CLAUDE_PLUGIN_ROOT}/scripts/verify.ts $ARGUMENTS` segments the Letter into Slots and runs every Check marked `by: script`; the Checks marked `by: model` are run here, by reading. Nothing is stored besides the corrected Letter: the report, the fact table, and the Finding list are session output.

Inputs, read all before step 3: the Letter file in `private/candidates/$ARGUMENTS/` and `job.md` (`route`, posting verbatim in the body, `verdict.flags` and `verdict.alert_level` in the frontmatter), the Profile (`profile/profile.md` for `terms`, `word_cap`; `profile/projects/*.md`, frontmatter meta and Stories with their keys, as the only source of facts about the freelancer, listed by the script in its brief; `profile/voice.md`), the route's template (`${CLAUDE_PLUGIN_ROOT}/catalogue/templates/letter-<family>.md` on the freelance route, `letter-employment.md` on the employment route, with its Slot notes and rule switches), the Slot catalogue `${CLAUDE_PLUGIN_ROOT}/catalogue/templates/letter-slots.md`, the voice rules `${CLAUDE_PLUGIN_ROOT}/catalogue/voice.md`, and the Flag catalogue `${CLAUDE_PLUGIN_ROOT}/catalogue/flags.md`. Every edit goes through the Edit tool on the Letter file; the write hook validates the frontmatter, which never changes here.

## Fixes

Each Finding names its Fix in the catalogue; apply exactly that one.

- `patch`: rewrite the offending sentence or line with one Edit; the rest of the Slot stays byte-identical.
- `regenerate`: refill the whole Slot from the Slot catalogue entry, the template's Slot notes, the voice rules, and the Profile facts, then replace the Slot's block with one Edit; every other block stays byte-identical. Keep a tally per Slot: the third Finding on a Slot already regenerated twice is a stop.
- `remove`: delete the block and the blank line after it.
- `ask`: one message to the human holding every open question of this cycle, then wait; after the answer, one regeneration of the Slot.
- `stop`: no edit; the run ends with the report and the question.
- `none`: reported only.

Length Fixes shrink in this order: the prose Slot most over its own catalogue cap first, then `relevant_work` by its weakest Project, never below the Family default count and never below the number the Job asks for, then `answers` paragraphs merged. `hook`, `terms`, `closing`, `sign_off` are never shrunk for length.

## Steps

1. **Script pass.** Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/verify.ts $ARGUMENTS`. On the employment route it prints the Version pass first: `version/keyword-coverage` and `version/title-in-summary` warns about the Version the Candidate is sent with. They are reported only; the human tailors the Version or sends it as it is. An empty `cover-letter.md` body is a resume-only application: the script prints `letter pass: skipped`, and the run goes to step 6 with the Version pass as the report and no Letter. Then the script prints the Letter pass: the Findings with file line numbers and Fix kinds, the Slot map, the counts, and the brief for step 3. A `slot/parse` or `slot/family-mismatch` Finding is a stop: go to step 6 with the Finding as the question. Done when the output is read.

2. **Script Fixes.** Apply the Fix of every `fail`, and patch the sentence of every `voice/soft-banned` warn; other warns are reported only. Then run the script again. Repeat until it prints `0 fail`, within the cycle cap of step 5. Done when the script passes.

3. **Model pass.** Read the Letter Slot by Slot, using the Slot map from the script, and judge every model Check:
   - `voice/rhetorical-question`, `voice/apology`: any question the Letter answers itself or leaves for effect (a client's question used verbatim as a header is not one); `sorry`, `unfortunately`, `I must admit`, any sentence that apologises for a gap.
   - `voice/contrast-negation`: a sentence that defines the work by what it is not (`X, not Y`, `never Y`, `rather than Y`, `nothing changes`); warn, rewrite to state what is done.
   - `slot/job-asks-unjustified`: for each Slot the brief lists under `when-job-asks Slots present`, find the sentence in the Job that asks for it; none found is a warn.
   - `length/sentence-cap`: count sentences per prose Slot against the Slot catalogue caps; over is a warn.
   - On the employment route: check the script's `gaps` and `terms` labels against the text, and read the Letter against the rule switches of `letter-employment.md` (a role title and `10+ years` in `intro` only, no Project name or date anywhere); a breach is patched like a `voice/*` Finding.
   - `fact/untraceable`: build the fact table. Every fact in the Letter (product name, URL, role, period, stack item, number, client quote) with its Slot and source: a Project's frontmatter field or Story from the brief, a `profile.md` field, the `job.md` body for client facts, or `derived` for hours, prices, totals, and timezone overlap computed from Profile numbers. `derived` never covers a claim about the freelancer (availability, willingness, a thing done) that no Profile line states. A fact with no source is a Finding.
   - `fact/arithmetic`: a milestone price that is not hours times `terms.rate`, or a total that does not sum. Warn.
   - `terms/forbidden-promise`: against Profile `terms`: a fixed price under `billing: hourly-caps`, hourly caps under `billing: milestones`, subcontracting offered under `subcontracting: none`, weekly hours outside `weekly_hours`, a start before `availability_from`, a rate below `rate_floor`, a delivery date the plan does not derive.
   - `job/demand-unanswered`: walk the Job body and list every explicit request of the proposal (examples, stack, approach, availability, subcontracting, a specific question), then name the Slot that answers each; one with no Slot is a Finding. On the freelance route screening questions are demands: each one is a header in the Letter with its answer under it. On the employment route count only the demands a cover letter can carry (`intro`, `relevant_work`, `gaps`, `terms`); screening questions are form fields answered by hand from `profile/answers/`, never Findings.
   - `job/mandatory-keyword`: when the brief says the Flag is triggered, the keyword from the Job appears nowhere in the Letter; found is a fail, patched out.
   - `job/gaps-required`: list the Job's required items (a must, a required skill, the codebase; never a preferred or nice-to-have item) outside the Profile's Skills (the brief lists them); `gaps` absent or not naming one of them is a Finding, and so is `gaps` naming a nice-to-have.
   - `flag/safeguard-missing`: for each Safeguard the brief lists, the target Slot states it in its own words; missing is `fail` at Alert Level 3 or 4, `warn` at 1 or 2.
   Done when every model Check has a verdict and the fact table has a row per fact.

4. **Model Fixes.** Apply the Fix of every `fail` as in the Fixes section. For `fact/untraceable`, ask the human about every unsourced fact in one message, naming the Project each belongs to, and wait: a confirmed fact is appended as one context line under the nearest Story of the matching `profile/projects/<slug>.md` with the Edit tool, then the Slot is regenerated; a denied or unknown fact is dropped and the Slot regenerated without it. Done when every `fail` has its Fix applied or has stopped the run.

5. **Cycle.** Run the script again. One cycle is steps 1 to 4; a cycle that ends with zero `fail` from both the script and the model pass is a `pass`. Otherwise start the next cycle at step 2. Three cycles without a pass, a third Finding on the same Slot, or a `stop` Fix ends the run as `stopped`. Done when the run is `pass` or `stopped`.

6. **Report.** Print once, in this order: the verdict line (`pass` or `stopped`, cycle count); on the employment route the Version pass warns; the Fixes applied, one line each as Check id, Slot, before and after in one clause each; the warnings left open; the fact table (fact, Slot, source); the Letter verbatim from the Letter file in a code block, ready to paste. On `stopped`, add the one question for the human; they edit the Letter file or answer, then rerun `/autotriage:verify $ARGUMENTS`. Done when the Letter is on screen.

7. **End of the Route.** One line: on `pass`, that the Route ends when the human has sent the Letter (pasted into Upwork on the freelance route, sent with the application and the PDF on the employment route); on `stopped`, the question again.

Argument received: $ARGUMENTS
