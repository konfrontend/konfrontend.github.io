---
scale: 1-5
flags:
  # kind: risk (default), green, or stop. green = level 0, lowers the Alert Level. stop = Profile-fit failure: no level, no Alert Level effect, forces the hard stop of the same id.
  # routes: the routes the Flag is judged on, [freelance], [employment], or both. triage and verify read only the Flags of the Candidate's route.
  # slot: where the safeguard is stated in the Letter. Freelance: hook | plan | billing | answers | none; `plan` is the Family's plan Slot (see the Slot catalogue). Employment: a Slot id of letter-employment.md (intro | relevant_work | gaps | terms | closing) or none.
  - id: budget-scope-mismatch
    routes: [freelance]
    level: 1
    cues: ["enterprise-size feature list with a small fixed price", "$5-$100 placeholder budget", "ambitious scope, tiny budget"]
    safeguard: "propose own milestones and price; client takes it or leaves it. On a client-priced test: own milestone plan only, no prices"
    slot: plan
    value: "fewer competing bids from those who filter by posted budget"
  - id: vague-posting
    routes: [freelance]
    level: 1
    cues: ["one-paragraph brief", "enhance our web application using React and Node", "no scope, no deliverables"]
    safeguard: "first exchange defines scope"
    slot: plan
    value: "depends on what surfaces"
  - id: non-technical-founder
    routes: [freelance]
    level: 1
    cues: ["non-technical founder", "I am not a developer", "need someone to own the tech"]
    safeguard: "bill for the architect role you will fill"
    slot: billing
    value: "normal for the segment"
  - id: decorative-formatting
    routes: [freelance]
    level: 1
    cues: ["all-caps headers", "emoji section headers"]
    safeguard: "none; style only"
    slot: none
    value: "counts only combined with hostile-tone"

  - id: partnership-anchor
    routes: [freelance]
    level: 2
    cues: ["partner, not freelancer", "more paid work after MVP", "founding engineer", "long-term partnership"]
    safeguard: "price the current scope on its own; future work is worth zero"
    slot: billing
    value: "fine when current scope is priced alone"
  - id: client-code-self-assessment
    routes: [freelance]
    level: 2
    cues: ["architecture is sound", "hard thinking is done", "codebase is clean", "built in Replit/Lovable/Cursor, just needs finishing"]
    safeguard: "paid assessment as milestone one"
    slot: plan
    value: "rescue work is abundant and prices well when audit-first"
  - id: external-deadline
    routes: [freelance]
    level: 2
    cues: ["pilot launches in <month>", "launch in the coming months", "must be live by <date>"]
    safeguard: "scope freeze plus milestone plan"
    slot: plan
    value: "deadline pressure speeds hiring decisions"
  - id: regulated-domain
    routes: [freelance]
    level: 2
    cues: ["FERPA", "HIPAA", "PHI", "student data", "health data", "legal content", "GDPR sensitive data"]
    safeguard: "name compliance overhead in the Letter; price it"
    slot: plan
    value: "compliance rarely priced by competitors"
  - id: moderate-gauntlet
    routes: [freelance]
    level: 2
    cues: ["3-5 targeted technical questions in the application"]
    safeguard: "answer well; this filters competition"
    slot: answers
    value: "high conversion when answered well"

  - id: mandatory-keyword
    routes: [freelance]
    level: 3
    cues: ["begin your proposal with <WORD>", "start with the word", "include <CODE> so I know you read this"]
    safeguard: "none; never comply: the Letter leaves the keyword out"
    slot: none
    value: "co-occurs with low baseline trust"
  - id: burned-before
    routes: [freelance]
    level: 3
    cues: ["previous developer went unresponsive", "previous developer failed", "estimates grew tenfold", "we were let down"]
    safeguard: "paid bounded audit first, written scope, no fixed price before seeing code"
    slot: plan
    value: "client knows they need competence; can pay for it"
  - id: free-discovery
    routes: [freelance]
    level: 3
    cues: ["include an architecture proposal", "propose the DB design in your application", "itemized estimate required in the proposal", "describe your pipeline design"]
    safeguard: "teaser only; sell the full answer as paid phase one"
    slot: plan
    value: "inverted to green when the client pays for the discovery (see paid-first-milestone)"
  - id: subjective-acceptance
    routes: [freelance]
    level: 3
    cues: ["needs to look great", "pixel-perfect", "your creative call", "until we are happy"]
    safeguard: "paid first milestone (one screen, one theme) before committing to the rest"
    slot: plan
    value: "3D/WebGL and creative work carry a scarcity premium"
  - id: control-heavy-environment
    routes: [freelance]
    level: 3
    cues: ["mandatory sandboxed workstation", "remote-desktop only", "monitored access", "time tracker with screenshots required"]
    safeguard: "price the friction"
    slot: billing
    value: "legitimate for client-data compliance"
  - id: heavy-vetting
    routes: [freelance]
    level: 3
    cues: ["references will be called", "CV + LinkedIn + GitHub + portfolio mandatory", "we will independently verify"]
    safeguard: "judge vetting weight against contract size"
    slot: none
    value: "acceptable for large engagements only"

  - id: fixed-price-unbounded
    routes: [freelance]
    level: 4
    cues: ["production-ready as the only acceptance criterion", "scalable, high-quality", "feature list over 8 modules with a fixed budget"]
    safeguard: "convert to hourly or to own milestone structure, accepted in writing"
    slot: billing
    value: "loss-maker unless repriced"
  - id: urgency-48h
    routes: [freelance]
    level: 4
    cues: ["URGENT", "24H", "event tomorrow", "need it today"]
    safeguard: "premium rate, only for trivial self-contained work"
    slot: billing
    value: "no discovery, public failure mode"
  - id: excessive-gauntlet
    routes: [freelance]
    level: 4
    cues: ["10+ application questions", "video recording required", "take-home task for a small job"]
    safeguard: "engage only if take-home is time-capped and the job is large"
    slot: none
    value: "application cost exceeds expected value"
  - id: hostile-tone
    routes: [freelance]
    level: 4
    cues: ["ALL-CAPS plus complaints", "DO NOT APPLY IF", "prohibition lists", "threats of rejection", "no time-wasters"]
    safeguard: "none; client manages through distrust"
    slot: none
    value: "escalation on every invoice"
  - id: unrealistic-mechanics
    routes: [freelance]
    level: 4
    cues: ["build it in 1 hour on Zoom while I watch", "should take you 20 minutes"]
    safeguard: "none; the client's model of software is wrong"
    slot: none
    value: "whatever ships disappoints"

  - id: compound-distrust
    routes: [freelance]
    level: 5
    cues: ["mandatory keyword + reference verification + independent reviewer + prohibition list + burned-before in one posting"]
    safeguard: "none"
    slot: none
    value: "none"
  - id: fixed-urgent-vague
    routes: [freelance]
    level: 5
    cues: ["urgent, fixed budget, just make it work"]
    safeguard: "none"
    slot: none
    value: "none"
  - id: off-platform
    routes: [freelance]
    level: 5
    cues: ["contact me outside Upwork", "Telegram/WhatsApp me", "requirements unrelated to skill (gender, nationality, religion)"]
    safeguard: "none; platform-policy and payment-protection risk"
    slot: none
    value: "none"

  - id: paid-first-milestone
    routes: [freelance]
    kind: green
    level: 0
    cues: ["paid scoping phase", "paid audit first", "paid architecture assignment", "shortlist then paid assessment"]
  - id: assets-provided
    routes: [freelance]
    kind: green
    level: 0
    cues: ["PRD attached", "designs in Figma", "wireframes ready", "spec document provided"]
  - id: team-in-place
    routes: [freelance]
    kind: green
    level: 0
    cues: ["our CTO", "existing dev team", "you will work with our backend developer"]

  - id: refused-stack
    routes: [freelance, employment]
    kind: stop
    cues: ["a stack item the Job requires (not merely lists as nice-to-have) is in Profile refused_stacks"]
  - id: unmet-constraint
    routes: [freelance, employment]
    kind: stop
    cues: ["US-only", "must be based in <country>", "citizens only", "on-site", "hybrid", "relocate", "must be available <hours> in <timezone> with no overlap possible", "any location, identity, or working-arrangement requirement Profile identity.constraints cannot meet"]

  # Employment route. A cover letter carries little, so most Safeguards are relevant_work content or none.
  - id: regulated-product
    routes: [employment]
    level: 1
    cues: ["patient-facing applications", "mental healthcare platform", "clinical", "travel insurance", "health or financial data of end users"]
    safeguard: "relevant_work names regulated-domain work the Profile holds; none when it holds none"
    slot: relevant_work
    value: "domain experience is a differentiator"
  - id: exclusion-list
    routes: [employment]
    level: 1
    cues: ["This role is not for you if", "do not apply if", "we are not looking for someone who"]
    safeguard: "none; the list is fit criteria for the human at the checkpoint"
    slot: none
    value: "states expectations openly"

  - id: role-sprawl
    routes: [employment]
    level: 2
    cues: ["lead development, own technical SEO, ensure accessibility, mentor developers", "own the product end-to-end and analyse its metrics, plus backend fixes", "several specialist roles in one opening"]
    safeguard: "relevant_work leads with the core stack and the two demands the Profile covers best; the rest waits for the interview"
    slot: relevant_work
    value: "a broad role rewards a generalist"
  - id: codebase-handover
    routes: [employment]
    level: 2
    cues: ["take ownership of existing codebase areas after the departing engineer", "inherit a codebase", "stabilize and improve without slowing down the roadmap"]
    safeguard: "relevant_work cites a Project where an existing codebase was taken over and stabilised"
    slot: relevant_work
    value: "a takeover is where seniority shows"
  - id: contract-as-employment
    routes: [employment]
    level: 2
    cues: ["long-term collaboration under a B2B model", "contractor terms with paid vacation days, probation, or full-time hours"]
    safeguard: "none; the human checks at the offer that the rate carries taxes, social contributions, and unpaid leave"
    slot: none
    value: "a higher gross than employment when priced right"

  - id: unpaid-assignment
    routes: [employment]
    level: 3
    cues: ["take-home assignment before the first interview", "unpaid test task", "build a small app as part of the application"]
    safeguard: "none; the human asks for the time cap before starting"
    slot: none
    value: "acceptable when time-capped and late in the process"
  - id: overtime-culture
    routes: [employment]
    level: 3
    cues: ["work hard, play hard", "available outside working hours", "on-call without compensation", "weekend availability"]
    safeguard: "none"
    slot: none
    value: "none"

  - id: equity-for-salary
    routes: [employment]
    level: 4
    cues: ["equity instead of salary", "unpaid until funding", "deferred compensation"]
    safeguard: "none"
    slot: none
    value: "none until funded"

  - id: recruitment-scam
    routes: [employment]
    level: 5
    cues: ["pay for training or equipment", "interview by chat only", "send ID or bank details before an interview", "contact us on Telegram/WhatsApp"]
    safeguard: "none"
    slot: none
    value: "none"

  - id: practices-stated
    routes: [employment]
    kind: green
    level: 0
    cues: ["code reviews, unit tests, and design documentation as part of the daily routine", "perform code reviews and help define frontend standards", "CI/CD improvements"]
  - id: hiring-process-stated
    routes: [employment]
    kind: green
    level: 0
    cues: ["interview stages listed", "a hiring timeline", "who you will talk to and when"]

