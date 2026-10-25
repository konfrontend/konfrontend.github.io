# Candidate artifacts

A Candidate is one folder under `private/candidates/`, gitignored. It stores only what the person confirmed or what happened: `job.md` on both routes, `letter.md` on both routes, `version.md` only when the Version was tailored for this Job, and on the employment route the PDF sent, `Dolbilov_<Role>_<Company>_<MonYYYY>.pdf`, written by `resume-pdf <folder>` from the Version sent. Anything recomputable, derivable from the files, or inferable from absence is not stored: the scores, the Alert Level, the recommendation, the Safeguards and the evidence are session output and are thrown away. Nothing is written outside the folder; the Gap print and the Tracker derive from the Candidates at print time.

## Folder

`private/candidates/YYYY-MM-DD-<slug>/`. The folder name is the only source of the intake date and the slug: the date is the day `intake` ran, the slug two to four words from the posting title, chosen by `intake`. The full title stays in `title`. `candidates/archive/` holds desk Candidates from before the Route and is read by nothing.

## `job.md`

One schema for both routes, `schemas/job.schema.json`, `route` required; the contract in code is `scripts/candidate.ts`, which every reader and writer of a Candidate goes through. The body is the paste verbatim, parameter line included, nothing parsed out and nothing dropped: the budget, the remote policy, the salary and the hours are read from it by whoever needs them. `intake` writes the identity fields with `scripts/intake.ts write`; `triage` writes the Checkpoint fields with `scripts/verdict.ts write` once the person has answered, and nothing before; both refuse before writing an invalid `job.md`. The person sets `outcome` by hand, and the write hook validates every hand edit.

```yaml
title: "Full-Stack Developer - Clinic Booking MVP"   # the posting's own title
route: freelance                  # required; freelance | employment
timezone: America/New_York        # the client's or the office's zone, IANA; required
location: New York                # optional; on freelance from the parameter line's country or city
company: Heymondo                 # employment only, required, never null: an agency posting that hides the employer names the agency
employment: full-time             # employment only, required: full-time | part-time | contract (B2B is contract)
verdict: go                       # the Checkpoint, both routes: go | no-go
requirements: [React, Stripe Connect]   # the Checkpoint, both routes: the Job's required Skill-shaped items
flags: [non-technical-founder, paid-first-milestone]   # the Checkpoint, freelance only: the Flag ids triggered
outcome: sent                     # by hand, only on verdict go: sent | interview | offer
```

Rules:

- `title`, `route`, `timezone` identify the record on both routes; `location` is optional. On the employment route `company` and `employment` are required; neither exists on the freelance route. No other top-level field: a fact the body carries is read from the body.
- The Checkpoint fields are written by `triage` in one write, once the person has answered go or no-go, on go and on no-go alike. If the person never answers, nothing is written. `verdict` is the go or no-go the person confirmed; the scores, the Flags' evidence and the script's recommendation behind it stay in the session. The `version`, `proposal` and `verify` Guards check `verdict: go` and recompute nothing; `no-go` ends the Route.
- `requirements` holds only Skill-shaped items from the posting's required list: technologies and domain practices, never nice-to-haves, years of experience, spoken languages or degrees (a required degree is `unmet-constraint` evidence). Each is spelled as the Keyword when a Project's Keyword matches it, and as the posting spells it otherwise; that spelling becomes the Gap's name. Readers: the Gap print, `resume-version` when it tailors, and the Letter States.
- `flags` is freelance only: the ids of every triggered Flag, green and stop Flags included. `proposal` reads it for the Safeguards; `verify` reads it for `flag/safeguard-missing`, `job/mandatory-keyword` and the Alert Level, which it recomputes from the ids. Employment Flags are not stored: every one has `slot: none`, so nothing reads them after the Checkpoint.
- `outcome` is the furthest point the Candidate reached, set by hand on both routes once the Letter, or the Version alone, went out: `sent`, then `interview`, then `offer`. A missing next step is the negative outcome: a `sent` with no movement is no reply, by definition. No field for a rejection or a withdrawal. A win is the Project file the person creates by hand. The schema allows `outcome` only on `verdict: go`.

## `letter.md`

Body only, no frontmatter, on both routes: the Letter as pasted, plain text, no Markdown. On the freelance route `proposal` writes it from `templates/letter-freelance.md`; on the employment route the `version` State writes it empty and `proposal` fills it from `templates/letter-employment.md`, within that template's 500 characters. An empty `letter.md` on the employment route is valid: the Version went out without a Letter, a resume-only application. `verify` checks the file and applies its Fixes in place; its result is not stored, since a Letter is final only after `verify` passes.

## `version.md`

The tailored Version, written by `resume-version <candidate>` from the Project files for this Job's `title` and `requirements`: the Markdown twin of the PDF sent, in the shape `docs/format-rules.md` describes, with `[slug]` on headings and `[key]` on Bullets, and Variants where the Plan chose them. It exists only when the Version was tailored; its absence means the Candidate is sent with `resume/versions/general.md`. The `proposal` State reads the summary of the Version sent for the intro Slot. `resume-pdf private/candidates/<folder>` renders it into the folder as the PDF sent. A Version is never hand-edited: a wrong line is fixed in the Profile and the Version regenerated.

## Tracker

The Tracker is not stored: `node scripts/tracker.ts print`, behind `/tracker`, prints it from every Candidate's `job.md` frontmatter and never writes. One table for both routes, columns `candidate | route | verdict | outcome`, sorted by folder name descending, so the newest Candidate is on top. No groups: a `no-go` or a Candidate with no movement reads from its columns. The print warns only on an invalid `job.md` and keeps its row, and skips any folder under `private/candidates/` that is not a dated Candidate, such as the archive.

## Gap print

Not stored either: `node scripts/gaps.ts print`, behind `/gaps`, reads every dated Candidate's `requirements`, no-go Candidates included (a Gap is often the reason for a no-go), plus the Projects' Keywords through `profile/lib`, and never writes. It warns on an invalid `job.md` and still counts its `requirements`. Two tables, columns `skill | seen`: the Gaps first, then the proved Skills a Job asked for, `seen` counting Candidates. Where a Gap was seen is not printed; a search over the Candidates answers that.
