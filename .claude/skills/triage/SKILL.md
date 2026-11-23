---
name: triage
description: Triage one Upwork Job against the Profile and the Flags, then ask go or no-go before write-proposal.
disable-model-invocation: false
argument-hint: "<Upwork job URL or id, or the pasted posting>"
---

Nothing is written: the Job, the Flags and the Verdict live in this session.

1. **Job.** A URL or id: read it with the Upwork `find_jobs` action `get`. A paste: the paste is the Job. When the read fails, or Upwork is not signed in, stop with one line naming the fix: sign in through `/mcp`, or paste the Job. When `applied` is true, say so and stop. Done when the posting and every document it links are read.
2. **Flags.** Judge every Flag in [flags.md](flags.md) against the Job. Hold each triggered Flag with one verbatim quote from the Job; for `unmet-constraint`, also the line of `identity.constraints` in `profile/profile.md` it collides with. Done when every Flag has a verdict.
3. **Keyword map.** List the Job's required items: technologies and practices it must have, nice-to-haves left out. Map each to the Keywords it names, read from the `## Keywords` lines of `profile/projects/*.md`, or to none. Done when every item is mapped.
4. **Checkpoint.** Print one screen: your recommendation (go, no-go or ask) with its reason in one line; red Flags as `id: "quote"`; green Flags; the map as `item -> Keyword` or `item -> none`; the budget against `terms.rate` in `profile/profile.md`; the client's `client_record` (hires, hire rate, spend, feedback score) and `connects_cost`. Ask go or no-go. A correction to a Flag or an item reprints the screen. Done when the person has answered.
5. **Hand off.** On go, invoke `write-proposal` for this Job. On no-go, one line that triage ended here.
