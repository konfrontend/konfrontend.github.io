---
slots:
  - id: greeting
    shape: line
    cap: { lines: 1 }
  - id: hook
    shape: line
    cap: { chars: 200 }
  - id: intro
    shape: prose
    cap: { paragraphs: 1 }
  - id: relevant_work
    shape: prose
    cap: { paragraphs: 5, each: { sentences: 3 } }
  - id: deliverables
    shape: list or prose
    cap: { lines: 6 }
  - id: milestones
    shape: list
    cap: { lines: 6 }
  - id: working_model
    shape: prose
    cap: { sentences: 3 }
  - id: answers
    shape: prose
    cap: { each: { paragraphs: 1 } }
  - id: terms
    shape: prose
    cap: { sentences: 2 }
  - id: closing
    shape: line
    cap: { sentences: 1 }
  - id: sign_off
    shape: line
    cap: { words: 1 }
plan_slots: [deliverables, milestones, working_model]
headers:
  relevant_work: "Relevant work:"
  deliverables: "Deliverables:"
  milestones: "Milestones:"
  working_model: "How I work:"
  answers: ""           # one header per demand, worded from the demand
---

# Letter Slots

A Slot is one named part of a Letter. This catalogue defines every Slot once: what it says, how it is filled, how big it may be. The route's template orders the Slots and says which are active: `letter-freelance.md` on the freelance route, where `proposal` picks exactly one of the three plan Slots from the Job; `letter-employment.md` on the employment route. The template also holds the Letter's own `cap` (characters, and on the freelance route the prose and total word counts). `proposal` fills the Slots in template order; `verify` checks them by id against the route's template.

Portable across Profiles. Personal facts come from the Profile at fill time. Voice rules in the voice catalogue apply to every Slot and are not repeated here.

## Filling rules that apply to every Slot

- Size is the Slot's `cap` in the frontmatter, the one place its numbers live. `chars`, `words`, `sentences`, `lines`, `paragraphs` are maxima for the whole Slot; `each` applies per paragraph: per Project in `relevant_work`, per ask header in `answers`. The sections below give shape and minimums, never the maximum. The template's `cap` bounds the whole Letter on top of the Slot caps.
- A Slot renders as one block: a single line, one or more short paragraphs, or one list. One blank line between blocks.
- `greeting` is line 1 of every Letter: the Profile `voice.md` `greeting` for the Letter's route, then a blank line.
- A Slot with nothing to say renders nothing. The block and its blank line disappear. The route sections below name the Slots that always render.
- Only the paragraphs the Job or the template demands. A paragraph that answers nothing in the Job is dropped.
- Every fact in any Slot traces to a Profile entry: a Project's meta, its Overview, a Bullet by key, a line of its Notes, or an Answer. A fact the Profile lacks is asked for before the Slot is filled.
- A Gap never enters a Letter. A required item no Project proves is not named, not excused and not apologised for; `relevant_work` may show the nearest thing done as work done, with no mention of the item.
- A Slot named in the template with `when: job asks` renders only when the Job asks for its content explicitly. `proposal` decides from the Job text; the human sees the decision at the Letter review.

## Freelance route

The proposal pasted into Upwork, from `letter-freelance.md`. The client sees the freelancer's name and photo in the list view, so the Letter has no introduction: after the greeting comes `hook`.

