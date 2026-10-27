---
name: resume-version
description: Generate a Version from the Project files - the general Version with no argument, or a Candidate's tailored version.md for its Job. Judges the title, the summary, the Skills lines and the ranked Bullets, writes the Plan, runs the cut, then checks the render.
argument-hint: "[<YYYY-MM-DD-slug>]"
---

A **Version** is the Markdown twin of its PDF, generated from the Project files (`GLOSSARY.md`): the name, the title, the contact line, the summary, the `## Skills` lines, then one entry per Project under `## Professional Experience` and `## Projects`, each `### [slug] Name – description`, a role row `Role | Dates`, and `- [key] Bullet` lines. This skill judges and the script assembles: the judgment is the **Plan**, one JSON the skill passes on stdin and never writes to disk, and `resume/scripts/generate.ts` turns it into the Version in resume order, Bullets inside a Project in Plan rank, dropping the lowest-ranked Bullet until one A4 page holds. With no argument the Version is `resume/versions/general.md`, the one stored base Version behind the public PDF. With a Candidate folder it is `private/candidates/<folder>/version.md`, that Job's tailored Version, generated fresh from the Project files for its `job.md`, never by subtracting from the general one. A tailored Version is generated once; `--refresh` is for base Versions only.

The Plan:

```json
{ "title": "Full Stack Developer", "summary": "...", "skills": ["Label: Keyword, Keyword"], "bullets": [{ "project": "<slug>", "key": "<key>", "text": "<Variant, tailored only>" }] }
```

`bullets` is one ranked list across every Project, best first. The cut drops from its end, so rank is the only lever on what survives. `text` is set only for a Variant.

## Rules

The skill selects, orders and re-terms; it never changes a number, a title or a date, and never names a Skill that is no Project's Keyword.

- **Title.** General: the role the Profile sells as a whole. Tailored: the posting's title as the Job's `title` states it, its seniority word kept when the Profile supports it.
- **Summary.** Identity or title, years, key Skills, value, in one sentence or two. It names the title's role noun ("developer") so the ATS and the reader match it. No objective, no trait filler, no third person; the Profile's `banned_phrases` in `profile/voice.md` apply, since the Letter's intro inherits the summary.
- **Skills lines.** `Label: Keyword, Keyword`, every term spelled as the Project file's `keywords` spell it, the posting's spelling never. No Skill twice, no proficiency label, no soft skill. A term enters only when a posting for the title's role would name it; a term without a backing Bullet still enters when it passes. Geometry terms (Computational Geometry, CSG, BVH, CGAL) fail this test for a frontend or full-stack title and stay in their Bullets. Tailored: the lines and the terms inside them ordered by match to the Job's `requirements`, the top five requirements in the first lines. A requirement lands in the summary first, the Skills lines second, a Bullet third; stop once it is covered.
- **Bullets.** Rank the canonical Bullets of every Project: the newest and most relevant first, the oldest and least relevant last, so the cut drops them first. Inside a Project the Bullet that answers the Job's top requirement ranks first. The general Version ranks for the title's role across the whole Profile.
- **Variants** (tailored only). A Variant carries the key of a canonical Bullet and shifts its focus, by `docs/format-rules.md`, Bullets: it reorders and re-emphasises that Bullet, never adds a claim; every number and Keyword it names is in the canonical Bullet. A wording the canonical Bullet cannot back is not a Variant; it is a Bullet edit for the person, outside this skill. A base Version holds no Variant.
- **Gaps.** A requirement no Project proves never enters the Version.
- **Flags.** A term or wording the skill questions to the person cites what backs the doubt: a rule in this file, `docs/format-rules.md` or the Bullet rules, or a trusted source's URL (a career center, a published guide). A doubt with no source stays unsaid, since the person acts on each flag.

## Steps

1. **Read.** `profile/profile.md` (`resume_order`, the contact facts), every `profile/projects/<slug>.md` (its `keywords`, its `## Overview`, its `## Bullets`), `docs/format-rules.md`. With a Candidate (`$ARGUMENTS`): `private/candidates/$ARGUMENTS/job.md`, its `title` and `requirements`. Read the current Version when one exists, for the change report. Done when every Bullet key and every Keyword is in view.
2. **Judge.** Compose the Plan by the rules above. Done when every `project`/`key` names a Project file and a Bullet in it, and every Skills term is a Keyword.
3. **Generate.** Run `node resume/scripts/generate.ts <target> <<'EOF'`, the Plan, then `EOF`, the target `resume/versions/general.md` or `private/candidates/$ARGUMENTS/version.md`. The script refuses a Plan with an unknown key, or a Variant bound for a base Version. Done when it prints `Wrote <target>: 1 page(s), N Bullets kept` and the Bullets it cut.
4. **Check.** Run `node resume/scripts/render.ts <target> --check`. Every check must be PASS; a WARN is reported with the fix (`.claude/skills/resume-pdf/SKILL.md`, Failures), a FAIL is fixed in the Plan and the Version regenerated. The `variant claims` WARN is this step's review: read each Variant against its canonical Bullet by `docs/format-rules.md`, Bullets. Done when no check fails and every WARN is explained.
5. **Report**. Print, never store: the summary before and after, the Skills lines' order, the Bullet keys added and dropped, the Bullets cut, and for a tailored Version each requirement of the Job and where the Version carries it (summary, Skills line, Bullet) or that it is a Gap. Done when the person has the report and the target path.

The PDF is not this skill's business: `resume-pdf <target>` renders it.

Argument received: $ARGUMENTS