alert_level_steps:
  # Both routes, over the Flags of the Candidate's route. The hostile-tone step is freelance only: neither Flag is on the employment route.
  - "start = max level among triggered risk Flags (1 if none); stop Flags carry no level and are ignored here"
  - "+1 if three or more distinct Flags of level 2 or 3 triggered"
  - "+1 if hostile-tone or burned-before triggered together with any other Flag of level >= 2 (freelance route)"
  - "-1 if at least one green Flag triggered (once, not per green Flag)"
  - "clamp to 1..5"

hard_stops:
  - id: alert-level-5
    rule: "Alert Level is 5"
  - id: level-5-flag
    rule: "any level 5 risk Flag triggered"
  - id: rate-below-floor
    rule: "freelance route only: Job states an hourly range whose ceiling is below Profile rate_floor; no money hard stop on the employment route, pay is unknown until the offer"
  - id: refused-stack
    rule: "stop Flag refused-stack triggered (a required stack item is in Profile refused_stacks)"
  - id: unmet-constraint
    rule: "stop Flag unmet-constraint triggered (Job requires a location, identity, or working arrangement that Profile identity.constraints cannot meet)"

scores:
  scale: 1-5
  skill_fit:
    "1": "core stack or domain absent from Profile"
    "2": "half or less of required items covered"
    "3": "most items covered at shipped or used level, one gap in a secondary item"
    "4": "all items covered at shipped level"
    "5": "all items covered, plus Profile niche or Project matches the Job's domain"
  interest_fit:
    "1": "Job matches a Profile avoid list entry"
    "2": "no overlap with Profile interests"
    "3": "neutral"
    "4": "matches one Profile interest"
    "5": "matches a Profile niche"
  value:
    freelance:
      "1": "Family is last in precedence AND contract size under 10 hours at Profile rate"
      "2": "Family late in precedence OR contract size small"
      "3": "mid precedence, moderate size"
      "4": "Family early in precedence OR size large with green Flags"
      "5": "Family first in precedence AND size large AND paid-first-milestone triggered"
    employment:
      # posted salary against Profile terms.salary_floor, converted to the floor's period and currency. Not a hard stop.
      "1": "posted maximum below salary_floor"
      "2": "salary_floor inside the posted range"
      "3": "no salary stated, or no salary_floor in the Profile"
      "4": "posted minimum at or above salary_floor"
      "5": "posted minimum at least 20% above salary_floor"

