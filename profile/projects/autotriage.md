---
url: https://github.com/konfrontend/autotriage
role: Author & Sole Developer
employment: independent
start: Sep 2026
---
# autotriage

## Description
Claude Code plugin that triages a freelance job posting and writes the proposal letter inside hook-enforced rails.

## Keywords
`Claude Code`, `Node.js`, `JSON Schema`, `Agentic Workflows`, `Prompt Engineering`, `Domain Modeling`, `Architecture Decision Records`, `Ajv`

***

### Plugin
Built a public Claude Code plugin that triages a freelance job posting and writes a ready-to-paste proposal letter in 1–2 minutes instead of 30–60; 17 postings triaged, 11 letters written.

### Judgment vs Arithmetic
Split judgment from arithmetic: the model flags risks and scores fit, a Node.js script computes the verdict, and the proposal step refuses a stored verdict the script cannot reproduce.

### Catalogue Rules
Moved the rules out of prompts into catalogue files with YAML frontmatter, one source that scripts and the model both read; skill files only sequence steps.

### Hook Rails
Enforced the workflow with Claude Code hooks: they deny an out-of-order step and tell the model why, and validate every data write against its JSON Schema with Ajv.

### Letter Checker
Built a Node.js letter checker that splits plain text into sections by blank lines and headers and runs 28 scripted checks, with 18 tests on node:test.

### Skills Ledger
Designed a skills ledger that logs each posting's required skills and surfaces a gap once 3 postings ask for it; updates need user confirmation, and an ADR justifies YAML over SQLite.

### Fact Tracing
Required the model to trace each letter fact to a past job, profile field, posting line, or calculation; it asks the user about any unsourced fact and saves confirmed ones to the profile.

### Verification Fixes
Built letter verification that applies its own fixes in place: 12 model-judged checks run only after 28 scripted checks pass, and each run ends passed or stopped on one user question.

***

## Notes
