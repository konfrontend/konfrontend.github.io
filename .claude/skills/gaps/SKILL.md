---
name: gaps
description: Print the gaps print - every Gap and every Keyword a Job asked for, with how many Candidates asked - from the Candidates' requirements and the Keywords.
argument-hint: "print"
---
The gaps print derives from every dated Candidate's `requirements` in `job.md` under `private/candidates/`, no-go Candidates included, and from the Keywords of the Projects' Bullet groups in `profile/projects/*.md` (catalogue `autotriage/catalogue/candidate-artifacts.md`, the gaps print section; `GLOSSARY.md`: Gap). Rendering is the script's; `print` shows its output and nothing else. Nothing is stored and nothing is declared: a Gap exists only because a Job required it, and it never enters a Letter or a Version.

## Commands

- `print`: run `node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/gaps.ts print` and show its output verbatim in the session. Two tables, `skill | seen`: the Gaps first (required by a Candidate, named by no Keyword, spelled as the posting spelled them), then the Keywords seen (asked for at least once); `seen` counts Candidates. Where a Gap was seen is not printed; a search over `private/candidates/*/job.md` answers that.

No argument means `print`. Any other argument: print the command above.

Argument received: $ARGUMENTS
