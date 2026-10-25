---
name: pp-bullets
description: Draft Bullets for one Project from its Work repository and append the confirmed ones to the Project file.
disable-model-invocation: true
argument-hint: "[<project-slug>] [<work-repository-path>...]"
---

Drafts Bullets for one Project, `profile/projects/<slug>.md`, from its Work repository, the Project's Overview and its Notes, with the person reviewing every draft. Terms are `GLOSSARY.md`'s. The skill writes two things, both appended: confirmed answers as `- ` lines at the end of `## Notes`, confirmed Bullets as `- [key] text` lines at the end of `## Bullets`. The meta and the Overview are the person's; a change they need is reported, not made.

Work repository paths come from the arguments or from the person each run and stay in the conversation: a local path in the Profile would ship in the public repo and break on any other machine.

## The Bullet rules

A Bullet is read by a recruiter in seconds and defended by the person at interview, so each rule guards one of those two readings. The Profile check (`npm run build`) scripts a part of rules 2 and 3 and reports the rest to nobody: the writer and the reviewer judge it.

1. **Shape**, in order: what was delivered, its measured effect, how it was done. A part the Work repository, the Overview and the Notes do not fill is left out: an estimate the person cannot back fails at interview, and a Bullet with no effect still reads as a delivery.
2. **Opener**: a past-tense active verb naming what the person did ("Built", "Cut", "Wrote"), so the Bullet reads as an achievement, not a duty. One or two rendered lines, about 250 characters at most; `resume-pdf` measures the render.
3. **Numbers**: at most three, and a relative one carries its base (the before value, the period or the sample), since "40% faster" alone is unverifiable. Every number in a draft is traced to a command, a file or a Notes line.
4. **Keywords**: a technology is named by its Keyword from the Project's `keywords`, the one spelling an ATS matches. One the Work repository shows and `keywords` lacks is reported to the person, who adds it to the meta before the Bullet is written.
5. **Share**: team work states the person's own share when the Work repository shows it (commit share, files authored alone).

## Steps

1. **Resolve the arguments.** With no slug, print every Project with its Bullet count, fewest first, and ask which. With no path, ask for the Work repository paths. Done when one slug names a Project file and every path is a git repository.
2. **Read.** The Project file: `keywords`, `## Overview`, `## Bullets`, `## Notes`. In each Work repository, `git shortlog -sne` to pick the person's author identities (confirm the pick when more than one name could be theirs), then what the repository can show: their commits (count, span, files touched), test and component or module counts, the stack from the manifests, before-and-after numbers stated in commit messages or a changelog. Done when each number is listed with the command or file it came from.
3. **Ask.** One batch of numbered questions, each for one thing a Bullet needs and the Work repository cannot show: users or scale, latency or load time, cost or time saved, business outcome. A recommended answer goes only on a question the Work repository backs (the person's share of the commits); the others stay open, so no guess reaches the Profile. Append each confirmed answer to `## Notes` as one `- ` line; a declined question leaves its part out of the Bullet. Done when each question is confirmed with its Notes line written, or declined.
4. **Draft.** Print numbered drafts, `N. [key] text`, the key a short noun unique in the Project. On a Project that already holds Bullets, draft only what the Work repository shows and the existing Bullets do not claim. Done when every draft passes every Bullet rule, with each number's source and each technology's Keyword named beside the draft.
5. **Edit.** Take the person's editing rounds in the same numbered format, reprinting the full list after each. Done when the person confirms a list.
6. **Write.** Append the confirmed Bullets at the end of `## Bullets`, run `npm run build`, and read its output for the new keys: an error or a warning on one names the Bullet to fix with the person, then run again. Warnings on other keys are the Profile's standing state, not this run's. Done when the build reports nothing on the new keys and the earlier Bullets are byte for byte as read in step 2.

Argument received: $ARGUMENTS
