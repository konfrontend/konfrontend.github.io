# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root: the one glossary, for the Profile, the resumes and the triage.
- **`AGENTS.md`** at the repo root: the folders, the rules and the commands. This repo keeps no ADRs; a decision that lasts is a rule there.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag rule conflicts

If your output contradicts a rule in `AGENTS.md`, surface it explicitly rather than silently overriding:

> _Contradicts the rule "a Gap never enters a Letter", but worth reopening because…_
