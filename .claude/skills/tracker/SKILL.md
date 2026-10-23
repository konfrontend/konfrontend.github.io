---
name: tracker
description: Print the Tracker - every Candidate and where it stands, open ones first - from the Candidates' job.md frontmatter.
argument-hint: "print"
---
The Tracker is printed from each Candidate's `job.md` frontmatter under `private/candidates/` (catalogue `$CLAUDE_PROJECT_DIR/autotriage/catalogue/candidate-artifacts.md`: `decision`, `outcome`, the Tracker section). Rendering is the script's; `print` shows its output and nothing else. Nothing is stored: the human sets `outcome` in `job.md` by hand.

## Commands

- `print`: run `node $CLAUDE_PROJECT_DIR/autotriage/scripts/tracker.ts print` and show its output verbatim in the session. One table for both routes, `date | candidate | route | decision | family | version | outcome`, `version` from `cover-letter.md`: open Candidates first, then closed, each by intake date descending; after the tables, the warnings (an `outcome: sent` with no letter file, an invalid `job.md`).

No argument means `print`. Any other argument: print the command above.

Argument received: $ARGUMENTS
