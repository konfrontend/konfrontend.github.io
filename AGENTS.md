# Professional profile

The professional profile of Konstantin Dolbilov, web developer, and the two things made from it: resumes and the triage of Jobs. The Profile is the source of truth; a Version and a Letter are written from it, never the other way round.

## Documentation

- Never write to AGENTS.md before the person approves a proposed draft.

## Rules

- `profile/lib/` is the one Profile reader. `autotriage/` reads the Profile through it and writes only Candidates. `private/` is gitignored; `private/candidates/archive/` is read by nothing.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