verdict_mapping:
  - "any hard stop -> no-go"
  - "skill_fit 1 -> no-go"
  - "skill_fit 2 -> ask"
  - "no Family -> ask (freelance route; no Family on employment)"
  - "Alert Level 1-2 -> go"
  - "Alert Level 3 -> go; safeguards must be non-empty"
  - "Alert Level 4 -> ask; go only when skill_fit is 5, safeguards non-empty"
  - "Alert Level 5 -> no-go"

verdict_fields:
  # the `verdict` block of job.md; see catalogue/candidate-artifacts.md
  family: one of the Family ids
  family_runner_up: Family id or null
  flags: list of triggered Flag ids, green and stop Flags included
  skill_fit: 1-5
  interest_fit: 1-5
  value: 1-5
  alert_level: 1-5, computed by script
  hard_stops: list of hard stop ids triggered, may be empty
  verdict: go | no-go | ask, computed by script
  decision: null | go | no-go, human-set at the checkpoint
---

# Flag catalogue

A Flag is one named risk signal in a Job. Green Flags are signals the client or employer understands how engagements work. Stop Flags are Profile-fit failures (`refused-stack`, `unmet-constraint`): the client may be fine, the freelancer cannot take the Job. Portable across Profiles: nothing here is a personal preference. Floors, refused stacks, constraints, and interests live in the Profile; a stop Flag names the rule, the Profile supplies the list it is checked against.

