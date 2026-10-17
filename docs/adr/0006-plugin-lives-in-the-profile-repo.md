---
status: accepted
---

# The plugin lives in the repo that holds the data; the private data is gitignored

Supersedes ADR 0004. Decided while charting GEM-334 (Linear) and executed by GEM-335.

autotriage lives at `plugins/autotriage/` of this repo, the one professional-profile repo, keeping its own plugin layout; its history came in by a full-history `git subtree add`. The data lives beside it: `data/profile/` is committed, `data/candidates/` is gitignored with no history. ADR 0004 kept the plugin and the data in separate repos because private data once leaked into a public one; gitignoring the private part meets that concern at a lower cost than two repos, and GitHub Pages on the free plan serves only a public repo, so a private PP was rejected. The plugin is ported out again once it is reliable for a random freelancer, so the runtime dependencies stay vendored in `scripts/vendor/deps.mjs` and `.claude-plugin/marketplace.json` is kept.

How the plugin loads today: through `claude --plugin-dir plugins/autotriage` from the repo root. GEM-335 registered a local `directory` marketplace in the committed `.claude/settings.json`; commit `9833607` reset that file to empty, so no committed setting loads the plugin. `scripts/paths.mjs` still resolves `data/` from `CLAUDE_PROJECT_DIR`, else the working directory, so the session starts at the repo root.

## Considered options

- Two repos, the plugin installed from its own marketplace (ADR 0004): no leak by construction, but every shape change crosses a repo boundary and a version bump. Rejected until the port out.
- A private PP publishing to a public Pages repo: not simpler on the free plan. Rejected.
- A local `directory` marketplace in the committed settings (GEM-335): applies only after workspace trust, and a user-level marketplace of the same name wins over it. Reset in `9833607`; `--plugin-dir` serves until the port out.
