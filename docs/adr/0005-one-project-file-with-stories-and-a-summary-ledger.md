---
status: accepted
---

# One Project file per Project, Stories as its only prose, the ledger a summary

Supersedes ADR 0003. Decided by the prototype of GEM-337 (Linear, map GEM-334) on the Loadster Project.

Both routes read one source per Project, `data/projects/<slug>.md`. Its frontmatter holds meta only: `name`, `url`, `role`, `employment` (`full-time`, `part-time`, `contract`, `freelance`, `independent`), `start`, `end` (absent while ongoing), `naming`, `domain`, `description` and `keywords`. Its body is Stories under Themes: a Story is one list item whose lead line is the Bullet verbatim and whose indented context lines carry the Facts behind it. Stories are the only prose in the file. The Version heading line, the Bullets, the Master entry and the rendered keywords line all derive from it; the role suffix and the date format are renderer rules.

`data/profile/skills.md` is a summary ledger: one row per Skill with `name`, `category`, `level`, `keywords` (aliases), `roles` (the Versions that show it) and `seen` (a count). Evidence is never stored: it derives from the Projects' `keywords`, which the person writes by hand. `record` increments `seen` and leaves a marker in the Candidate's `job.md`, so a re-run is a no-op. A Skill's Level is stored; `shipped` with no Project in Evidence is a Guard warning, not an error.

We chose this over structured facts because the Bullets are tuned prose a person reads and edits, and the plugin and `cv-pdf` need one file to agree on, not two.

## Considered options

- YAML Facts with ids behind each Bullet (ADR 0003's direction): duplicated the prose line for line, and tied each Skill to a Fact. The Skill link drops to Project level (`keywords`); a number check becomes a regex over the cited Story. Rejected.
- An Engagement paragraph per Project: became the `employment` field; lines such as "replied within one working day" are cut. Rejected.
- Seen as a list of Candidate slugs (ADR 0003): leaks the Jobs pursued into a public repo; a count serves the Target rule. Rejected.

## Consequences

- The plugin and `cv-pdf` must read this shape (GEM-349 and GEM-348).
- `data/master.md` becomes derived only after the voice, the Stories for every Project and the upstream skills adoption are in.
- The rendered keywords line grows: one ledger name per Skill, plus the Skills the Stories name.
