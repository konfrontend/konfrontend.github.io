# Candidate artifacts

A Candidate is one folder under `private/candidates/`, gitignored. `job.md` is the input on both routes; its required `route` field (`freelance | employment`) names the schema it validates against and the files beside it. A freelance Candidate holds `job.md` and `letter.md`; an employment Candidate holds `job.md`, `cover-letter.md`, and `version.md` only when a Version was tailored for this Job. No PDF: the human renders it outside the plugin. `job.md` is the posting for reference; `cover-letter.md` records what went out: the Version, always, and the Letter when one was written. Together they form the record that later work on Letter generation learns from. Nothing else is stored in the folder; everything a session prints (evidence, reasons, checklists) is thrown away. Nothing is written outside the folder: the Skill ledger derives from every Candidate's `requirements` when the Profile is built.

## Folder

`private/candidates/YYYY-MM-DD-<slug>/`. Date is the day `intake` ran. Slug is two to four words from the posting title, chosen by `intake`. The full title stays in `title`.

## `job.md`

Written by `intake`; `triage` adds `requirements` and the `verdict` block; the human sets `decision` and, once the Letter or the Version went out, `outcome`. Body is the posting verbatim, nothing parsed out, nothing dropped. `intake` reads `route` from the human or infers it (a parameter line with a budget is freelance; a job ad is employment) and marks an inferred value in its report. The route is not a Family; `family` stays a freelance term.

Freelance route (`scripts/schemas/job-freelance.schema.json`):

```yaml
slug: clinic-booking-mvp
title: "Full-Stack Developer - Clinic Booking MVP"
date: 2026-09-19                  # intake date
route: freelance                  # required; picks this schema
timezone: America/New_York        # client, IANA; required
budget: { type: hourly, min: 25, max: 100 }   # type hourly | fixed | none; fixed uses max only; none has no min or max
extras:                           # optional, free-form; anything else the posting or the freelancer states
  country: US
  hours_per_week: "<30"
  duration: "1-3 months"
requirements: [React, Stripe Connect]   # triage; the Job's required items as the posting names them
verdict:                          # absent until triage runs
  family: audit                   # Family id; human may edit before proposal
  family_runner_up: build         # Family id or null
  flags: [non-technical-founder, regulated-domain, moderate-gauntlet, free-discovery, paid-first-milestone]
  skill_fit: 3
  interest_fit: 3
  value: 5
  alert_level: 3                  # script
  hard_stops: []                  # script; hard stop ids
  verdict: go                     # script; go | no-go | ask
  decision: null                  # human; go | no-go
outcome: null                     # human; sent | replied | interview | offer | hired | rejected | withdrawn; non-null only on decision go
```

Employment route (`scripts/schemas/job-employment.schema.json`):

```yaml
slug: heymondo-senior-frontend
title: "Senior Frontend Developer"  # role title as posted
date: 2026-10-14                  # intake date
route: employment                 # required; picks this schema
company: Heymondo                 # required; string, or null when the posting hides the employer
employment: full-time             # required; full-time | part-time | contract (B2B is contract)
remote: remote                    # required; remote | hybrid | on-site
location: Barcelona               # optional, free string
timezone: Europe/Madrid           # required, IANA
salary: { type: annual, min: 50000, max: 60000, currency: EUR }  # optional; absent means not stated; type annual | monthly | hourly; currency ISO 4217
source: linkedin                  # optional, free string
extras:                           # optional, free-form
  hours_per_day: 7.5
requirements: [Vue 3, Nuxt 4, TypeScript, technical SEO, WCAG]   # triage; the Job's required items as the posting names them
verdict:                          # absent until triage runs; no family, no family_runner_up
  flags: [regulated-domain]
  skill_fit: 4
  interest_fit: 3
  value: 3
  alert_level: 2                  # script
  hard_stops: []                  # script; never rate-below-floor on this route
  verdict: go                     # script; go | no-go | ask
  decision: null                  # human; go | no-go
outcome: null                     # human; sent | replied | interview | offer | hired | rejected | withdrawn; non-null only on decision go
```

Rules:

