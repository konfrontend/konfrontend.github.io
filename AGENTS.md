# CV workspace

The CV source for Konstantin Dolbilov. Facts are gathered per project into a pool, ported into the draft, and rendered to a one-page PDF.

## Files

- `draft.md`: the CV itself.
- `projects/<project>/highlights-pool.md`: the highlights pool for one project, the only durable record of a scan.
- `CV_Konstantin_Dolbilov.pdf`: the rendered CV. `index.html` redirects GitHub Pages to it.
- `build/`: the PDF pipeline that `cv-pdf` runs, and `lint.mjs`, which checks the draft and every pool against the guidelines' mechanical rules. The pre-commit hook in `.githooks/` runs it; wire it once per clone with `git config core.hooksPath .githooks`.
- `docs/cv-guidelines.md`: every rule for facts, highlights, bullets, keywords, and the pool and draft structure. Read it before writing to a pool or to the draft.
- `docs/cv-review.md`: the brief for the reviewer subagent that `cv-scan` and `cv-port` dispatch before the user sees a candidate.
- `GLOSSARY.md`: the domain terms. Use them in chat, tickets and files.

## Skills

Project skills in `.claude/skills/cv-*/`. Each skill is one stage; a stage never runs another as a side effect.

- `cv-scan`: reads one repository and writes approved highlights to its pool, in gather or deepen mode.
- `cv-port`: rewrites hand-picked highlights from one pool into bullets in `draft.md`.
- `cv-pdf`: renders `draft.md` to `CV_Konstantin_Dolbilov.pdf` and checks it fits one A4 page.

## Agent skills

### Issue tracker

Issues live in Linear, workspace `gembag`, team `GEM`, project "Professional Profile". See `docs/agents/issue-tracker.md`.

### Triage labels

Default five labels, names equal roles. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