## Routes

Every Flag names its routes in `routes`. The Candidate's `route` (`job.md`) selects the Flag set: `triage` judges only those Flags, `verdict.mjs` counts only those ids, and `verify` recomputes Safeguards only from them. The stop Flags are on both routes; every other Flag is on one. An employment Flag's Safeguard targets a Slot of `letter-employment.md`; a 500-character cover letter carries little, so most employment Safeguards are `relevant_work` content or `none`.

## How `triage` uses this file

1. Read the Job. For every Flag of the Candidate's route whose cues match, record its id and show the human a verbatim quote from the Job as evidence. Model judgment, guided by cues; postings are unstructured, so no keyword matching. Green and stop Flags detected in the same pass: a stop Flag's evidence is the Job quote plus the Profile entry it collides with (`refused_stacks: php` against `WordPress site`). Only ids are stored; evidence stays in the session.
2. Judge the three soft scores against the rubric in `scores` (`value` has one rubric per route), one line of reason each in the session. Only the numbers are stored.
3. Freelance route: detect the Family (see the Family catalogue). Verdict `ask` when no Family fits. No Family on the employment route.
4. A script, not the model, computes `alert_level` (steps in `alert_level_steps`), `hard_stops` (rules in `hard_stops`, floors from Profile), and `verdict` (order in `verdict_mapping`). The `proposal` guard recomputes both and rejects `job.md` when stored values disagree.
5. The human sets `decision` (`go` or `no-go`) at the checkpoint. `verdict` is the script's recommendation and is never hand-edited; `proposal` runs only on `decision: go`.

