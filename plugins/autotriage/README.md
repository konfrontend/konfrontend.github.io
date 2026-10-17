# autotriage

A Claude Code plugin for freelancers who bid on Upwork jobs. Paste a job posting, read a one-screen triage Verdict, answer go or no-go, and get a proposal Letter ready to paste.

The model works inside fixed rails. Every Job takes the same Route, `intake` → `triage` → checkpoint → `proposal` → `verify`. Hooks refuse a step taken out of order. Scripts compute the Verdict, so the model never decides it by feel. Every claim in a Letter must trace back to a fact in your Profile. The vocabulary (Job, Candidate, Verdict, Flag, Family, Letter, Slot, ...) is defined in [`CONTEXT.md`](CONTEXT.md).

## Install

Requires Claude Code and Node 20+. The plugin becomes a dependency of a project of your own. That project holds your data in `data/`; this repo never does. No review by Anthropic is involved: this repo serves as its own plugin marketplace.

Inside your project directory:

```bash
claude plugin marketplace add konfrontend/autotriage --scope project
```

```bash
claude plugin install autotriage@konfrontend --scope project
```

`--scope project` records the marketplace and the plugin in the project's `.claude/settings.json`. Commit that file, and the dependency is declared. Then start `claude` at the project root and run `/autotriage:setup`.

To update, run `claude plugin marketplace update konfrontend`. Updates arrive when `version` in `.claude-plugin/plugin.json` changes.

## Skills

All skills are namespaced `/autotriage:<name>`.

### Human-invocable only

The model cannot start these. Type them yourself.

| Skill | What it does |
| --- | --- |
| `/autotriage:setup` | Builds or refreshes your Profile under `data/profile/` from pasted sources (Upwork profile, CV, past Letters). It also offers to add the plugin's permission rules to the project's `.claude/settings.json`. Run it once before anything else. |
| `/autotriage:route` | Runs one Job through the whole Route in one sitting: intake, triage, checkpoint, proposal, verify. Paste the Job with it. |

### Agent-invocable

The model can call these on its own, for example to run the Route step by step when `route` is not in play. You can also type them.

| Skill | What it does |
| --- | --- |
| `/autotriage:intake` | Records a pasted Job as a Candidate folder `data/candidates/YYYY-MM-DD-<slug>/` with its `job.md`. |
| `/autotriage:triage <candidate>` | Detects Flags, the Family, and scores; a script computes the Verdict; you answer go or no-go at the checkpoint. Then it shows the Skill ledger changes and records them only when you confirm them, as a separate question. |
| `/autotriage:version <candidate> [--tailor]` | Employment route only: picks the Version by the posting's role title (`general` or `frontend`) and records it in `job.md`. With `--tailor` it records `tailored` and copies the picked Version into the Candidate folder as `version.md` for you to edit. |
| `/autotriage:proposal <candidate>` | Writes the Letter for a Candidate with decision `go`, from the Family template, the voice rules, and the Profile. |
| `/autotriage:verify <candidate>` | Reviews the Letter against the Checks and applies the Fixes in place. Ends with the Letter ready to paste. |
| `/autotriage:skills [print \| print gaps]` | Prints the Skill ledger: Targets (Gaps that Jobs keep asking for), other Gaps, then the rest. A signal only; what you do about a Gap is up to you. |
| `/autotriage:tracker [print]` | Prints the Tracker: every Candidate with its route, decision, Family or Version, and outcome, open ones first, from each `job.md`. Set `outcome` in `job.md` by hand. |

`<candidate>` is the Candidate folder name under `data/candidates/`.

## Guards

Each skill checks its preconditions before it loads. It refuses to run out of order, names the reason, and names the command to run instead.

| Skill | Requires |
| --- | --- |
| `route` | valid `profile.md` and `skills.md`, at least one valid `projects/<slug>.md`, `voice.md` |
| `intake`, `setup` | nothing |
| `skills` | valid `skills.md`; every Project `keywords` term is a ledger Skill |
| `triage <c>` | valid `profile.md` and `skills.md`; valid `job.md`; no `letter.md` (`cover-letter.md` on the employment route) yet |
| `version <c>` | valid `job.md`; `route: employment`; `decision: go` |
| `proposal <c>` | full Profile gate; `job.md` with a `verdict` block that recomputes to the same values; `decision: go`; on the employment route also `version` set, `version.md` present when `version: tailored`, and the summary the Intro Slot reads |
| `verify <c>` | full Profile gate; `decision: go`; valid `letter.md`, or valid `cover-letter.md` on the employment route |

A hook checks every write under `data/` against the file's schema. The write has already landed, so a bad file is not undone: the hook returns the errors to the model, and the next skill's Guard refuses the file until it is fixed.

## Your data

```
data/
  profile/      profile.md, skills.md (the Skill ledger), voice.md
  projects/     one file per Project: frontmatter meta and keywords, Stories under Themes
  candidates/   one folder per Job: job.md (route freelance or employment), letter.md on the freelance route; cover-letter.md and version.md when tailored on the employment route
```

Everything is Markdown with YAML frontmatter, and you can edit all of it by hand. Keep the project in a private git repo if you want a history of your Letters.

## Develop

```bash
npm install
```

```bash
npm test
```

Run the plugin from a checkout, in a project that has `data/`. `--plugin-dir` overrides the installed copy for that session:

```bash
claude --plugin-dir ~/path/to/autotriage
```

Edits to a `SKILL.md` apply at once; edits to hooks, scripts, and catalogue files apply after `/reload-plugins`. The runtime dependencies (`ajv`, `yaml`) are bundled into `scripts/vendor/deps.mjs`, so the installed plugin needs no `npm install`. After changing a dependency, rebuild the bundle with `npm run vendor`. Decisions are recorded in `docs/adr/` at the PP root.

## License

MIT
