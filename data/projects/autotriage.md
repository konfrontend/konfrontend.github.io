**Agent workflow design**

- Authored a public Claude Code plugin, alone, that takes a freelance job posting through a fixed route, one skill per state, to a proposal letter ready to paste.
- Split judgment from arithmetic: the model detects risk flags with verbatim quotes and scores fit; a Node.js script computes the alert level and verdict, and the proposal guard refuses a job file that disagrees.
- Kept the prompts thin and the rules in data: skill files only sequence steps, while flags, families, letter slots, voice rules, and checks live in catalogue files with YAML frontmatter that scripts and model both read.

**Deterministic rails**

- Enforced the workflow with hooks that deny an out-of-order step and tell the model why, and validate every data write against its JSON Schema with Ajv.
- Built the verify script: it segments a plain-text letter into slots from structure alone, runs 28 script checks, and prints findings with line numbers and fix kind, with 18 tests on the Node.js test runner.
- Built the skill ledger as a Markdown file of YAML rows, chosen over SQLite in an ADR, appended only after the human confirms, with derived gaps so no stored status drifts.

**Letter generation and verification**

- Designed the catalogue the route runs on: 23 risk flags on a five-level scale, 4 engagement families, 13 letter slots with size caps, voice rules, and 40 checks with six fix kinds.
- Made every claim in a letter traceable: each fact must trace to a past job, a profile field, the job text, or arithmetic, and an unsourced fact is put to the human before the slot regenerates.
- Designed verify as a code review that applies its own fixes: findings graded fail or warn, the letter file after verify is the corrected letter, and the run ends as pass or stopped with one question.

**Keywords this experience covers:** Claude Code, Node.js, JSON Schema, Agentic Workflows, Prompt Engineering, Domain Modeling, Architecture Decision Records