`interest_fit` never enters the verdict arithmetic. It is a tiebreaker for the human at the checkpoint.

## Levels

Risk Flags carry a Level; green Flags are Level 0; stop Flags carry none. The Alert Level measures the client's posting, so stop Flags stay out of its arithmetic: a Job on a refused stack from a good client reads as `no-go, Alert Level 1`, which is the true picture.

- Level 1: note only, engage freely.
- Level 2: caution, verify in the first exchange.
- Level 3: elevated, engage only with the safeguard stated in the Letter.
- Level 4: high, engage only with exceptional skill fit and non-negotiable safeguards.
- Level 5: do not engage.

## Budget is a routing signal, not a risk

Ambitious scope on a small budget means the client does not know what software costs. `budget-scope-mismatch` is level 1 and never escalates on its own: it is excluded from the "three or more level 2/3 Flags" step. It routes the `build` Family into pricing its own milestones. A low fixed budget is never a hard stop on its own; the human sees the budget at the checkpoint.

Client-priced test: a paid work trial whose price the client sets and pays (`$800 for completing the test`), usually with `paid-first-milestone`. The price is the client's hiring instrument, not a bid, so the Letter does not reprice it: milestones carry no prices, `billing` states no budget gap and does not accept the figure, and `fact/arithmetic` has nothing to check. The rest of `budget-scope-mismatch` holds: the plan is ours, scoped to what the test period can carry.

## Safeguards become Letter content

`proposal` reads the `safeguard` string of every triggered risk Flag from this catalogue and states it in the Slot named by `slot` (freelance: the Slot catalogue, `catalogue/templates/letter-slots.md`; employment: the Slots of `catalogue/templates/letter-employment.md`). At Alert Level 3 and 4 the Letter must state them. Flags whose safeguard is `none` contribute nothing. Safeguards are not stored on the Candidate; `verify` recomputes them from `verdict.flags` and this catalogue and checks that the target Slot states each one (`flag/safeguard-missing`, fail at Alert Level 3–4, warn at 1–2; see the Verify catalogue, `catalogue/verify.md`). The human also sees them at the Letter review.

## What the human sees first

`triage` prints this in the session, in this order, so the go/no-go call takes under a minute. None of it is stored; the Candidate keeps only the `verdict` block.

1. One line: verdict, Alert Level, Family, three scores.
2. Hard stops, if any.
3. Triggered Flags, one line each: id, level, verbatim evidence.
4. Green Flags.
5. Safeguards to state.
6. Why `ask`, or one line on why not the other verdict.
