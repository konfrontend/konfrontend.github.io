---
name: cv-scan
description: Scan one repository and write approved highlights to its project's highlights pool, in gather or deepen mode.
disable-model-invocation: true
---

A **scan** reads one repository and proposes highlights for one project's pool at `projects/<project>/highlights-pool.md`. The pool is the only thing it writes to this repository. Working notes go to the session scratchpad and die with the session.

Read `docs/cv-guidelines.md` and `GLOSSARY.md` first. Every highlight, keyword, rank and the pool shape follow the guidelines; this skill holds only the scan procedure.

## Input

- One or more repository paths, all belonging to one project, given by the user in chat. Without them, ask the user; never search the disk.
- A theme name, optional. Named: **deepen** mode, the scan covers that one theme. Absent: **gather** mode, the scan covers every theme.
- Clues the user states in chat, at the start or at any point during the scan.

## Clues

A clue is a fact. Record each one verbatim in the scratchpad notes the moment the user states it. Every clue reaches a candidate highlight, with or without supporting evidence. Search git for evidence that makes it stronger: the scope it touched, the number it moved, the technology it used. When blame and a clue disagree on authorship, the clue wins.

## Ownership

Highlights come only from the user's own work. The author email in work repositories is `konfrontend@gmail.com`.

- Read the user's commits on the default branch only, `master` or `main`: `git log master --author=konfrontend@gmail.com`. Name the revision in every history command, `git shortlog -sne master` included; without one, `git shortlog` waits on stdin.
- Establish ownership from commits and blame before claiming a feature. Blame the feature's core files, not only the files the user touched last.
- Measure a share by the lines the user wrote, leaving out a ported or vendored library's import commit and mass reformat commits. The share is a mechanical pre-check; the user's word is the verdict.
- A feature shared with another contributor names the user's part precisely.
- An area where the user has only polish commits stays out of highlights and out of the Skills line.

## Steps

1. **Orient.** Read the pool if it exists. Note its themes and highlights, so candidates extend it and never repeat it. When the pool is missing, or breaks the guidelines' Pool structure or Highlights rules, propose the fix first as its own approval round, reviewed one theme at a time as in step 4: header from the user (brand name, site URL checked against the repository's current links, role lines, one-line description), existing highlights grouped into themes and rewritten to the Highlights rules, a rank mark on each by the Rank criteria, Skills line to the Keywords rules. Re-derive every number already in the pool from git, and replace one that git does not confirm unless the user gave it. Re-establish ownership of every part of every existing highlight under the Ownership rules, and ask the user about each part git leaves open. Write it once the user approves. Done when the pool follows the guidelines.
2. **Gather evidence.** Collect the user's commits, group them by feature, and establish ownership per feature. With several repositories, gather each one in its own subagent and keep only its report. Read a repository one directory per call, each output under 30KB; a larger output lands in a file and costs a second read. In deepen mode, read only the features in the named theme, and read them deeper: diffs, tests, ADRs, PR descriptions, the code itself. Derive numbers from git where a highlight needs one, the kind a reader can judge: before and after measurements the history records, users, team size. Done when every clue and every owned feature in scope has evidence notes in the scratchpad.
3. **Draft candidates.** Write candidate highlights per theme, following the guidelines' Highlights and Keywords rules. Gather mode may add highlights to existing themes or open new ones. Deepen mode writes the full replacement for the named theme: existing highlights kept, merged, sharpened or extended. Run the humanizer skill on every candidate. Then send the candidates, the evidence notes and the clues to a reviewer subagent briefed by `docs/cv-review.md`, and fix each finding; a finding you dispute goes to the user in step 4. Done when every clue and every owned feature in scope sits in a candidate or in a one-line "left out, because" note, and the reviewer has a line for every candidate.
4. **Review per theme.** Show one theme at a time in chat: its candidates, worded exactly as they will be written to the pool, each with its proposed rank and one line of reason by the guidelines' Rank criteria, then a short ownership note per candidate (the user's share, shared parts, which clue it carries), then every number in the theme with its git evidence for the user to confirm, then the "left out" notes for that theme. An odd exact value rounds down to a clean figure when the user agrees. The user approves, edits or drops. Rework until the user approves the theme, then move to the next.
5. **Write the pool.** Write the approved highlights under their themes, each opening with its confirmed rank mark. Deepen mode replaces the named theme's section. Update the Skills line from the approved highlights, ordered and named by the guidelines' Keywords rules. Run `npm --prefix build run lint` and fix each failure in the pool with the user. Done when the pool holds every approved highlight and nothing unapproved, and the lint shows no failure in the pool.
