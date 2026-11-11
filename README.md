# Konstantin Dolbilov

Full-stack web developer and computer graphics enthusiast.

- Resume: https://konfrontend.github.io
- LinkedIn: https://www.linkedin.com/in/konstantin-dolbilov-94720b361

## The repo

The professional profile of Konstantin Dolbilov, web developer, and the two things made from it: resumes and the triage of Jobs. The Profile is the source of truth; a Version and a Letter are written from it, never the other way round. `GLOSSARY.md` names the terms; `AGENTS.md` holds the rules an agent follows.

## Folders

- `profile/`: the Profile, written by hand. `profile.md` (identity, contact, `terms`), `voice.md`, `answers/<slug>.md` (answers to recurring questions), `projects/<slug>.md` (one Project each: meta frontmatter, then `## Description` with the Bullets under their headings and the Keyword lines of their groups, then `## Notes`). `versions/<name>.md` holds the Versions, each written by hand, with the PDF printed beside it; `versions/resolve.ts`, with `keywords.ts` ranking the Keywords, fills a Version's slots, Bullet links and `{{keywords}}` markers from the Projects. `schemas/` holds the JSON Schemas of `profile.md` and `voice.md`. `lib/` is the one Profile reader.
- `resume/scripts/`: `print.ts` prints Markdown to PDF with `resume.css`. The public resume, `Konstantin_Dolbilov_Resume.pdf`, and `index.html` stay at the root for GitHub Pages.
- `autotriage/`: `catalogue/` (Flags, voice, Checks, Letter templates, the Candidate contract), `scripts/` (the guard, the Verdict, the Route's step scripts, the hooks, the tracker, tests), `schemas/` (the Candidate schema). It reads the Profile through `profile/lib/` and writes only Candidates.
- `private/`: gitignored. `candidates/<YYYY-MM-DD-slug>/` holds the Candidates: `job.md` and `letter.md`; `candidates/archive/` the desk Candidates, read by nothing.
- `docs/`: `agents/`, how agent skills use this repo; `research/`, notes from past research.
- `.claude/skills/`: `route` and its steps `route-intake`, `route-triage`, `route-proposal`, `route-verify`; `tracker` and `gaps`; `resume-pdf`. `.claude/settings.json` registers the hooks, always on, and the permission allow list.

## Commands

- `npm test`: the tests, then `tsc --noEmit`.
- `node profile/lib/cli.ts check`: the Profile check on `profile.md`, `voice.md` and the answers.
- `/resume-pdf [<version name>]`: prints `profile/versions/<name>.md` (default `frontend`) to a PDF beside it, one A4 page or a warning.

## Workflow for an application

`/route` with the posting pasted: intake, triage, the Checkpoint (the person answers go or no-go and the Verdict is written), proposal, verify. On the employment route the person sends the Letter with the Version they choose. `/tracker` prints where every Candidate stands; `/gaps` prints the Gaps and the Keywords Jobs asked for.