- `slug`, `title`, `date`, `route` identify the record on both routes. On the freelance route `timezone` and `budget` feed the hard stops; on the employment route `company`, `employment`, `remote`, `timezone` describe the terms, and `remote` is the evidence for an `unmet-constraint` stop Flag, not a rule of its own. Everything else optional goes under `extras`; no new top-level field without a consumer.
- `requirements` is written by `triage` with the `verdict` block on both routes: the required items it listed for `skill_fit`, each a string as the posting names it, nice-to-haves left out. Two consumers: `verify`'s Version pass on the employment route, which looks for each entry in the Version sent, and the Profile build, which counts them into the Skill ledger as Seen and Gaps. A re-run of `triage` replaces it.
- No money hard stop on the employment route: pay is unknown until the offer stage. `rate-below-floor` is not in its `hard_stops` enum.
- `verdict` holds ids and numbers only. How they combine is in the Flag catalogue (`alert_level_steps`, `hard_stops`, `scores`, `verdict_mapping`). Evidence quotes, score reasons, matched cues, safeguards are session output.
- `alert_level`, `hard_stops`, `verdict` are computed by a script from `flags`, the scores, and the Profile floors. The `proposal` guard recomputes them and rejects the file on mismatch.
- `verdict` is the script's recommendation; `decision` is the human's call. `proposal` runs only on `decision: go`. `no-go` ends the Route. `ask` is a verdict, not a decision: the human still writes `go` or `no-go`.
- `outcome` is where the Candidate stands once its Letter, or on the employment route its Version alone, went out, set by hand on both routes: `sent | replied | interview | offer | hired | rejected | withdrawn`, or `null` (or absent) before anything is sent. The schema allows a non-null value only when `verdict.decision` is `go`. `hired`, `rejected` and `withdrawn` are terminal; on `hired` the Project is created by hand. No offer field: an offer figure, when wanted, goes in `extras.offer` free-form.

## `letter.md` (freelance route)

Written by `proposal`, checked by `verify`. Body is the Letter as pasted into Upwork: plain text, no Markdown.

```yaml
slug: clinic-booking-mvp
family: audit                     # template used
date: 2026-09-19
```

`verify` result is not stored: a Letter is final only after `verify` passes, so a stored pass carries no information.

## `cover-letter.md` (employment route)

What went out on the employment route (`scripts/schemas/cover-letter.schema.json`): the Version, always, and the Letter when one was written. Created by the `version` State with frontmatter only and an empty body; a re-run rewrites `version` and leaves the body alone. `proposal` writes the Letter into the body from `catalogue/templates/letter-employment.md` and keeps the frontmatter; `verify` checks it. Body is the cover letter as sent: plain text, no Markdown, within the template's 500 characters. An empty body is valid: the Version went out without a Letter, a CV-only application.

```yaml
slug: heymondo-senior-frontend
date: 2026-10-14
version: general                  # the version State; general | tailored; tailored means version.md exists beside it
```

- `version` is written by `scripts/version.ts` (the `version` State, employment route, on `decision: go`): `general`, or `tailored` with `--tailor`. `proposal` reads the named Version's `summary` for the Intro Slot and refuses without `cover-letter.md`.

## `version.md` (employment route)

The tailored Version's source, created by `version --tailor` as a copy of `resume/versions/general.md` and edited by the human: a selection over the Profile (Story keys per Project, Skills lines, `summary`), validated against `profile/schemas/version.schema.json` on every write and read through the Profile, so a key no Project has or a Skills term no Project proves refuses the next State. It exists only when `cover-letter.md` says `version: tailored`. Its `summary` is what the Intro Slot reads.

## Tracker

The Tracker is not stored: `node scripts/tracker.ts print`, behind `/autotriage:tracker`, prints it from every Candidate's `job.md` frontmatter, `version` from `cover-letter.md`, and never writes. One table for both routes, columns `date | candidate | route | decision | family | version | outcome`; `family` is empty on employment rows, `version` empty on freelance rows. Open Candidates come first, then closed (`decision: no-go` or a terminal `outcome`), each by intake date descending; a `hired` Candidate stays listed. The print warns on `outcome: sent` with no letter file (`letter.md` or `cover-letter.md`) in the folder, and skips any folder under `private/candidates/` that is not a dated Candidate, such as the archive. No history is committed.
