# autotriage

A Claude Code plugin for one person's job search. Paste a job posting, read a one-screen triage Verdict, answer go or no-go, and get a Letter ready to paste: a proposal on the freelance route, a cover letter on the employment route, where it also records which resume Version went out.

The model works inside fixed rails. Every Job takes the same Route, `intake` → `triage` → checkpoint → (`version` on the employment route) → `proposal` → `verify`. Guards refuse a step taken out of order. Scripts compute the Verdict, so the model never decides it by feel. Every claim in a Letter must trace back to a Story in the Profile. The vocabulary (Profile, Project, Story, Skill, Job, Candidate, Verdict, Flag, Letter, Slot, ...) is defined in the repo's [`GLOSSARY.md`](../GLOSSARY.md).

## Install

Requires Claude Code and Node 24+. The plugin reads a Profile folder (`profile/`) and writes Candidates (`private/candidates/`) in the project it runs in; it holds no user data of its own. In this repo it is enabled by `.claude/settings.json` (a directory marketplace at `./autotriage`), so every session opened at the repo root has it. Elsewhere, once published:

```bash
claude plugin marketplace add konfrontend/autotriage --scope project
```

```bash
claude plugin install autotriage@konfrontend --scope project
```

Then start `claude` at the project root and run `/autotriage:setup`. Updates arrive when `version` in `.claude-plugin/plugin.json` changes.

## Skills

All skills are namespaced `/autotriage:<name>`.

### Human-invocable only

The model cannot start these. Type them yourself.

| Skill | What it does |
| --- | --- |
| `/autotriage:setup` | Builds or refreshes the Profile under `profile/` from pasted sources (Upwork profile, resume, past Letters). It also offers to add the plugin's permission rules to the project's `.claude/settings.json`. Run it once before anything else. |
| `/autotriage:route` | Runs one Job through the whole Route in one sitting: intake, triage, checkpoint, version, proposal, verify. Paste the Job with it. |

### Agent-invocable

The model can call these on its own, for example to run the Route step by step when `route` is not in play. You can also type them.

| Skill | What it does |
| --- | --- |
| `/autotriage:intake` | Records a pasted Job as a Candidate folder `private/candidates/YYYY-MM-DD-<slug>/` with its `job.md`. |
| `/autotriage:triage <candidate>` | Detects Flags, the Family, and scores, writes the Job's `requirements`; a script computes the Verdict; you answer go or no-go at the checkpoint. |
| `/autotriage:version <candidate> [--tailor]` | Employment route only: records `version: general` in `cover-letter.md`, created with frontmatter only; stop here to send the Version without a Letter. With `--tailor` it records `tailored` and copies the general Version into the Candidate folder as `version.md` for you to edit. |
| `/autotriage:proposal <candidate>` | Writes the Letter for a Candidate with decision `go`, from the route's template, the voice rules, and the Profile. On the employment route it writes the body of `cover-letter.md` and keeps its frontmatter. |
| `/autotriage:verify <candidate>` | Reviews the Letter against the Checks and applies the Fixes in place. Ends with the Letter ready to paste. |
| `/autotriage:tracker [print]` | Prints the Tracker: every Candidate with its route, decision, Family or Version, and outcome, open ones first, from each `job.md` (the Version from `cover-letter.md`). Set `outcome` in `job.md` by hand. |

`<candidate>` is the Candidate folder name under `private/candidates/`.

## Guards

Each skill checks its preconditions before it loads. It refuses to run out of order, names the reason, and names the command to run instead; the refusal is printed, never hidden.

| Skill | Requires |
| --- | --- |
| `route` | every Profile file valid, one Project at least |
| `intake`, `setup` | nothing |
| `triage <c>` | valid `profile.md`; valid `job.md`; no `letter.md` (`cover-letter.md` on the employment route) yet |
| `version <c>` | valid `job.md`; `route: employment`; `decision: go` |
| `proposal <c>` | full Profile gate; `job.md` with a `verdict` block that recomputes to the same values; `decision: go`; on the employment route also a valid `cover-letter.md` (written by `version`), `version.md` present when `version: tailored`, and a Version that reads against the Profile |
| `verify <c>` | full Profile gate; `decision: go`; valid `letter.md`, or valid `cover-letter.md` on the employment route, empty body included |

A hook checks every write under `profile/`, `private/candidates/` and `resume/versions/` against the file's schema. The write has already landed, so a bad file is not undone: the hook returns the errors to the model, and the next skill's Guard refuses the file until it is fixed.

## Your data

```
profile/      profile.md, voice.md, answers/, projects/ (one file per Project: meta, keywords, Stories with keys)
              master.md and skills.md are generated: npm run build -w profile
resume/       versions/general.md, the one stored Version (a selection over the Profile)
private/
  candidates/ one folder per Job: job.md; letter.md on the freelance route; cover-letter.md and version.md when tailored on the employment route
```

Everything is Markdown with YAML frontmatter, and you can edit all of it by hand.

## Develop

```bash
npm install
```

```bash
npm test
```

Both at the repo root. Scripts are TypeScript run by Node directly; `tsc --noEmit` checks them. Edits to a `SKILL.md` apply at once; edits to hooks, scripts, and catalogue files apply after `/reload-plugins`. Dependencies are declared in `package.json`; nothing is vendored. Decisions are recorded in `docs/adr/` at the repo root.

## License

MIT
