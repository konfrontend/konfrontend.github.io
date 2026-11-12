---
name: gaps
description: Print the gaps print - every Gap and every Keyword a Job asked for, with how many Candidates asked - from the Candidates' requirements and the Keywords.
---
The gaps print derives from every dated Candidate's `requirements` in `job.md` under `private/candidates/`, no-go Candidates included, and from the Keywords of the Projects (catalogue `autotriage/catalogue/candidate-artifacts.md`, the gaps print section; `GLOSSARY.md`: Gap). Nothing is stored and nothing is declared: a Gap exists only because a Job required it, and it never enters a Letter or a Version. This skill only reads; it writes nothing.

## Steps

1. **Requirements.** Read the frontmatter `requirements` of every `private/candidates/YYYY-MM-DD-<slug>/job.md`. Skip any folder that is not a dated Candidate, such as `archive/`. Count each item once per Candidate, matching case-insensitively.
2. **Keywords.** Read the Keyword lines of every `profile/projects/*.md`: the lines of backticked items under `## Keywords`.
3. **Print.** Two tables, `item | seen`, `seen` counting Candidates, most seen first, ties alphabetical:
   - Gaps: the items no Keyword names, spelled as the posting spelled them.
   - Keywords seen: the items a Keyword names, in the Keyword's spelling.

   Where a Gap was seen is not printed; a search over `private/candidates/*/job.md` answers that.
