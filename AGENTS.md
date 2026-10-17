# CV workspace

The CV source for Konstantin Dolbilov, web developer. The master holds every bullet; a version picks the ones that fit one application. `cv-pdf` renders a version through `build/` to a one-page A4 PDF. The resumeskills skills in `.agents/skills/` do the tailoring: installed and updated by the `skills` CLI (`npx skills add`, `npx skills update`), tracked in `skills-lock.json`, symlinked from `.claude/skills/<name>`. `GLOSSARY.md` names the terms: use them in chat, tickets and files.

## Files

- `data/master.md`: the master: contact, summary versions, skills, one entry per project linking its project file. Never rendered.
- `data/projects/<project>.md`: the project file: frontmatter meta with its `keywords`, then the project's Stories by Theme.
- `data/profile/`: the Profile beside the master: `profile.md`, `voice.md`, the Skill ledger `skills.md`, one Answer per file in `answers/`.
- `data/candidates/`: one folder per Candidate, gitignored; `archive/` holds the desk Candidates for reference, read by no Route.
- `versions/general.md`: the general version behind the public `Konstantin_Dolbilov_Resume.pdf`; `index.html` redirects GitHub Pages to it.
- `docs/format-rules.md`: the rules a rendered version follows, including the tailored file's name and place.

## Workflow for an application

Each step is one skill call on the previous step's output.

1. `job-description-analyzer` on the posting: match score and gaps.
2. Create the tailored version from the master, named and with its skills picked as `docs/format-rules.md` says: contact, the fitting summary, skills, one entry per project.
3. `resume-tailor` against the analysis: pick each project's bullets from its project file.
4. `resume-bullet-writer`, then `resume-quantifier`, on the picked bullets; `tech-resume-optimizer` for role fit.
5. `resume-ats-optimizer`: keyword match against the posting.
6. `cv-pdf <path to the version>`: every check PASS, one A4 page.
7. `cover-letter-generator` from the tailored version and the posting.

## Agent skills

### Issue tracker

Issues live in Linear, workspace `gembag`, team `GEM`, project "Professional Profile". See `docs/agents/issue-tracker.md`.

### Triage labels

Default five labels, names equal roles. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
