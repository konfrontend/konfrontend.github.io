# Candidate artifacts

A Candidate is one folder under `data/candidates/`, gitignored. `job.md` is the input on both routes; its required `route` field (`freelance | employment`) names the schema it validates against and the files beside it. A freelance Candidate holds `job.md` and `letter.md`; an employment Candidate holds `job.md`, `cover-letter.md`, the sent PDF, and `version.md` only when a Version was tailored for this Job. Together they form the record that later work on Letter generation learns from. Nothing else is stored in the folder; everything a session prints (evidence, reasons, checklists) is thrown away. One write lands outside the folder: `triage` also records the Candidate in the Skill ledger `data/profile/skills.md` (the `seen` count of each Skill the Job required, plus a Gap row per unknown required item; catalogue `skills.md`) and writes the rows it counted back into `job.md` as `recorded_skills`, so a re-run records nothing twice.

## Folder

`data/candidates/YYYY-MM-DD-<slug>/`. Date is the day `intake` ran. Slug is two to four words from the posting title, chosen by `intake`. The full title stays in `title`.

## `job.md`

Written by `intake`; `triage` adds the `verdict` block and, after the checkpoint and the human's explicit confirmation of the ledger changes, records the Candidate in the Skill ledger; the human sets `decision`. Body is the posting verbatim, nothing parsed out, nothing dropped. `intake` reads `route` from the human or infers it (a parameter line with a budget is freelance; a job ad is employment) and marks an inferred value in its report. The route is not a Family; `family` stays a freelance term.

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
recorded_skills: [React, Stripe Connect]   # script; the ledger rows this Candidate was counted in
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
verdict:                          # absent until triage runs; no family, no family_runner_up
  flags: [regulated-domain]
  skill_fit: 4
  interest_fit: 3
  value: 3
  alert_level: 2                  # script
  hard_stops: []                  # script; never rate-below-floor on this route
  verdict: go                     # script; go | no-go | ask
  decision: null                  # human; go | no-go
```

Rules:

- `slug`, `title`, `date`, `route` identify the record on both routes. On the freelance route `timezone` and `budget` feed the hard stops; on the employment route `company`, `employment`, `remote`, `timezone` describe the terms, and `remote` is the evidence for an `unmet-constraint` stop Flag, not a rule of its own. Everything else optional goes under `extras`; no new top-level field without a consumer.
- No money hard stop on the employment route: pay is unknown until the offer stage. `rate-below-floor` is not in its `hard_stops` enum.
- `recorded_skills` is written by `scripts/skills.mjs record`, the marker that makes recording idempotent: the ledger's `seen` is a count, so the Candidate's own file remembers which rows it was counted in. Never typed by hand.
- `verdict` holds ids and numbers only. How they combine is in the Flag catalogue (`alert_level_steps`, `hard_stops`, `scores`, `verdict_mapping`). Evidence quotes, score reasons, matched cues, safeguards are session output.
- `alert_level`, `hard_stops`, `verdict` are computed by a script from `flags`, the scores, and the Profile floors. The `proposal` guard recomputes them and rejects the file on mismatch.
- `verdict` is the script's recommendation; `decision` is the human's call. `proposal` runs only on `decision: go`. `no-go` ends the Route. `ask` is a verdict, not a decision: the human still writes `go` or `no-go`.

## `letter.md` (freelance route)

Written by `proposal`, checked by `verify`. Body is the Letter as pasted into Upwork: plain text, no Markdown.

```yaml
slug: clinic-booking-mvp
family: audit                     # template used
date: 2026-09-19
outcome: null                     # ignored | rejected | interviewed | hired; set by hand when known
```

`verify` result is not stored: a Letter is final only after `verify` passes, so a stored pass carries no information.

## `cover-letter.md` (employment route)

The Letter of the employment route (`scripts/schemas/cover-letter.schema.json`). Written by `proposal` from `catalogue/templates/letter-employment.md`, checked by `verify`. Body is the cover letter as sent: plain text, no Markdown, within the template's 500 characters.

```yaml
slug: heymondo-senior-frontend
date: 2026-10-14
version: general                  # general | frontend | tailored; tailored means version.md exists beside it
outcome: null                     # ignored | rejected | interviewed | hired; set by hand when known
```

## The sent PDF and `version.md` (employment route)

The PDF that went out sits in the Candidate folder under the name `docs/format-rules.md` fixes (`Dolbilov_<Role>_<Company>_<MonYYYY>.pdf`), whichever Version it renders. `version.md` is the tailored Version's source and exists only when `cover-letter.md` says `version: tailored`; the general and frontend Versions live in `versions/` and leave no copy in the folder.
