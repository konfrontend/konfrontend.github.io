# Professional profile

The source of one web developer's CVs and proposals. The Profile holds every Project and Skill; a Job becomes a Candidate, and a Route turns it into a Letter, with a tailored Version on the employment route.

## Language

### Profile

**Profile**:
The person's data every Version and Letter draws from: the Master, the project files, the Skills, terms and voice.
_Avoid_: user profile, persona

**Master**:
The single document of the Profile every Version is copied from: contact, summaries, skills and one entry per Project.
_Avoid_: draft, pool, resume source

**Project**:
One job, engagement or personal project, done or ongoing; an ongoing Project has no end date. One entry in the Master and one project file.
_Avoid_: Past Job, company, client, position, experience, portfolio item

**Project file**:
The full record of one Project: its Bullets grouped by Theme, closed by its Keywords line.
_Avoid_: pool, inventory, log

**Theme**:
A named group of Bullets inside a project file, such as "Browser extension".
_Avoid_: section, category, area

**Bullet**:
One prose line of a Project's work, backed by its Facts, in a project file or in a Version.
_Avoid_: highlight, point, achievement

**Fact**:
One verifiable claim about a Project, such as its client, stack, a number or an outcome, that a Bullet or Letter may cite.
_Avoid_: detail, data point

**Naming**:
How far a Project's client and product may be identified in a Version or Letter: `public`, `first-name-only` or `nda`.
_Avoid_: visibility, privacy, disclosure

**Keywords line**:
The Skills one Project proves, closing its project file.
_Avoid_: skills line, tech stack, tags

**Skill**:
One technology or domain practice the Profile tracks, with a Level and its Evidence. Years of experience and spoken languages are not Skills.
_Avoid_: technology, stack item, competency, capability

**Level**:
How far a Skill is proven: `shipped` (a Project shows it in production), `used` (used, not shipped in a Project), `learning` (studied, no use), `gap` (Jobs require it, the person has not used it).
_Avoid_: proficiency, seniority, rating, production, working

**Evidence**:
The Projects that prove a Skill's Level.
_Avoid_: proof, references, sources

**Gap**:
A Skill at Level `gap`. Exists only because a Job required it.
_Avoid_: missing skill, weakness, hole

**Seen**:
The Candidates whose Job required a Skill. Their count is the Skill's demand.
_Avoid_: mentions, occurrences, hits, count

**Target**:
A Gap Seen at least the Profile's threshold of times. A signal only: what the person does about it is outside the Route.
_Avoid_: hot, priority, candidate skill

### Jobs

**Job**:
One posting, freelance or employment: its free-form text plus explicit parameters (timezone, budget, anything the text omits).
_Avoid_: posting, listing, gig, opportunity

**Candidate**:
A Job being pursued, moving through a Route. Becomes a Project when won.
_Avoid_: application, lead

**Tracker**:
The list of Candidates and where each stands.
_Avoid_: pipeline, log, spreadsheet

**Family**:
The engagement shape a freelance Letter proposes for a Job: `audit`, `fix`, `build`, `maintenance`. Selects the Letter template, its active Slots and default topics. The client's project type is a detection signal, not the Family.
_Avoid_: type, category, kind, project type, engagement model

### Workflow

**Route**:
A fixed sequence of States an agent follows for one kind of work. Agents follow it; they do not invent steps.
_Avoid_: pipeline, flow, workflow

**State**:
One step of a Route. Each State has one skill and one output artifact.
_Avoid_: stage, phase, step

**Guard**:
The deterministic check a State runs before it loads: the previous State's artifact exists and validates, and the Route's preconditions hold. A failing Guard refuses the State with the reason and the next command to run.
_Avoid_: gate, precondition check, validation step

**Verdict**:
Triage output: `go`, `no-go`, or `ask`, with scores and triggered Flags.
_Avoid_: decision, result, assessment

**Flag**:
One named risk signal in a Job, with a level 1–5 from the Flag catalogue. A Green Flag is a Flag of level 0 that lowers the Alert Level. A Stop Flag is a Profile-fit failure (refused stack, unmet constraint) with no level that forces a Hard Stop.
_Avoid_: red flag, warning, concern

**Alert Level**:
The Candidate's overall risk, 1–5: highest triggered Flag adjusted by combination rules.
_Avoid_: risk score, severity

**Hard Stop**:
A condition that forces Verdict `no-go` regardless of scores: Alert Level 5, a level 5 Flag, a Stop Flag, or a Job term below a Profile floor.
_Avoid_: dealbreaker, blocker

**Safeguard**:
The term a triggered Flag makes the Letter state, in a fixed Slot, to protect the person from the risk the Flag names. Names only what the Job or the human states.
_Avoid_: mitigation, condition, caveat

### Outputs

**Version**:
One CV document made from the Master: the general Version behind the public PDF, or one tailored to a Candidate's Job.
_Avoid_: draft, template, CV file

**Letter**:
The final pasteable text a Route ends with: a proposal on the freelance route, a cover letter on the employment route. The Route ends when the Letter is sent.
_Avoid_: bid, application, pitch

**Slot**:
One named part of a Letter template, called by its name plus Slot: Hook Slot, relevant work Slot, gaps Slot, milestones Slot, terms Slot, closing Slot. A template orders and activates Slots.
_Avoid_: section, block, fragment

**Hook Slot**:
The first paragraph of a Letter after the greeting: the client's goal and its main constraint restated as understood, sized to the preview the client sees before opening. Never an introduction, never a pitch.
_Avoid_: Hook, opener, intro, first sentence

### Verification

**Check**:
One named rule `verify` applies to a Letter, by script or by model judgment.
_Avoid_: rule, lint, test

**Finding**:
One violation of a Check in one Slot, graded `fail` or `warn`.
_Avoid_: error, issue, violation, warning

**Fix**:
The change `verify` applies to the Letter for a Finding: a patched sentence or a regenerated Slot.
_Avoid_: correction, repair, remediation
