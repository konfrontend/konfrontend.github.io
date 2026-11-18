---
name: triage
description: Triage one Upwork Job against the Profile and the Flags, then ask go or no-go before write-proposal.
disable-model-invocation: true
argument-hint: "<Upwork job URL or id, or the pasted posting>"
---

Judgment is yours, arithmetic is the scripts'. Nothing is written: the Job, the scores and the Verdict live in this session.

1. **Job.** A URL or id: read it with the Upwork `find_jobs` action `get`. A paste: the paste is the Job. When `applied` is true, say so and stop. Done when the posting and every document it links are read.
2. **Flags.** Judge every Flag in `autotriage/catalogue/flags.md` whose `routes` holds `freelance`, by the meaning of its cues. Hold each triggered Flag with its level and one verbatim quote from the Job; for `unmet-constraint`, also the line of `identity.constraints` in `profile/profile.md` it collides with. Done when every freelance Flag has a verdict.
3. **Skill fit.** List the Job's required items: technologies and practices it must have, nice-to-haves left out. Run `node autotriage/scripts/skills.ts match "<item>" ...` with all of them and correct its matches by reading. Score `skill_fit` by the catalogue's `scores` rubric. Done when every item maps to Keywords or to none.
4. **Arithmetic.** Run `node autotriage/scripts/verdict.ts --route freelance --skill-fit <n> --flags <id,id>`. Done when its JSON is in hand.
5. **Checkpoint.** Print one screen: the recommendation, the Alert Level and `skill_fit`; hard stops; triggered Flags as `id (level N): "quote"`; green Flags; items as `item -> Keyword` or `item -> none`; the budget against `terms.rate`; the client's `client_record` (hires, hire rate, spend, feedback score) and `connects_cost`. Ask go or no-go. A correction to a Flag or an item reruns steps 4 and 5. Done when the person has answered.
6. **Hand off.** On go, invoke `write-proposal` for this Job. On no-go, one line that triage ended here.
