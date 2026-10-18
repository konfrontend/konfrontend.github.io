---
name: intake
description: Record a pasted Job as a Candidate folder under private/candidates/ (job.md). First State of the Route.
argument-hint: "<posting body; route, client timezone, budget or employment terms, extras>"
---
!`node ${CLAUDE_PLUGIN_ROOT}/scripts/guard.ts intake`

A guard line above that starts with `autotriage:` and says `refused` is the answer: print it verbatim and stop; it names the fix.

A Candidate is `private/candidates/YYYY-MM-DD-<slug>/` with `job.md` as the input record; contract in `${CLAUDE_PLUGIN_ROOT}/catalogue/candidate-artifacts.md`, schema by route: `${CLAUDE_PLUGIN_ROOT}/scripts/schemas/job-freelance.schema.json` or `job-employment.schema.json`. The frontmatter holds the machine fields; the body is the paste verbatim, every line kept: the parameter line, the screening questions, the blank lines. Nothing is parsed out of it and nothing is dropped, so a later State reads the same Job the human read.

## Reading the paste

The paste often opens with a **parameter line**: the freelancer's own comma list of country, budget, and optionally hours and duration, ahead of the posting (`UK, $600`, `USA, $25-100, <30h/week, 1-3 months`). It is the freelancer's input, not the client's text: read the fields from it and keep it in the body.

- **Route** (required, `freelance` or `employment`). Stated by the human (`route: employment` on its own line, or in words) it is taken as given. Otherwise inferred the way the timezone is: a parameter line with a budget is `freelance`; a posting that reads as a job ad (employment type, salary or none, remote policy, benefits, a company presenting itself) is `employment`. `node ${CLAUDE_PLUGIN_ROOT}/scripts/intake.ts route` with the paste on stdin applies the same cues and prints the route, or `undecided`; the model's reading of the text wins over the script when they differ. An inferred route is marked in the report. Nothing to infer from: ask. The route picks the field set below and the schema; it is not a Family.

Freelance route:

- **Budget** (required). A single figure is `fixed` with `max`; a range is `hourly` with `min` and `max`, with or without `/h`; a posting that labels itself hourly or fixed-price wins over the shape of the number. Numbers are USD as Upwork shows them. A posting that names no money and no parameter line gives one is `none` only when the human says so.
- **Timezone** (required, IANA). A stated city or state names it. A country with one zone names it (`UK` is `Europe/London`, `Spain` is `Europe/Madrid`). A country with several zones takes its business hub (`USA` `America/New_York`, `Canada` `America/Toronto`, `Australia` `Australia/Sydney`, `Brazil` `America/Sao_Paulo`, `Mexico` `America/Mexico_City`) and the report marks it as inferred. Nothing to infer from: ask.
- **Title** (required). The posting's own title line when the paste has one. Otherwise a title of at most ten words from the summary. A title never carries country or budget.
- **Extras** (optional, free-form). Whatever else the parameter line or the human states: `country`, `hours_per_week`, `duration`, and any further fact given explicitly. Keys lowercase with underscores, values as given. Nothing inferred from the posting body lands here; `triage` reads the body itself.

Employment route (the posting's own statements, read from the body; the parameter line is rare here):

- **Company** (required, string or `null`). The employer as the posting names itself. A recruiter posting that hides the employer: `null`.
- **Employment** (required: `full-time | part-time | contract`). A B2B or contractor arrangement is `contract`. Not stated: `full-time` when the posting is a permanent role, marked as inferred; else ask.
- **Remote** (required: `remote | hybrid | on-site`). "Fully remote" and "remote-first" are `remote`; office days or "remote within the country with office visits" are `hybrid`; a workplace with no remote option is `on-site`.
- **Timezone** (required, IANA). The office city or stated overlap zone (`CET working hours` is `Europe/Berlin`, marked as inferred); a remote posting with a stated country takes the rules above. Nothing to infer from: ask.
- **Location** (optional, free string). The office city or the hiring region as posted.
- **Salary** (optional). Only when the posting states a figure: `type` `annual | monthly | hourly`, `min` and/or `max`, `currency` ISO 4217. Absent means not stated; never guessed.
- **Source** (optional, free string). Where the posting was found (`linkedin`, the company site), when the human states it.
- **Extras** (optional, free-form). As on the freelance route: `hours_per_day`, `languages`, a start date, anything the posting or the human states explicitly.

## Steps

1. **Fields.** Read the argument (and the next message when the argument is empty) into the fields above: route first, then the route's field set. A required field with no value in the paste and no rule to infer it: ask for it, all missing fields in one message, and wait. Done when title, timezone, and the route's required fields each have a value.
2. **Slug and folder.** Slug is two to four words of the title, lowercase, hyphenated, matching `^[a-z0-9]+(-[a-z0-9]+)*$`; folder is `<Today>-<slug>` with the date the guard printed. A folder already in the guard's Known Candidates takes one more distinguishing word in the slug; an existing Candidate is never overwritten. Done when the folder name is new.
3. **Write `job.md`** with the Write tool at `private/candidates/<folder>/job.md`: frontmatter `slug`, `title` (quoted), `date`, `route`, then on the freelance route `timezone`, `budget`, and on the employment route `company`, `employment`, `remote`, `location` when known, `timezone`, `salary` and `source` when stated; `extras` only when non-empty; no `verdict` block; then a blank line and the paste verbatim. The write hook validates the frontmatter against the schema the route names and blocks with the error list on mismatch: fix the frontmatter and write again. Done when the write went through.
4. **Report.** One line naming the file written and the next command, `/autotriage:triage <folder>`; every inferred value is named on it (`route employment, inferred`; `timezone America/New_York, inferred`), so the human can correct it in `job.md`. The last line of the answer is the folder name alone, so `route` can forward it.

Argument received: $ARGUMENTS
