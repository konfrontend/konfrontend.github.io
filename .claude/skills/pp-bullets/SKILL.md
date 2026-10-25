---
name: pp-bullets
description: Draft Bullets for one Project from its Work repository and append the confirmed ones to the Project file.
disable-model-invocation: true
argument-hint: "[<project-slug>] [<work-repository-path-or-url>...]"
---

Drafts Bullets for one Project, `profile/projects/<slug>.md`, from its sources, the Project's Overview and its Notes, with the person reviewing every draft. Terms are `GLOSSARY.md`'s. The skill writes two things, both appended: confirmed Bullets as `- [key] text` lines at the end of `## Bullets`, and each confirmed answer no confirmed Bullet carries as a `- ` line at the end of `## Notes`. A fact lives in one place: a Bullet states it, or a Notes line keeps it for a later Bullet or a Letter. The meta and the Overview are the person's; a change they need is reported, not made.

The sources come from the arguments or from the person each run and stay in the conversation: the Work repository's local path, else its URL, else whatever the person gives (a screenshot, a pasted text). A local path in the Profile would ship in the public repo and break on any other machine. Thinner sources mean more questions in step 3, never more guesses in a draft.

## The Bullet rules

A Bullet is read by a recruiter in seconds and defended by the person at interview, so each rule guards one of those two readings. The Profile check (`npm run build`) scripts a part of rules 2 and 3 and reports the rest to nobody: the writer and the reviewer judge it.

1. **Shape**, in order: what was delivered, its measured effect, how it was done. A part the sources, the Overview, the Notes and the person's answers do not fill is left out: an estimate the person cannot back fails at interview, and a Bullet with no effect still reads as a delivery.
2. **Opener**: a past-tense active verb naming what the person did ("Built", "Cut", "Wrote"), so the Bullet reads as an achievement, not a duty. A Bullet on work with AI coding agents opens with an engineering verb ("Designed", "Built", "Set up") and names the artifacts the person made (instruction files, glossaries, conventions, hooks): the person owns the system, the agents are the tool. One or two rendered lines, about 250 characters at most; `resume-pdf` measures the render.
3. **Numbers**: at most three measured claims, a claim's base or range counted with it ("from 85 to 99", "37 of 84", "10–50"); a relative number carries its base (the before value, the period or the sample), since "40% faster" alone is unverifiable. Every number in a draft is traced to a command, a file, a URL, an image, a Notes line or an answer from step 3.
4. **Keywords**: a technology is named by its Keyword from the Project's `keywords`, the one spelling an ATS matches. A Keyword that names a vendor names the product used ("Cloudflare Tunnel", "Cloudflare Workers"), since a bare vendor says nothing of what was built. A Keyword that carries an abbreviation is spelled in full where it stands as its own noun phrase ("role-based access control (RBAC)") and as the abbreviation where it modifies a noun ("MCP server", "R&D prototype"); the Version's Skills line carries the full spelling. A technology the sources show and `keywords` lacks is reported to the person, who adds it to the meta before the Bullet is written.
5. **Share**: team work states the person's own share when the sources show it (commit share, files authored alone).

## Steps

1. **Resolve the arguments.** With no slug, print every Project with its Bullet count, fewest first, and ask which. With no source, ask for one: the Work repository's local path, else its URL, else a screenshot or a pasted text. Done when one slug names a Project file and every source reads: a path is a git repository, a URL answers.
2. **Read.** The Project file: `keywords`, `## Overview`, `## Bullets`, `## Notes`. In each local Work repository, `git shortlog -sne` to pick the person's author identities (confirm the pick when more than one name could be theirs), then what the repository can show: their commits (count, span, files touched), test and component or module counts, the stack from the manifests, before-and-after numbers stated in commit messages or a changelog. A GitHub URL gives the same through `gh`: `gh repo view`, `gh api repos/<owner>/<repo>/contributors`, `gh api 'repos/<owner>/<repo>/commits?author=<login>'`, the languages and the manifests. A screenshot or a pasted text gives what it shows. Done when each number is listed with the command, file, URL or image it came from.
3. **Ask.** One batch of numbered questions, each for one thing a Bullet needs and the sources cannot show: users or scale, latency or load time, cost or time saved, business outcome. A recommended answer goes only on a question the sources back (the person's share of the commits); the others stay open, so no guess reaches the Profile. The confirmed answers stay in the conversation until step 6; a declined question leaves its part out of the Bullet. Done when each question is answered or declined.
4. **Draft.** Print numbered drafts, `N. [key] text`, the key a short noun unique in the Project. On a Project that already holds Bullets, draft only what the sources show and the existing Bullets do not claim. Done when every draft passes every Bullet rule, with each number's source and each technology's Keyword named beside the draft.
5. **Edit.** Take the person's editing rounds in the same numbered format, reprinting the full list after each. Done when the person confirms a list.
6. **Write.** Append the confirmed Bullets at the end of `## Bullets`, then each step 3 answer no confirmed Bullet carries at the end of `## Notes` as one `- ` line. Run `npm run build`, and read its output for the new keys: an error or a warning on one names the Bullet to fix with the person, then run again. Warnings on other keys are the Profile's standing state, not this run's. Done when every answer sits in exactly one place, a confirmed Bullet or a Notes line, the build reports nothing on the new keys, and the earlier Bullets and Notes lines are byte for byte as read in step 2.

Argument received: $ARGUMENTS
