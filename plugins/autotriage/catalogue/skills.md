# Skill ledger

The Profile's Skills live in `data/profile/skills.md`, one row per Skill in the frontmatter (schema `scripts/schemas/skills.schema.json`; the fact-store decision of GEM-337 replaced ADR 0003). The ledger is a summary: Level, category, aliases, roles and a Seen count. Evidence is never stored; it derives from the Projects' `keywords` (`data/projects/<slug>.md`). `setup` writes it, `triage` records into it when the human confirms the changes, `/autotriage:skills` prints it. This file is the single place the row contract, the Level tests, the Target rule, and the matching rules live; the skills only sequence them.

Portable across Profiles. The rows are the freelancer's; the rules are not.

## File

```yaml
target_after: 3                   # Seen count at which a Gap becomes a Target
categories:                       # category key -> heading, in print order (the master's skills headings)
  frontend: Frontend
  backend: Backend
skills:
  - { name: React, category: frontend, level: shipped, keywords: [react.js], roles: [full-stack, frontend], seen: 1 }
  - { name: Stripe Connect, category: backend, level: gap, keywords: [stripe], roles: [], seen: 1 }
```

## Row

- `name`: the Skill as the Letter would name it. Unique, case-insensitive.
- `category`: a key of the `categories` map. The map is the Profile's own headings; a row with a key the map lacks is invalid.
- `level`: `gap`, `learning`, `used`, `shipped`. Tests below.
- `keywords`: lowercase strings a Job may use for the Skill instead of its name (`sql`, `db`, `postgresql`). Free; added by hand when a match was missed.
- `roles`: which Versions show the Skill (`full-stack`, `frontend`); empty keeps it out of every Version. The plugin reads it for nothing; the CV renderer does.
- `seen`: how many Candidates' Jobs required the Skill, an integer. Incremented by `triage` only after the human confirms the changes, never edited by hand except to correct a wrong match. The Candidates themselves are not listed: a count serves the Target rule without leaking the Jobs pursued.

Evidence, the Projects that prove a Skill, is derived: every valid `data/projects/<slug>.md` names in its `keywords` the ledger Skills it proves, by ledger name, case-insensitive. A `keywords` term the ledger lacks fails the Guard of every ledger-gated State: add the row or spell the term as its ledger name. `shippedWithoutEvidence` lists the `shipped` rows no Project names; the Guard prints them as a warning, never a refusal.

At least one row is `shipped`, or the Profile has nothing a Letter can cite.

## Level tests

- `shipped`: a Project in its Evidence shows the Skill in production, in the Project's own Stories. A `shipped` row with no Project in Evidence is a Guard warning: the Project file that proves it is still to be written.
- `used`: used in a Project, not shipped there (a prototype, a tool of the work, a side path).
- `learning`: studied, no Project uses it.
- `gap`: a Job required it and the freelancer has not used it. A Gap exists only because a Job required it; nobody adds one by hand.

Bumping a Level is a Profile edit: change `level` and add the Skill's ledger name to the `keywords` of the Project that proves it, in the same edit.

## Target

A Target is a Gap whose `seen` count is at or above `target_after`. Targets print first. They are a signal only: what the freelancer does about a Gap is outside the plugin.

## Matching rules

`triage` lists the Job's required items against the ledger:

- Only required items count: a must, a required skill, the existing codebase. A preferred, nice-to-have, or `a plus` item is never listed, so it never appends to `seen` and never spawns a row.
- Only technologies and domain practices are items (Stripe Connect, RBAC, escrow, Supabase). Years of experience, spoken languages, seniority words, and working arrangements are not Skills.
- One Job item may match several rows: `React/Next.js` appends to both React and Next.js.
- A row matches by `name` or by any `keyword`, whole words, case-insensitive: `SQL database` matches a row with keyword `sql`. `node scripts/skills.mjs match <item>` applies this rule; the model confirms the list and adds a row the rule missed or drops one it caught by accident.
- An item with no matching row spawns a new row at `gap` with `seen: 1`, `category` chosen by the model from the `categories` keys, `keywords` and `roles` empty.
- Recording is idempotent: `record` writes the rows it counted into the Candidate's `job.md` as `recorded_skills`, and a re-run on that Candidate leaves those rows alone (a corrected re-run counts only the rows the marker lacks). A row that already exists is not spawned again.

## Print

`/autotriage:skills print` renders three groups, Targets, then Gaps, then the rest, each sorted by `seen` descending; columns `name`, `level`, `category`, `evidence` (the Project slugs, derived), `seen`. After the table: the `shipped` rows with no Project in Evidence, when any. `print gaps` shows the first two groups only.
