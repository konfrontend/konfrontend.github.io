---
name: version
description: Pick the Version an employment Candidate is sent with (general, frontend, or tailored) and record it in job.md.
argument-hint: "<YYYY-MM-DD-slug> [--tailor]"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.mjs version $ARGUMENTS`

The employment route only, after the checkpoint on `decision: go`. The pick is a rule, not a judgment, so the script makes it: frontend, front-end, React, Vue or UI in the posting's role title (`job.md` `title`) picks `frontend`, anything else `general`. The script writes `version` into `job.md`; `proposal` reads it to fill the Intro Slot, and `job.md` with `version` is the record of what was sent. With `--tailor` it writes `version: tailored` and copies the picked Version (`versions/<picked>.md`) into the Candidate folder as `version.md`, the tailored Version's source, for the human to edit; an existing `version.md` is never overwritten. Contract in `${CLAUDE_PLUGIN_ROOT}/catalogue/candidate-artifacts.md`. The PDF is not this State's business: the human renders it outside the plugin.

## Steps

1. **Pick and record.** Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/version.mjs $ARGUMENTS`. It prints the Version written, the title it was picked by, the `version.md` it created on `--tailor`, and the next command. The write hook validates `job.md` against `${CLAUDE_PLUGIN_ROOT}/scripts/schemas/job-employment.schema.json`. Done when the script has printed the `Next:` line.
2. **Hand off.** Print the script's output as is; its last line names the next command. On `version: tailored` add one line: edit `data/candidates/<candidate>/version.md` first; its summary paragraph (after the contact line) becomes the Intro Slot. Done when the next command is on screen.

Argument received: $ARGUMENTS
