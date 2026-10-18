# autotriage

A plugin of the professional-profile repo (the repo root one level up). The root `AGENTS.md` describes the whole repo; this file covers the plugin. The terms are in the root `GLOSSARY.md`.

## Plugin layout

This folder is the Claude Code plugin (`.claude-plugin/plugin.json`; `.claude-plugin/marketplace.json` makes the folder its own marketplace, which `.claude/settings.json` at the repo root declares with a directory source). `skills/<category>/<skill>/SKILL.md`, every skill listed in `plugin.json`: `route/` holds `route` (entry) and one skill per State, `profile/` holds `setup` and `tracker`. `catalogue/` holds the portable Families, Flags, voice, verify Checks, Letter templates and the Candidate artifact contract; `scripts/` the Guard (`guard.ts`, a typed transition table), the Verdict arithmetic, the State scripts, the hooks and the Candidate schemas (`schemas/`); `hooks/hooks.json` registers the hooks. Scripts are TypeScript run by Node 24 directly, erasable syntax only (no `enum`, no parameter properties); `tsc --noEmit` at the repo root checks them.

The plugin reads the Profile through `@konfrontend/profile` (the `profile/lib` workspace) and never parses a Profile file itself; `scripts/paths.ts` resolves the project the session runs in: the Profile in `profile/`, the Candidates in `private/candidates/`, the Versions in `resume/versions/`. The plugin writes only Candidates. Dependencies (`@konfrontend/profile`, `yaml`, `ajv`) are declared in `package.json`; nothing is vendored. Claude Code installs a plugin's registry dependencies when it caches a marketplace copy, so a port-out publishes `@konfrontend/profile` to npm and adds a `package-lock.json` here; loaded in place from this repo, the root `npm install` serves it.

Guards: the injected guard line in each SKILL.md always exits 0 and prints either the context or `autotriage: <state> refused …`; the SKILL.md's first instruction prints a refusal verbatim and stops, which also covers a `/autotriage:<state>` typed by the human, a path the PreToolUse hook does not see. Bump `version` in `plugin.json` on every release, or installed copies do not update.