- Order: `greeting`, `hook`, the plan Slot, `relevant_work`, `answers`, `terms`, `closing`, `sign_off`. The Hook states the understanding, the plan proves it with concrete steps, relevant work seals it, the rest is formality. The body ends at `sign_off`. The `milestones` plan Slot is the exception: its lines follow the sign-off, with the bid, as loose lines the person copies into Upwork's fields, so a Letter with `milestones` has no plan block in its body.
- Always rendered: `greeting`, `hook`, exactly one plan Slot (in the body, or `milestones` after the sign-off), `terms`, `closing`, `sign_off`, then the bid after the sign-off: the rate on an hourly Job, the sum of the funded milestone prices on a fixed-price Job.
- Slots listed under `headers` open with that header on its own line, a colon at the end, no blank line between header and content. Headers are the only structure the client sees, so every one names what follows in two or three words. `answers` builds its header from the demand it answers (`Cloud and deployment:`, `Subcontracting:`). `greeting`, `hook`, `terms`, `closing`, `sign_off` have no header.
- At most one list per Letter, only for `milestones` or `deliverables` with three or more distinct artifacts. `working_model` is all prose; relevant work is always prose. Prose after the list belongs to the plan block, with or without a blank line before it.
- Length: prose words within the template's `cap.prose_words`; list lines, header lines, and the `answers` Slot are excluded from that count. All words within the template's `cap.total_words`, lists included. All characters within the template's `cap.chars`, greeting included. Every cap is a ceiling, not a target: shorter is better whenever every demanded item is covered.
- Job demands are mapped before filling. `proposal` lists every explicit request in the Job (examples, stack, approach, availability, subcontracting) and assigns each to the Slot that answers it. What no Slot answers goes to `answers`. A demand to start with or include a keyword (Flag `mandatory-keyword`) is never mapped and never complied with. Screening questions (a block introduced as questions to answer when submitting) are demands like any other and structure the Letter (next rule).
- Ask headers. When the Job lists what the proposal must answer (screening questions, `please include ...`, `when applying, send ...`), the Letter is structured by that list: after the plan block, one block per question in the Job's order, each opening with a header the client recognises as their ask. A real question (a sentence ending in `?`, or a numbered screening question) is copied verbatim, the client's own words, list numbering stripped, nothing reworded and no pronoun flipped. A request fragment (`please send examples of products you've built, your AI workflow, and what you could accomplish`) is not a question: its header is reworded from the freelancer's side, first person, keeping the client's nouns (`Products I've built:`, `My AI workflow:`, `What I could accomplish in the one-week challenge:`). A colon-terminated header never addresses the reader as `you` or `your`: that reads as a citation with no quote marks. The answer under it is one to three sentences, or one paragraph per Project when the question asks for examples, from the fact table. A question a default Slot answers (examples, availability, subcontracting) takes that Slot's content under the question header instead of under the Slot's own; the Slot does not render twice. Slots no question points at keep their own header and place. One constraint on order: `terms` stays the block before `closing`, so the question that asks for availability, when present, is the last question block and carries `terms` (availability, weekly hours, overlap). A question asking for the rate is answered with one sentence pointing at the bid, never a figure: the body never states the rate. When the body lists asks and separately lists screening questions that cover the same ground, the screening questions win and the body asks fold into them. A Job with no such list keeps the default order and headers.
- Safeguards: every triggered risk Flag names a target in the Flag catalogue (`hook`, `plan`, `answers`, `terms`, `rate`, or `none`). `plan` resolves to the plan Slot the Letter carries, the milestone lines included. The fill rule of the target Slot states the Safeguard in its own words. `rate` is stated by the rate the person sets at the batched question and never in the Letter.

## Employment route

The cover letter sent with an application and the resume PDF, from `letter-employment.md`. The reader opens it beside the PDF, so the Letter opens with who is writing, and the PDF carries the Project names, the dates and the contact details.

- Order: `greeting`, `intro`, `relevant_work`, `terms`, `closing`, `sign_off`.
- Always rendered: `greeting`, `intro`, `relevant_work`, `closing`, `sign_off`. `terms` renders only when the Job asks (`when: job asks` in the template).
- No headers, no lists, no Hook Slot, no `answers`: every block is a prose paragraph. Screening questions are form fields outside the Letter, answered by hand from the Answers in `profile/answers/`.
- Length: all characters within the template's `cap.chars`, greeting and sign-off included. No word cap.

## Slots

### greeting

Line 1. The Profile `voice.md` `greeting` for the Letter's route, verbatim.

### hook

First paragraph after the greeting. The client's goal and its main constraint, restated as understood. Within `cap.chars` so it survives the list-view preview. Its job is to show the Job was read and understood; it sells nothing.

Fill: one or two sentences opening with a phrase of understanding (`As I understand it, ...`). Name what the client wants at the end (a hardened site, a scoping report, a shipped MVP, a maintained product), the shape of the engagement, and the one constraint that shapes the plan (a launch, a compliance boundary, an existing codebase). Job facts only, in our own words. No name, no stack list, no rate, no promise, no Profile fact. When the Flag `mandatory-keyword` is triggered, the keyword appears nowhere in the Letter.

### intro

