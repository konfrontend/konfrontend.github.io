# Professional profile

The professional profile of Konstantin Dolbilov, web developer, and the two things made from it: resumes and the triage of Jobs. The Profile is the source of truth; a Version and a Letter derive from it, never the other way round. `GLOSSARY.md` names the terms; use them in chat, tickets and files. Say resume, never CV. `README.md` is the human reader's description of the repo: what it holds, the folders, the commands, the workflow for an application.

## Documentation

- Two places hold what an agent reads: `docs/` at the root, one file per topic, and a skill's `refs/` (`.claude/skills/<skill>/refs/`) for what only that skill follows. This file points at `docs/` by topic; `README.md` is for human readers and may point at `docs/` too.
- No research files. A finding with practical value is compacted into the doc or ref it backs, its source cited there, and the research is deleted. What fits none of these places is not kept in the repo.

## Rules

- Scripts are TypeScript run by Node 24 directly, erasable syntax only; `tsc --noEmit` checks them. One root `package.json`, relative imports.
- A State skill's guard line prints the context or `autotriage: <state> refused …`; the skill prints a refusal verbatim and stops.
- Data follows the root, code follows the module: the Profile, the Candidates and the Versions resolve from `repoRoot()` in `profile/lib` (`CLAUDE_PROJECT_DIR`, else the repo); the catalogue, the schemas, the templates and `resume.css` from their own module. A test fixture holds data only.
- `profile/lib/` is the one Profile reader and the Profile check; it never reads `private/` or `resume/`. `autotriage/` reads the Profile through it and writes only Candidates. `private/` is gitignored; `private/candidates/archive/` is read by nothing.
- Authored content (the Profile, the Candidates, the public PDF, `index.html`) is edited by the person. Generated content (`profile/skills.md`, a Version's sourced lines, a Bullet's rendered form) is regenerated, never hand-edited.
- A Bullet is written by the Bullet rules and reviewed by the person. A wording one application needs is a Variant in that Candidate's `version.md`, never a Bullet edit.
- A Letter cites a Project's meta, its Overview, a Bullet by key, its Notes, or an Answer. A fact the Profile lacks is asked for once and, when confirmed, appended to the Project's `## Notes`; no State edits an Overview. A Gap never enters a Letter or a Version.

## Docs by topic

- Format of a rendered Version: `docs/format-rules.md`.
- Issue tracker: Linear, workspace `gembag`, team `GEM`, project "Professional Profile". See `docs/agents/issue-tracker.md`.
- Triage labels: default five labels, names equal roles. See `docs/agents/triage-labels.md`.
- Domain docs: one glossary, `GLOSSARY.md` at the repo root, for the Profile, the resumes and the triage. No ADRs: a decision that lasts is a rule in this file. See `docs/agents/domain.md`.
