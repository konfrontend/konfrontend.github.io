---
name: version
description: Record which Version an employment Candidate is sent with (general, or tailored from it) in cover-letter.md.
argument-hint: "<YYYY-MM-DD-slug> [--tailor]"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.ts version $ARGUMENTS`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

The employment route only, after the checkpoint on `decision: go`. The one stored Version is `resume/versions/general.md`, a selection over the Profile (Story keys per Project, Skills lines, a summary). The script records `version` in `cover-letter.md`, the record of what went out: a new file gets `slug` and `date` from `job.md` and an empty body; a re-run rewrites `version` and leaves the body alone. `proposal` reads the Version's `summary` to fill the Intro Slot and writes the Letter into the body. With no Letter wanted, the Route stops here: the empty body is a resume-only application. With `--tailor` it writes `version: tailored` and copies the general Version into the Candidate folder as `version.md`, the tailored Version's source, for the human to edit its selection and summary; an existing `version.md` is never overwritten. Contract in `${CLAUDE_PLUGIN_ROOT}/catalogue/candidate-artifacts.md`. The PDF is not this State's business: the human renders it outside the plugin.

## Steps

1. **Record.** Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/version.ts $ARGUMENTS`. It prints the Version written, the `version.md` it created on `--tailor`, and the next command. `cover-letter.md` validates against `${CLAUDE_PLUGIN_ROOT}/scripts/schemas/cover-letter.schema.json`. Done when the script has printed the `Next:` line.
2. **Hand off.** Print the script's output as is; its last line names the next command. On `version: tailored` add one line: edit `private/candidates/<candidate>/version.md` first, its `projects` selection and its `summary`; the summary becomes the Intro Slot. Done when the next command is on screen.

Argument received: $ARGUMENTS
