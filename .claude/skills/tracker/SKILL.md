---
name: tracker
description: Print the Tracker - every Candidate and where it stands, newest first - from the Candidates' job.md frontmatter.
argument-hint: "print"
---
The Tracker is printed from each Candidate's `job.md` frontmatter under `private/candidates/` (catalogue `autotriage/catalogue/candidate-artifacts.md`: `verdict`, `outcome`, the Tracker section). Rendering is the script's; `print` shows its output and nothing else. Nothing is stored: the human sets `outcome` in `job.md` by hand.

## Commands

- `print`: run `node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/tracker.ts print` and show its output verbatim in the session. One table for both routes, `candidate | route | verdict | outcome`, sorted by folder name descending; after the table, the warnings (an invalid `job.md`).

No argument means `print`. Any other argument: print the command above.

Argument received: $ARGUMENTS
