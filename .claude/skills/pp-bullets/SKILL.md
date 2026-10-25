---
name: pp-bullets
description: Draft Bullets for one Project from its Work repository - asks for what the Work repository cannot show, prints numbered drafts with keys, takes editing rounds, and appends the confirmed Bullets to the Project file.
argument-hint: "<project-slug> <work-repository-path> [<work-repository-path>...]"
---

A **Bullet** is the one- or two-line claim about one achievement of a Project, under a key that never changes (`GLOSSARY.md`). This skill drafts Bullets for one Project, `profile/projects/<slug>.md`, by the Bullet rules in `refs/bullet-rules.md`, from the **Work repository**, the git repository the Project's work was done in. Its paths come from the arguments each run, else from the person; they are never stored and never written to the Profile. The Overview and the Notes are context, neither required: an empty Overview does not stop a run.

The skill writes two things, both add-only: confirmed answers appended to the Project's `## Notes`, and confirmed Bullets appended under `## Bullets`. It never edits or removes an existing Bullet, never changes a key, and never edits the Overview.

## Steps

1. **Read.** `refs/bullet-rules.md`; the Project file: its `keywords`, `## Overview`, `## Bullets`, `## Notes`. In each Work repository, what it can show: the person's commits (`git log --author`: count, span, files touched), test and component or module counts, the stack from the manifests, before-and-after figures stated in commit messages or a changelog. Done when every figure a draft may use is in view with the command or file it came from.
2. **Ask.** One batch of numbered questions for what the Work repository cannot show and a Bullet needs: users or scale, latency or load time, cost or time saved, business outcome, the person's share of team work. Each question carries a recommended answer. Append each confirmed answer to `## Notes` as one `- ` line; an answer the person declines leaves its part out of the Bullet (rule 1). Done when every question is answered, declined, or confirmed and its Notes line written.
3. **Draft.** Print numbered draft Bullets, each `N. [key] text`, the key a short noun unique in the Project. On a Project that already holds Bullets, draft only what the Work repository shows and the existing Bullets do not claim. Done when every draft passes the five rules and every number in it is in the Work repository, the Overview or the Notes.
4. **Edit.** Take the person's editing rounds in the same numbered format, reprinting the full list after each. Done when the person confirms a list.
5. **Write.** Append the confirmed Bullets as `- [key] text` lines at the end of `## Bullets`, then run `npm run build`. A failure names the Bullet; fix it with the person and run again. Done when the build passes and the existing Bullets are unchanged.

Argument received: $ARGUMENTS
