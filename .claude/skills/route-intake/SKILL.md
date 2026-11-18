---
name: route-intake
description: Read a pasted Job's fields - route, title, timezone, location, and on employment company and employment - into the session. First step of the Route.
argument-hint: "<posting body; route, the client's timezone, employment terms>"
---
The Job lives only in the session: nothing is written. This step reads its fields and prints them, so the later steps and the human read the same values. The paste stays as it came, every line kept: the parameter line, the screening questions, the blank lines. Nothing is parsed out of it and nothing is dropped: the budget, the remote policy, the salary and the hours are read from it by whoever needs them.

## Reading the paste

The paste comes in the argument or in the next message.

The paste often opens with a **parameter line**: the freelancer's own comma list of country, budget, and optionally hours and duration, ahead of the posting (`UK, $600`, `USA, $25-100, <30h/week, 1-3 months`). A posting copied whole often closes with the same fields instead, one per line (`$1800`, `USA`, the city, the URL); a parameter line at the end counts the same as one at the start. It is the freelancer's input, not the client's text: read the fields from it and keep it in the body.

- **Route** (required, `freelance` or `employment`). Stated by the human (`route: employment` on its own line, or in words) it is taken as given. Otherwise inferred the way the timezone is: a parameter line with a budget is `freelance`; a posting that reads as a job ad (employment type, salary or none, remote policy, benefits, a company presenting itself) is `employment`. `node ${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/autotriage/scripts/intake.ts route` with the paste on stdin applies the same cues and prints the route, or `undecided`; the model's reading of the text wins over the script when they differ. An inferred route is marked in the report. Nothing to infer from: ask.
- **Title** (required). The posting's own title line when the paste has one. Otherwise a title of at most ten words from the summary. A title never carries country or budget.
- **Timezone** (required, IANA). A stated city or state names it. A country with one zone names it (`UK` is `Europe/London`, `Spain` is `Europe/Madrid`). A country with several zones takes its business hub (`USA` `America/New_York`, `Canada` `America/Toronto`, `Australia` `Australia/Sydney`, `Brazil` `America/Sao_Paulo`, `Mexico` `America/Mexico_City`) and the report marks it as inferred. On the employment route the office city or the stated overlap zone (`CET working hours` is `Europe/Berlin`, marked as inferred). Nothing to infer from: ask.
- **Location** (optional, free string). On the freelance route the parameter line's country or city; on the employment route the office city or the hiring region as posted.

Employment route only (the posting's own statements, read from the body):

- **Company** (required, never null). The employer as the posting names itself. An agency posting that hides the employer names the agency.
- **Employment** (required: `full-time | part-time | contract`). A B2B or contractor arrangement is `contract`. Not stated: `full-time` when the posting is a permanent role, marked as inferred; else ask.

## Steps

1. **Fields.** Read the argument (and the next message when the argument is empty) into the fields above: route first, then the rest. A required field with no value in the paste and no rule to infer it: ask for it, all missing fields in one message, and wait. Done when title, route, timezone, and on the employment route company and employment, each have a value.
2. **Report.** One line per field, every inferred value marked (`route employment, inferred`; `timezone America/New_York, inferred`), so the human can correct it before triage. Done when the fields are on screen.

Argument received: $ARGUMENTS
