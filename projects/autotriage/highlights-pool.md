# [autotriage](https://github.com/konfrontend/autotriage)

Author & Sole Developer | Sep 2026 – Present

Claude Code plugin that triages a freelance job posting and writes the proposal letter inside hook-enforced rails.

## Agent workflow design

- **A** Authored a Claude Code plugin, alone and public under MIT, that takes a pasted freelance job posting through a fixed route, intake, triage, a go or no-go checkpoint, proposal and verify, one skill per state, and ends with a proposal letter ready to paste.
- **A** Split judgment from arithmetic: the model detects risk flags, each with a verbatim quote from the posting, scores fit and picks the engagement family; a Node.js script computes the alert level, hard stops and verdict from those and the profile's floors. The proposal guard recomputes the verdict and refuses a job file that disagrees, and the human's decision sits in its own field next to the script's recommendation.
- **B** Fixed the vocabulary before the code: a glossary of 24 terms, each with the words to avoid, that every skill, catalogue, script and ADR uses, and four architecture decision records with the options considered. One was amended after tests against a Claude Code release: a forked context per state was dropped because a forked subagent cannot ask the human, and a Stop hook because it fires on every turn.
- **B** Kept the prompts thin and the rules in data: each skill file only sequences its steps, while the flags, families, letter slots, voice rules and checks live in catalogue files with YAML frontmatter that the scripts and the model both read, so a rule changes in one place and the catalogue carries over to another freelancer's profile.

## Deterministic rails

- **A** Enforced the route with hooks: a guard script injected as the first line of every route skill aborts it before the model reads the body, a PreToolUse hook on the Skill tool denies an out-of-order call and returns the reason to the model, and a PostToolUse hook validates every write under the data folder against its JSON Schema with Ajv and hands the errors back.
- **B** Built the verify script: it segments a plain-text letter into its slots from block order and headers alone, with no markers in the text, runs the 28 script checks and prints findings with line numbers and fix kind, the slot map and the brief for the model pass, which runs only once the script reports no failure. 18 tests on the Node.js test runner, verify's fixtures seeding one finding per check group.
- **C** Built the skill ledger as a Markdown file of YAML rows, chosen over SQLite in an ADR: triage appends to it only after the human confirms the changes, as a question separate from go or no-go, and the gaps jobs keep asking for are derived when the ledger prints, so no stored status drifts from the rows.

## Letter generation and verification

- **B** Designed the catalogue the route runs on: 23 risk flags on a five-level scale, each with cues, a mitigation and the letter slot that states it, plus green and stop flags, 4 engagement families that pick the letter template, 13 letter slots with size caps, voice rules with banned phrases and patterns, and 40 checks, 28 by script and 12 by model, with six fix kinds, a three-cycle cap and two regenerations per slot.
- **A** Made every claim in a letter traceable: the letter is filled slot by slot, each fact must trace to a past job bullet, a profile field, the job text or arithmetic on profile numbers, and a fact with no source is put to the human, whose confirmed answer is appended to the profile before the slot regenerates.
- **B** Designed verify as a code review that applies its own fixes: findings graded fail or warn, each with one of six fix kinds, the letter file after verify is the corrected letter, and the run ends as pass, or as stopped with one question for the human.

## Distribution and use

- **A** Shipped it as an installable plugin from a repository that is its own marketplace: a project-scope install recorded in the project's settings file, the runtime dependencies (Ajv and yaml) bundled with esbuild into one vendored module because the plugin cache's install step is undocumented, the data kept in the installing project under its own git, and a setup wizard that builds the profile from pasted sources and offers to merge the permission rules a plugin cannot ship.
- **B** Ran it on real Upwork postings: 17 jobs triaged and 11 letters written against a profile of nine past jobs and a 62-row skill ledger, with the script's verdict and the human's decision recorded side by side on every job.

**Skills:** Claude Code, Node.js, JSON Schema, Agentic Workflows, Prompt Engineering, Domain Modeling, Architecture Decision Records