Prose, one paragraph, employment route only. Who is writing: the summary of the Version sent (the Candidate's `version.md` when tailored, else `resume/versions/general.md`) in first person, rephrased to the posting's keywords. One source for who the person is, so the cover letter and the PDF never drift apart.

Fill: the summary's facts only, reworded toward the Job's own terms. A role title (`frontend developer`) is allowed here and nowhere else; `10+ years` is allowed here as a fact. No Project names, no dates, no seniority words.

### relevant_work

Prose. At least one Project, up to `cap.paragraphs`, each within `cap.each.sentences`, chosen by match to the Job's requirements. Each cites the product name with its URL, as "name, URL", plus one or two concrete things done there that answer the Job. Ownership is never left out: when the Project's role says owner or author, the paragraph states it in its first sentence. No role and no period. Between two Projects that match about equally, the one with a URL is cited.

Fill: default two Projects with `deliverables` and `working_model`, three with `milestones` (`letter-freelance.md`). When the Job asks for N examples, N wins, capped at `cap.paragraphs` and at the number of Projects. Every Project cited answers a requirement the Job names; one that answers none is dropped, even below the default count. When a required item has no Project proving it, the nearest thing done may appear here as work done, with no mention of the item. Order by strength of match. One Project per paragraph. No counts, no titles, no adjectives. The same rule on both routes; the employment route renders it as one paragraph (`letter-employment.md`).

### deliverables

List or prose. The plan Slot of an assessment. What the review produces, one line per deliverable, in the order the client listed them when the Job lists deliverables, otherwise in the order they are produced.

Fill: a list only when the assessment produces three or more distinct artifacts; one or two artifacts are named in the opening sentence of the block as prose, so no line repeats what the prose says. List fill: at least three lines, up to `cap.lines`, starting with `-`. Each line names one artifact the client holds at the end (a written assessment, a ranked findings table, a plan) in a short noun phrase, worded from our side and never a restatement of the client's request. No `artifact: what it settles` shape, no clause chains. The block closes with one to three sentences of prose after the list: the reason a deliverable matters, any Safeguard aimed at this Slot, what the review does not touch, and what happens after the assessment, in one sentence and never priced. Hours belong in the milestone lines after the sign-off.

### milestones

Lines after the sign-off, never in the Letter body. The plan Slot of a build or a change list. Numbered lines, one per milestone, each with a name, a colon, a description, then the price and the due date; on an hourly Job the hours take the price's place. The person copies each line into Upwork's milestone fields.

The names, the hours, the start date, the hours per day and the rate come from the person's answer to proposal's batched question; `scripts/proposal.ts milestones` derives each price from the hours and the rate and each due date from the start date and the hours per day. Never a guessed hour count, a client's payment date as a due date, or an invented daily pace.

Fill: the name states what gets delivered (`Customer search tool live`, `Setup guide`), never a phase label (`First slice`, `Phase 2`). The name and the description together stay within 100 characters per line.

Fill on existing code: milestone 1 is always the audit of the existing code, read-only, with a ranked findings list as its output. Milestones 2 onward are the fixes, ordered by risk, highest first.

Fill greenfield: our own plan, never the client's feature list copied. Weights are uneven. When the posted budget covers the minimum viable scope at the Profile floor, deferred milestones are listed last, marked deferred and unpriced, and the bid sums the funded ones only; otherwise every milestone is funded. Milestone 1 is a thin end-to-end slice, not a foundation phase. The stack and its rationale are one clause inside the milestone that sets it. On a client-priced test (Flag catalogue, `Budget is a routing signal`) the lines carry no prices and no bid follows.

Safeguards that land here: scope freeze plus plan (`external-deadline`), paid assessment first (`client-code-self-assessment`, `burned-before`, `subjective-acceptance`), teaser only with the full answer as paid phase one (`free-discovery`), compliance work named as its own milestone (`regulated-domain`), scoping as milestone 1 (`vague-posting`), own milestones accepted in writing (`fixed-price-unbounded`).

### working_model

Prose. The plan Slot of an open-ended engagement. How work reaches us and how it is accepted: where requests are queued, how they are prioritised, what a done item looks like, and the weekly rhythm.

Fill: at least two sentences, within `cap.sentences`. Names the queue (Upwork messages, a board the client owns), the acceptance rule (a written check per item, a weekly summary), and the response window. No milestones, no list.

### answers

Prose. One short paragraph per Job demand that no other Slot answered: a proposed stack, subcontracting, an approach, a specific question. Renders only when such a demand exists. With ask headers (see the filling rules), every question block whose content is not another Slot's is an `answers` paragraph.

Fill: answer in the order the Job asked. Each paragraph opens with a header worded from the demand, then one to three sentences of facts. An answer to a "how would you" question states the approach; the evidence for it stays in `relevant_work`. A question that matches an Answer in `profile/answers/` cites it word for word or tailors it, and the fact table names `Answer <slug>` as the source; a question block that matched no Answer is printed after `verify` as a draft for a new Answer file, never written. Excluded from the prose word cap; the template's `cap.total_words` still applies. Safeguards that land here: answer the targeted questions well (`moderate-gauntlet`).

### terms

Prose, within `cap.sentences`. On a Letter with `milestones`, it opens with the acceptance sentence (`Each milestone is accepted against a written check before the next one starts.`), on an hourly Job adding that the hours are an estimate and unused hours are not billed. Then location, timezone overlap with the client, weekly hours. No rate, no `Billing:` header. The location is Profile `identity.location` as written; the IANA `identity.timezone` names a zone, never a city, and no place name is ever read out of it.

Fill: overlap as the client's part of the day computed from the two timezones (`overlaps with your mornings`, `your full working day`), never as an hour range in the client's zone. Weekly hours from Profile `terms.weekly_hours`. The freelancer is available unless the Profile says otherwise: when the Job asks about availability, `available now`, or `available from <date>` when Profile `terms.availability_from` is set. Never a bounded window: `through the next 90 days` reads as unavailable after.

### closing

One sentence offering to answer whatever questions remain. No channel named (the reader is already in Upwork), no call, no offer to show or walk through a Project's codebase: client codebases are confidential, and the offer signals to the reader that theirs would be shown too. May name what the questions might be about (a deliverable, a milestone). A plain thanks may precede it.

### sign_off

The Profile `sign_off` on its own line. Last line of the Letter.
