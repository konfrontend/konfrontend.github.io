---
name: gaps
description: Print the Gap print - every Gap and every proved Skill a Job asked for, with how many Candidates asked - from the Candidates' requirements and the Projects' Keywords.
argument-hint: "print"
---
The Gap print derives from every dated Candidate's `requirements` in `job.md` under `private/candidates/`, no-go Candidates included, and from the Skills the Project files prove and the Profile claims (`skills.claimed` in `profile/profile.md`) (catalogue `autotriage/catalogue/candidate-artifacts.md`, the Gap print section; `GLOSSARY.md`: Gap, Gap print). Rendering is the script's; `print` shows its output and nothing else. Nothing is stored and nothing is declared: a Gap exists only because a Job required it, and it never enters a Letter or a Version.

## Commands

- `print`: run `node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/gaps.ts print` and show its output verbatim in the session. Two tables, `skill | seen`: the Gaps first (required by a Candidate, proved by no Project, spelled as the posting spelled them), then the Skills seen (proved by a Project and asked for at least once); `seen` counts Candidates. A claimed Skill is in neither table. Where a Gap was seen is not printed; a search over `private/candidates/*/job.md` answers that.

No argument means `print`. Any other argument: print the command above.

Argument received: $ARGUMENTS
