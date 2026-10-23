# The installed resumeskills skills: which rules fold into the repo's own

Research notes, 2026-10-18. Primary sources only: the `SKILL.md` of each skill under `.agents/skills/` (no skill ships a reference file; each folder holds one `SKILL.md`), read against `GLOSSARY.md`, `AGENTS.md`, `docs/format-rules.md`, `autotriage/catalogue/{verify,voice,flags}.md`, `autotriage/catalogue/templates/letter-{employment,slots}.md`, `autotriage/skills/route/{triage,version,proposal}/SKILL.md`, `.claude/skills/resume-pdf/SKILL.md`, `resume/versions/general.md` and the Project files. Local counts come from `profile/projects/*.md` and are marked as such. Findings only; the owner decides what lands.

Scope note. The ticket names 13 skills; the list in it, the directory and `skills-lock.json` hold 12. All 12 are covered. Source ranges are line numbers in each `SKILL.md`, as installed (lock source `paramchoudhary/resumeskills`).

Reading key. A rule is one line. `Check` says how the repo would enforce it, in the vocabulary of `verify.md` (`script` or `model`, `fail` or `warn`); "new" means no existing Check covers it. "Generation" means it goes into a generating prompt or script, with no Check.

## Short answers

1. **41 rules survive in landing places 1 to 4, 24 more are held as reference, 77 are dropped.** Master generation 13, Version 14, triage 9, Letter path 5, reference only 24.
2. **The Letter path keeps almost nothing.** Both letter skills (`cover-letter-generator`, `cold-email-writer`) assume a 250-400-word formal letter with a hook, company research, enthusiasm and a call to action. `letter-employment.md` (500 characters, no hook, no company slot), `voice.md` and `verify.md` `closing/call` reject each of those. What survives is four additions to the banned lists and one overlap check.
3. **The quantifying rules split on one line: a number in a Bullet must come from a Fact.** "Every bullet needs a number" and every estimation technique conflict with the Fact definition (a verifiable claim) and with `fact/untraceable`. Local count: 50 of the 96 Story lead lines contain no digit, so a "one number per Bullet" fail would reject half the Master. The shape rules (X-Y-Z, baseline, input counts, own share) survive.
4. **`docs/format-rules.md` says "A Version never rewords a Bullet"; `resume-tailor` rewords them.** The map decision (the Version is generated prose) puts that line in question. No tailoring rule that touches Bullet wording lands until it is decided. See conflict K6.
5. **No skill supports the one-page requirement.** All of them say 1 to 2 pages (`resume-section-builder` L397). One-page lives in `resume-pdf` (`pages` check) and in the Story-selection budget (V10).
6. **Two repo rules disagree with each other on the employment route**, surfaced while checking the gap advice: `verify.md` `job/gaps-required` fails a Letter with no `gaps` when a required item is outside the `shipped` Skills, and `letter-employment.md` renders `gaps` "only when the posting asks ... never by default". K12.

## Landing place 1: Master generation (bullet-writing and quantifying)

The Bullet is generated from a Story's Facts. These rules become the generation prompt and the Checks run on the generated Bullet.

- **M1** Open with an active verb; no duty openers ("Responsible for", "Helped with", "Assisted", "Participated in", "Worked on"). Check: script on the first words, warn (new). Local: 28 of 96 lead lines open "Built", 10 "Designed", so none violates today. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L28-46, L288-294, L356.
- **M2** A Bullet states a delivered thing and its scope, never a duty. A vague object ("improved performance", "worked with stakeholders") fails unless a Fact supplies the object and the scope. Scope is a number, a named system or a named Keyword; it is not "at least one number". Check: model, warn (new). Source: `.agents/skills/resume-bullet-writer/SKILL.md` L296-315, L361.
- **M3** Shape of a Bullet: what was achieved (X), how it is measured (Y), how it was done (Z). Each part is filled from a Fact; a part with no Fact is left out, never invented. Generation. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L50-78.
- **M4** A Story needs Facts for context, action, result and scale (the STAR and CAR checklist). A missing kind raises one question to the human; the answer is appended as a Fact, the same flow as `proposal` step 2 and `fact/untraceable`. Generation. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L80-105, L326-343; `.agents/skills/resume-quantifier/SKILL.md` L85-104.
- **M5** Fact kinds to ask for on an engineering Story: scale (users, requests, data), performance (before and after latency, load time), efficiency (cost, time), and counts of the work item (components, test cases, tools). Generation. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L145-174, L202-212; `.agents/skills/resume-quantifier/SKILL.md` L40-81, L140-146; `.agents/skills/tech-resume-optimizer/SKILL.md` L148-169.
- **M6** A relative figure (percent, "x-fold", "from X to Y") carries its base: the before value, the period or the sample. Check: model, warn (new). Local precedent: loadster `claude-workflow` ("22.5 to 31.5 a month (12-month averages)"). Source: `.agents/skills/resume-quantifier/SKILL.md` L343; `.agents/skills/resume-bullet-writer/SKILL.md` L171-174.
- **M7** When the outcome was not measured, quantify the work item (counts, size) instead of dropping the number or inventing an outcome. Local precedent: "23 tools", "376 JUnit test cases", "30 MB". Generation. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L191-195; `.agents/skills/resume-quantifier/SKILL.md` L254-266, L276-282.
- **M8** On a team Story, state the person's own share when a Fact records it. Local precedent: "wrote 101 of its 207 test cases", "314 of the 332 components". Generation. Source: `.agents/skills/resume-quantifier/SKILL.md` L244-250.
- **M9** At most two or three numbers in one Bullet. Check: script, warn (new). Source: `.agents/skills/resume-quantifier/SKILL.md` L344.
- **M10** A Bullet fits two rendered lines. Check: script against the renderer's text width, fail (new; `resume-pdf` only looks for a third line by eye). Local: lead lines run 63 to 283 characters after the key, median 183, so the budget is a measurement of `resume/renderer/resume.css`, not a number from the skill. Source: `.agents/skills/resume-bullet-writer/SKILL.md` L317-322, L360, L435.
- **M11** A Bullet names the technology it was built with (last slot of the technical formula), spelled as the Project's Keyword. Check: script that every technology named in a Bullet is a Keyword of the Project, warn (new). Source: `.agents/skills/tech-resume-optimizer/SKILL.md` L128-130.
- **M12** Every number in a Bullet appears in the Story's Facts. This is the repo-native form of "a number you can explain in an interview". Check: script, fail (new; `fact/untraceable` covers Letters only). Source: `.agents/skills/resume-quantifier/SKILL.md` L333-343; `.agents/skills/tech-resume-optimizer/SKILL.md` L309-315.
- **M13** When the exact figure is confidential, state a true bound or a percentage the Fact holds, not an estimate. No Project is `naming: nda` today (10 of 10 are `public`), so this waits. Generation. Source: `.agents/skills/resume-quantifier/SKILL.md` L268-274, L341.

## Landing place 2: Version (ATS keyword, section, one-page and tailoring rules)

For the Version script and the tailoring skill. The one-page and section rules need no new rule (see Dropped D1 to D7).

- **V1** The summary contains the posting's role noun. Generator-side counterpart of the existing Check `version/title-in-summary` (script, warn). Source: `.agents/skills/resume-tailor/SKILL.md` L260; `.agents/skills/resume-ats-optimizer/SKILL.md` L124-127.
- **V2** Summary shape: identity or title, years, key Skills, value. No objective ("Seeking ..."), no trait filler ("hard-working team player", "results-oriented"), no third person. Check: script, warn (new); run the `voice.md` `banned` and `self-descriptive` lists over the summary too, since `intro` is built from it. Source: `.agents/skills/resume-section-builder/SKILL.md` L43, L67-73.
- **V3** A requirement lands in the summary first, the Skills lines second, a Bullet third; generation stops once a requirement is covered. Source: `.agents/skills/resume-ats-optimizer/SKILL.md` L122-137.
- **V4** Order Skills lines and the terms inside them by match to the Job's `requirements`, most relevant first; the top five requirements appear in the first lines. Generation. Source: `.agents/skills/resume-tailor/SKILL.md` L50, L80-92, L261; `.agents/skills/tech-resume-optimizer/SKILL.md` L98-101.
- **V5** No duplicate or variant of one Skill in the Skills lines (`React` and `React.js`). Check: script, fail (new; `resume-pdf` `source` only checks each term is a Keyword). Source: `.agents/skills/resume-ats-optimizer/SKILL.md` L242-250; `.agents/skills/resume-tailor/SKILL.md` L214.
- **V6** No proficiency labels (`Expert`, `Advanced`, `Familiar`), no skill bars, no soft skills in the Skills lines. Check: script on the line labels, fail (new). Consistent with the Glossary (a Skill is named by one Keyword, ungraded). Source: `.agents/skills/tech-resume-optimizer/SKILL.md` L84-89, L119-124; `.agents/skills/resume-section-builder/SKILL.md` L96-103, L125-131.
- **V7** Use the posting's spelling when it is a registered alias of a Keyword, since vendors match exact strings (Greenhouse documents exact-keyword filtering: `docs/research/ats-title-matching.md`). Open: `format-rules.md` says Skills terms are "spelled as the Project file's `keywords` spell it". See O2. Source: `.agents/skills/resume-ats-optimizer/SKILL.md` L238-240; `.agents/skills/resume-tailor/SKILL.md` L207.
- **V8** Report keyword coverage as matched over required, listing the unmatched; no pass threshold. Extends `version/keyword-coverage` (script, warn). The skills' 80 percent target has no vendor behind it (`docs/research/ats-title-matching.md`: Jobscan says 75 and 80 on different pages, Greenhouse does not score). Source: `.agents/skills/resume-ats-optimizer/SKILL.md` L109-120.
- **V9** An unmatched requirement that resembles a Keyword by spelling ("risk mitigation" against "risk management") is reported as an alias candidate for the ledger. It is never rewritten into a Bullet. Check: script on the Version pass, warn (new). Source: `.agents/skills/resume-ats-optimizer/SKILL.md` L101-107, L176, L200-201.
- **V10** Story selection budget: recent Projects get more Stories, older ones fewer; fill newest and most relevant first and drop the oldest and least relevant keys until `resume-pdf` `pages` passes. The skill's counts (4-6 recent, 2-3 older) are not copied. Generation. Source: `.agents/skills/resume-section-builder/SKILL.md` L146-164; `.claude/skills/resume-pdf/SKILL.md` Failures table, `pages` row.
- **V11** Within a Project, put the Story that answers the Job's top requirement first. Generation (the Version's `projects` map lists Story keys in order). Source: `.agents/skills/resume-tailor/SKILL.md` L108-118, L263.
- **V12** Truth line for the tailoring skill. It may select, order and re-term; it never changes a number, a title or a date, and never adds a Skill that is no Project's Keyword. Needed because the Version becomes generated prose. Check: the existing `resume-pdf` `source` check plus M12 applied to the Version. Source: `.agents/skills/resume-tailor/SKILL.md` L212-231.
- **V13** Each role-type base Version (general, frontend) is cut from the Master afresh, not made by subtracting from another; a tailored Version starts from the nearest base. Generation. Source: `.agents/skills/resume-version-manager/SKILL.md` L233-254 (step 4), L265-270.
- **V14** The tailoring skill prints a change report: summary before and after, Skills order, Story keys added and dropped, coverage before and after. Printed, never stored (`candidate-artifacts.md`: nothing else is stored in the folder). Source: `.agents/skills/resume-tailor/SKILL.md` L132-162, L275-304.

## Landing place 3: triage (posting analysis, match scoring, gap finding)

For `autotriage/skills/route/triage/SKILL.md` and `autotriage/catalogue/flags.md`.

- **T1** Cue lists for classifying a requirement. Required: "must have", "required", "essential qualifications", listed under "Requirements". Preferred: "nice to have", "bonus", "preferred", "ideally", "a plus". Extends step 2 of triage, which has the rule but not the cue list. Source: `.agents/skills/job-description-analyzer/SKILL.md` L386-404 (without the mention-count heuristic, see D60).
- **T2** Record how often the posting mentions each requirement, to tier Keywords as critical or important for the Version summary and Skills order (V3, V4). Mention count ranks; it never turns a preferred item into a required one. Needs a `requirements` schema change (strings today). See O3. Source: `.agents/skills/job-description-analyzer/SKILL.md` L221, L259-261; `.agents/skills/resume-ats-optimizer/SKILL.md` L168-176.
- **T3** Extract hard skills (tools, methodologies) and domain terms into `requirements`; leave soft skills out. Matches the Glossary: a Skill is a technology or domain practice. Source: `.agents/skills/job-description-analyzer/SKILL.md` L70-87; `.agents/skills/resume-ats-optimizer/SKILL.md` L81-99.
- **T4** When a posting bundles several roles, list the core role's requirements first and record the rest as other duties; `skill_fit` counts the core role. `role-sprawl` flags the posting but nothing today narrows the item list. Source: `.agents/skills/job-description-analyzer/SKILL.md` L444-447.
- **T5** Dealbreaker cues missing from the Flag catalogue: a required license, clearance or degree stated as "required". Candidate stop Flag (or cues on `unmet-constraint`). The skill's years-of-experience dealbreaker is not taken (K10). Source: `.agents/skills/job-description-analyzer/SKILL.md` L406-413.
- **T6** Add the cues "wear many hats" and "self-starter in ambiguous situations" to `role-sprawl` (level 2). Source: `.agents/skills/job-description-analyzer/SKILL.md` L123-127.
- **T7** Culture cues absent from the catalogue: "rockstar", "ninja", "guru", "like a family", "unlimited vacation". Candidate level-1 risk Flag, or cues on `overtime-culture` (level 3); the level is the owner's call. Source: `.agents/skills/job-description-analyzer/SKILL.md` L129-133.
- **T8** Add the cue "commission-based, no base salary" to `equity-for-salary` (level 4). "Competitive salary" and "DOE" with no range are already handled by `value` 3 ("pay not stated"). Source: `.agents/skills/job-description-analyzer/SKILL.md` L135-139.
- **T9** Extend `vague-posting` (freelance only today) to the employment route: a one-paragraph or no-deliverables posting is a level-1 Flag, with the human asking for clarity before applying. Source: `.agents/skills/job-description-analyzer/SKILL.md` L438-442.

## Landing place 4: Letter path (cover-letter and cold-email rules)

For `autotriage/catalogue/voice.md` (`banned`, `banned_patterns`), `verify.md` and the Slot catalogue. Today `banned` has none of these phrases.

- **L1** Add openers to `banned`: "I am writing to apply", "I am writing to express my interest", "I saw your job posting". Check: script, fail (`voice/banned-phrase`). Source: `.agents/skills/cover-letter-generator/SKILL.md` L92-96; `.agents/skills/cold-email-writer/SKILL.md` L170-172.
- **L2** Add closers to `banned`: "please find my resume attached", "at your convenience", "I would love the opportunity", "I am excited to" (the list has only "I'm excited"). Check: script, fail. Source: `.agents/skills/cover-letter-generator/SKILL.md` L139-142; `.agents/skills/cold-email-writer/SKILL.md` L115-119.
- **L3** Add self-deprecation patterns to `banned_patterns`: "I may not have", "on the off chance", "I know I may not". Check: script, fail (today only the model-run `voice/apology` catches them). Source: `.agents/skills/cold-email-writer/SKILL.md` L161-164; `.agents/skills/application-form-filler/SKILL.md` L237-239.
- **L4** Add overclaim and flattery phrases to `banned` or `soft_banned`: "exceptional addition", "uniquely positions me", "I love what you're building", "your mission resonates", "most exciting companies". Check: script (`voice/banned-phrase` or `voice/soft-banned`). Source: `.agents/skills/cold-email-writer/SKILL.md` L43-46, L156-160.
- **L5** No run of six or more words copied verbatim from the `job.md` body into the Letter, except an ask header (the Slot catalogue copies client questions on purpose). Check: script (new). Source: `.agents/skills/application-form-filler/SKILL.md` L77, L229-231; `.agents/skills/cold-email-writer/SKILL.md` L137.

## Landing place 5: reference only, no landing place yet

Kept as reading notes. Each needs a surface the repo does not have: a case-study output, a screening-question skill, an outreach Route, a field in `job.md`, or Profile curation.

Case study (`portfolio-case-study-writer`); the Facts of a Story are the only source, so these wait on a case-study output.
- **R1** Case-study order: overview, problem, process, solution, results, learnings. `.agents/skills/portfolio-case-study-writer/SKILL.md` L37-46.
- **R2** Overview block (role, timeline, team, one-line impact): role and timeline map to Project `role`, `start`, `end`; team size is not a Project field. `.agents/skills/portfolio-case-study-writer/SKILL.md` L54-75.
- **R3** Results as before and after with a timeframe, from Facts. `.agents/skills/portfolio-case-study-writer/SKILL.md` L188-220.
- **R4** Engineer case study focus: architecture, problem-solving, system design, code quality. `.agents/skills/portfolio-case-study-writer/SKILL.md` L268-273.
- **R5** "What I would do differently" section; no Story holds a learnings field. `.agents/skills/portfolio-case-study-writer/SKILL.md` L222-250.
- **R6** Visual asset list and captions. `.agents/skills/portfolio-case-study-writer/SKILL.md` L282-300, L354-356.

Screening questions (`application-form-filler`); `proposal` leaves these to the human and the Answers (`profile/answers/`).
- **R7** Answer exactly the question asked; one purpose per field. `.agents/skills/application-form-filler/SKILL.md` L19, L25-30.
- **R8** "Years with X": give years honestly, anchored to a real Project. A script could derive years per Keyword from Project `start`, `end` and `keywords` (a derived Fact; overlapping spans must merge). The Glossary excludes years from Skills, not from Facts. `.agents/skills/application-form-filler/SKILL.md` L36-54, L104-125.
- **R9** "Why this company": specific, tied to real work, under 150 words, no JD echo. `.agents/skills/application-form-filler/SKILL.md` L58-77.
- **R10** "Tell us about yourself": current role first, forward-looking end, no trait statements, 100-200 words. `.agents/skills/application-form-filler/SKILL.md` L129-148.
- **R11** Behavioral questions: condensed STAR without labels, end on the result, 150-250 words. `.agents/skills/application-form-filler/SKILL.md` L152-171.
- **R12** Ratings and dropdowns: pick the honest level. `.agents/skills/application-form-filler/SKILL.md` L119, L123-124.
- **R13** Length by field type (one sentence, 2-4 sentences, 100-250 words). `.agents/skills/application-form-filler/SKILL.md` L214-225.

Outreach (`cold-email-writer`, `cover-letter-generator`); `route` is `freelance | employment`, so no outreach Route exists.
- **R14** Hook names one specific fact about the company, never a generic compliment. `.agents/skills/cold-email-writer/SKILL.md` L30-46.
- **R15** Subject line is a plain name ("Quick intro, Name"); portfolio link on one line. `.agents/skills/cold-email-writer/SKILL.md` L24-28, L96-101.
- **R16** Address the recipient by name; lead with a referral when there is one. Needs a contact-name field in `job.md`; the greeting is fixed by `voice.md` today. `.agents/skills/cold-email-writer/SKILL.md` L125; `.agents/skills/cover-letter-generator/SKILL.md` L207-211.
- **R17** Length 150 to 300 words. `.agents/skills/cold-email-writer/SKILL.md` L131-137.

Process and Profile curation.
- **R18** GitHub hygiene (pinned repositories, READMEs); the contact line links `github.com/konfrontend`. `.agents/skills/tech-resume-optimizer/SKILL.md` L282-295.
- **R19** Tracker could hold application method and follow-up dates; `tracker` prints neither. `.agents/skills/resume-version-manager/SKILL.md` L203-213; `.agents/skills/job-description-analyzer/SKILL.md` L338-352.
- **R20** Company research before applying (reviews, tenure, funding, layoffs, pay data). Needs the web; a human step. `.agents/skills/job-description-analyzer/SKILL.md` L328-334.
- **R21** Check why a posting was reposted. No data on disk to detect a repost. `.agents/skills/job-description-analyzer/SKILL.md` L454-457.
- **R22** Certifications section format. The Profile holds no certification and `format-rules.md` has no such section. `.agents/skills/tech-resume-optimizer/SKILL.md` L46; `.agents/skills/resume-section-builder/SKILL.md` L240-247.
- **R23** Admit a Project only with real users, open-source or published code, or real complexity; exclude tutorial follow-alongs, trivial apps, unfinished work. A Profile curation rule: it decides which Projects exist, not what a Version shows. `.agents/skills/tech-resume-optimizer/SKILL.md` L236-249.
- **R24** Interview-prep note: be ready to explain every listed Project. `.agents/skills/tech-resume-optimizer/SKILL.md` L309-315.

## Dropped

Reason codes: **Dup** the repo already does it; **HW** assumes a hand-written master or a person rewriting their own resume; **NA** does not apply to this Profile; **Gen** generic advice with no check behind it; **Conf** conflicts with a repo rule (K numbers refer to the conflict list below).

| Id | Dropped rule | Source | Why |
| --- | --- | --- | --- |
| D1 | Standard section headers (Experience, Skills, Summary) | `resume-ats-optimizer` L59-64, L221-230 | Dup: `format-rules.md` "ATS-recognized set only" |
| D2 | Section order summary, Skills, experience, projects | `tech-resume-optimizer` L37-47; `resume-section-builder` L303-317 | Dup: `format-rules.md` section order |
| D3 | Single column, no tables or images, contact not in header or footer | `resume-ats-optimizer` L50-57, L208-219 | Dup: `resume.css` and `resume-pdf` (images, text layer, first line) |
| D4 | Text-based PDF, standard fonts, 10-12 pt body | `resume-ats-optimizer` L45-52 | Dup: `resume-pdf` fonts and text-layer checks |
| D5 | Contact line contents (location, email, GitHub, LinkedIn; no photo, no street address) | `resume-ats-optimizer` L66-77; `tech-resume-optimizer` L49-69 | Dup: `format-rules.md` contact line |
| D6 | One date format throughout | `resume-ats-optimizer` L56 | Dup: `format-rules.md` dates (the skill's pattern conflicts, K3) |
| D7 | Skills grouped by category | `tech-resume-optimizer` L75-82; `resume-section-builder` L86-94 | Dup: Version `skills` is hand-grouped lines |
| D8 | Sent-file name by role, company, date | `resume-version-manager` L133-142 | Dup: adopted in `format-rules.md` sent PDF name |
| D9 | Copy the master, never edit it | `resume-version-manager` L232-254 (steps 1-2), L297; `resume-tailor` L236-243 | Dup: the Master is generated, never edited (Glossary) |
| D10 | Track which version went where; tracker sheet | `resume-version-manager` L191-213, L346; `resume-tailor` L242-244 | Dup: `cover-letter.md` `version`, `tracker` skill |
| D11 | Formats for several roles at one company, short tenure, freelance | `resume-section-builder` L166-192 | Dup: role row derived from Project meta |
| D12 | Project line format `Name / Technologies / Link` | `tech-resume-optimizer` L209-216; `resume-section-builder` L281-286 | Dup: superseded by the entry heading in `format-rules.md` |
| D13 | Top-3 strengths to emphasize | `job-description-analyzer` L197-211 | Dup: triage Skills table plus `relevant_work` match |
| D14 | Decision factors and recommendation prose | `job-description-analyzer` L363-383 | Dup: triage summary closing line |
| D15 | Resume strategy and cover letter talking points inside the analysis | `job-description-analyzer` L239-299 | Dup: the `version` and `proposal` States own these |
| D16 | Gap severity tiers (critical, major, minor) | `job-description-analyzer` L112-117 | Dup: `skill_fit` rubric levels 1 to 3 |
| D17 | Required items matched as n over m | `job-description-analyzer` L91-102 (required part) | Dup: `skill_fit` rubric |
| D18 | Location requirement as dealbreaker | `job-description-analyzer` L413 | Dup: stop Flag `unmet-constraint` |
| D19 | Non-dealbreaker list (slightly low years, preferred degree, nice-to-have tools) | `job-description-analyzer` L415-419 | Dup: triage step 2, required items only |
| D20 | Analyze the job before tailoring | `job-description-analyzer` L18; `resume-tailor` L16 | Dup: Route order is triage then version |
| D21 | Salary red flags ("competitive salary", "DOE") | `job-description-analyzer` L135-139 | Dup: `value` 3 "pay not stated" (commission cue kept as T8) |
| D22 | Do not apologise for gaps | `cover-letter-generator` L213-218; `cold-email-writer` L161-164 | Dup: `voice/apology` (phrase patterns kept as L3) |
| D23 | Cut what fits any company | `cold-email-writer` L137; `application-form-filler` L245-247 | Dup: Slot catalogue "a paragraph that answers nothing in the Job is dropped" |
| D24 | Work as context, one or two projects, no achievement lists | `cold-email-writer` L76-80 | Dup: `relevant_work` (no counts, two Projects) |
| D25 | Disclose location early | `cold-email-writer` L48-54 | Dup: `unmet-constraint` stops incompatible Jobs; `terms` covers the rest |
| D26 | Mention only genuine stack overlap; name technologies | `cold-email-writer` L127; `cover-letter-generator` L176-179 | Dup: `relevant_work` traced to Keywords |
| D27 | Master template with all bullets, summaries and keywords per job | `resume-version-manager` L42-107 | HW: the Master is generated from the Profile |
| D28 | Folder tree with PDFs, cloud backup, archive | `resume-version-manager` L111-131, L286-302 | HW: `private/candidates/` and git; also K16 |
| D29 | "Original bullet, issues, improved version" report | `resume-bullet-writer` L364-393; `resume-quantifier` L284-325 | HW: Bullets are generated, nothing to rewrite |
| D30 | Example banks for sales, marketing, customer success, data, operations, PM | `resume-bullet-writer` L200-284 | NA: other roles, invented figures |
| D31 | Entry-level, career-changer, executive and employment-gap handling | `resume-bullet-writer` L395-426; `resume-section-builder` L45-65, L319-341; `resume-ats-optimizer` L274-294; `resume-version-manager` L279-284 | NA: 12-year profile; "years only" also hits K3 |
| D32 | Metric discovery lists outside engineering | `resume-quantifier` L106-159 | NA |
| D33 | Industry notes for healthcare, finance, marketing | `resume-ats-optimizer` L259-272 | NA |
| D34 | DevOps, data and PM bullet examples | `tech-resume-optimizer` L171-199 | NA: invented figures for other roles |
| D35 | Markdown report templates in every skill | all twelve `SKILL.md` "Output Format" sections | HW: the plugin prints session output and stores nothing (`candidate-artifacts.md`) |
| D36 | Power-verb lists | `resume-bullet-writer` L107-139 | Gen: no check; includes hype verbs (Spearheaded, Orchestrated, Championed); M1 covers verb quality |
| D37 | Statistics: 75 percent of resumes rejected by an ATS, 30 percent more attention | `resume-ats-optimizer` L29; `resume-quantifier` L33-36 | Gen: unsourced; `docs/research/ats-title-matching.md` finds Greenhouse does not score and Jobscan says its ATS does not score |
| D38 | Keyword density, critical terms 2 to 4 times | `resume-ats-optimizer` L139-143, L317 | Gen: only iCIMS documents count and position (same research file); no Version check exists or is proposed |
| D39 | Test with an ATS simulator; estimated new match score | `resume-ats-optimizer` L203, L309; `resume-tailor` L303 | Gen: no model of the score |
| D40 | Quantification templates (before and after, scale, volume, ranking) | `resume-quantifier` L208-240 | Gen: covered by M3 and M6 |
| D41 | Lists of technologies to include by category | `tech-resume-optimizer` L96-117 | Gen: Keywords come from Project files |
| D42 | What tech recruiters look for; ATS and recruiter balance | `tech-resume-optimizer` L25-33, L357-370 | Gen |
| D43 | Quality checklists ("no typos", "would make you want to interview") | `cover-letter-generator` L264-277 | Gen: no check behind |
| D44 | Quarterly master review, dated files, backups | `resume-version-manager` L217-231, L286-302 | Gen: git |
| D45 | Overqualified bands, apply within 48 hours, competition and tailoring time estimates | `job-description-analyzer` L104-110, L155-159, L338-352 | Gen: no data; the verdict is computed from `skill_fit` and Flags |
| D46 | Hook types, alternative openings, interview talking points | `cover-letter-generator` L61-90, L248-262 | Gen: one Letter; no hook on the employment route |
| D47 | Tone matched to startup, enterprise, finance | `cover-letter-generator` L174-193; `resume-version-manager` L160-173 | Gen: `voice.md` is route-free, one voice |
| D48 | Tailoring scenarios (non-tech company, management, startup, big company) | `resume-tailor` L164-202 | Gen |
| D49 | Example summaries and role-type tables | `resume-tailor` L61-78; `resume-version-manager` L146-189 | Gen: examples only; the sample summaries use banned wording (K14) |
| D50 | Replace "extensive" and "quick to ramp on new frameworks" for a stack mismatch | `tech-resume-optimizer` L303-307 | Conf K13: banned "extensive experience", trait claim |
| D51 | Education section content | `resume-ats-optimizer` L62; `tech-resume-optimizer` L46, L251-278; `resume-section-builder` L194-238 | Conf K2 |
| D52 | Total length 1 to 2 pages | `resume-section-builder` L397 | Conf K1 |
| D53 | MM/YYYY dates | `resume-ats-optimizer` L56 | Conf K3 |
| D54 | Phone number in the contact block | `resume-ats-optimizer` L66-77; `tech-resume-optimizer` L51-58 | Conf K4 |
| D55 | File name `FirstName_LastName_Resume.pdf`; `[LastName]_Resume_[TargetRole]_[Company]_[Date]` | `resume-ats-optimizer` L48; `resume-tailor` L246-254 | Conf K5 |
| D56 | Reword Bullets with posting keywords; add new bullets; "modify bullet points" | `resume-tailor` L23, L53-55, L120-126, L295; `resume-ats-optimizer` L192-194 | Conf K6, decision O1 |
| D57 | Reorder jobs by relevance | `resume-tailor` L96-107; `job-description-analyzer` L241-251 | Conf K7 |
| D58 | Volunteer, Languages, Publications, Awards sections | `resume-section-builder` L258-276, L295-299 | Conf K8 |
| D59 | Every Bullet has a number; every Bullet can be quantified; target 100 percent | `resume-bullet-writer` L143, L355-357; `resume-quantifier` L292-294, L330, L346-350 | Conf K9 |
| D60 | Mentioned 3 or more times means required | `job-description-analyzer` L396, L404 | Conf K11 (mention count kept as ranking in T2) |
| D61 | Estimate numbers: tilde, ranges, "conservative" guesses, derived totals | `resume-bullet-writer` L176-198; `resume-quantifier` L161-206 | Conf K9 |
| D62 | Years of experience as a requirement or dealbreaker | `job-description-analyzer` L53, L167, L411 | Conf K10 |
| D63 | Weight required 70 and preferred 30 in the score | `job-description-analyzer` L97-102 | Conf K11 |
| D64 | Omit minor gaps; volunteer major gaps with "I am learning X" | `job-description-analyzer` L224-235, L298-299; `cover-letter-generator` L114-122 | Conf K12, K13 |
| D65 | Letterhead, date, recipient address, "Sincerely" | `cover-letter-generator` L44-59, L146-172 | Conf K14 |
| D66 | Letter length 250 to 400 words | `cover-letter-generator` L40, L275 | Conf K14 |
| D67 | Greeting "Dear ..." | `cover-letter-generator` L158, L197-205 | Conf K14 |
| D68 | Never start with "I" | `cover-letter-generator` L96 | Conf K14 |
| D69 | Close with enthusiasm and a call to action | `cover-letter-generator` L133-137; `cold-email-writer` L106-109 | Conf K14 |
| D70 | Letter must show company research | `cover-letter-generator` L31-35, L267-270 | Conf K14 |
| D71 | Link GitHub or portfolio in the Letter | `cover-letter-generator` L176-179 | Conf K14 |
| D72 | "I feel like I'd be a strong fit" | `cold-email-writer` L86-89, L159 | Conf K14 |
| D73 | Example cold email as a template | `cold-email-writer` L178-213 | Conf K14: uses contrast negation ("not just building an LLM layer", "not just wrapped APIs") |
| D74 | Proficiency tiers as a Skills layout option | `tech-resume-optimizer` L84-89; `resume-section-builder` L96-103 | Conf K15 (the ban is V6) |
| D75 | Include GitHub and portfolio links in Skills, not header | `resume-ats-optimizer` L256 | Conf K15 |
| D76 | Archive old versions in folders; keep PDFs | `resume-version-manager` L111-131, L302 | Conf K16 |
| D77 | Bullets per role by career stage (4-6, 2-3) | `resume-section-builder` L146-164 | Conf K1 (the allocation idea is V10; the counts are dropped) |

Count: 77 dropped (D1 to D77): 26 Dup (D1-D26), 9 HW or NA (D27-D35), 14 Gen (D36-D49), 28 Conf (D50-D77).

## Conflicts with the repo's rules

Every conflict below names the repo rule. "Decision" means the answer is not simply "drop"; it is listed under Open decisions.

- **K1 Pages.** `resume-section-builder` L397 allows 1 to 2 pages; `AGENTS.md` and `resume-pdf` `pages` require exactly one A4 page. Dropped (D52, D77).
- **K2 Education.** Three skills include an Education section; `format-rules.md`: "No Education section". `docs/research/ats-title-matching.md` Q4 finds no parser treats a missing Education section as a failure. Dropped (D51).
- **K3 Dates.** `resume-ats-optimizer` L56 says `MM/YYYY`; `format-rules.md` says `Mon YYYY – Mon YYYY`. Dropped (D53).
- **K4 Phone.** `resume-ats-optimizer` L69 and `tech-resume-optimizer` L54 put a phone in the contact block; `format-rules.md`: "No phone". `docs/research/ats-title-matching.md` Q3 finds no documented ATS fails on a missing phone. Dropped (D54).
- **K5 Sent file name.** Two skill patterns differ from `Dolbilov_<Role>_<Company>_<MonYYYY>.pdf` in `format-rules.md`; the third (`resume-version-manager` L135-136) matches it. Dropped (D55).
- **K6 Rewording Bullets.** `resume-tailor` L53-55, L120-126 rewrites Bullets to carry posting keywords; `format-rules.md`: "A Version never rewords a Bullet; a wording that only one application needs is a Story edit or a new Story". The map decision (the Version is generated prose cut from the Master) may retire that line. Until it is decided, no tailoring rule that touches Bullet wording lands. `resume-ats-optimizer` L192-194 also proposes adding a new bullet that no Fact supports, which fails M12 and the `fact/untraceable` logic. Decision O1; dropped as written (D56).
- **K7 Project order.** `resume-tailor` L96-107 and `job-description-analyzer` L241-251 reorder jobs by relevance; `profile.md` `resume_order` fixes the order and the Version's `projects` follows it (`resume-pdf`). Dropped (D57).
- **K8 Extra sections.** Volunteer, Languages, Publications and Awards sections conflict with the four fixed sections in `format-rules.md`; the Glossary excludes spoken languages from Skills. Dropped (D58).
- **K9 Numbers.** "Every bullet needs a number", "every bullet can be quantified" and the estimation techniques conflict with the Fact definition ("one verifiable claim"), `fact/untraceable` (fail) and `voice.md` "No arithmetic for the reader". Local count: 50 of 96 lead lines have no digit. Dropped (D59, D61); M2 and M12 are the replacements.
- **K10 Years.** `job-description-analyzer` counts years of experience as a requirement and a dealbreaker; triage step 2 excludes "years of experience, spoken languages or seniority words" and the Glossary says years are not Skills. Dropped (D62).
- **K11 Preferred items and mention counts.** A 70/30 weight and "3 or more mentions means required" pull preferred items into the score; triage step 2 and the Slot catalogue `gaps` rule say a preferred or nice-to-have item is never counted and never a gap. Dropped (D60, D63).
- **K12 Gap handling.** `job-description-analyzer` L233-235 says do not mention a minor gap; `verify.md` `job/gaps-required` fails a Letter when a required item is outside the `shipped` Skills and `gaps` does not name it. The same `verify.md` rule collides with `letter-employment.md`: `gaps` renders "only when the posting asks ... Never by default", while `job/gaps-required` runs on `routes: [freelance, employment]`. On the employment route, a required gap with no ask in the posting fails `verify` for omitting `gaps`, and including `gaps` breaks the template. This is a conflict between two repo files, not with a skill. Decision O4; the skill advice is dropped (D64).
- **K13 Invented mitigation.** "I am learning SQL through DataCamp" style sentences (`job-description-analyzer` L226, L299; `cover-letter-generator` L116) are facts the Profile lacks; `fact/untraceable` and the voice rule "The Letter holds no fact the Profile lacks" reject them. Dropped (D50, D64).
- **K14 Letter shape and voice.** Against `letter-employment.md`, `voice.md` and `verify.md`: 250-400 words against 500 characters (`cap.chars`); letterhead and recipient block against `format/contact` and "no contact details"; "Dear" against `banned: "Dear"` and `greeting.employment`; "Sincerely" against `sign_off`; hook and company-research requirements against "no Hook Slot" and the absence of a company Slot; a call to action against `closing/call`; enthusiasm examples ("I'm excited", `cover-letter-generator` L69, L84, L130) against `banned: "I'm excited"`; "I feel like I'd be a strong fit" against "no self-assessment words"; the cold-email example text against `voice/contrast-negation` (warn). The skills' own sample summaries use "track record", "proven" and "Expert in" (`resume-tailor` L72, L77; `resume-section-builder` L54, L59), which `banned` and `voice/self-descriptive` reject if applied to the summary (V2). Dropped (D65 to D73).
- **K15 Skills placement.** Proficiency tiers conflict with the Glossary (a Skill is one ungraded Keyword); GitHub and portfolio links in Skills conflict with the contact line in `format-rules.md`. Dropped (D74, D75).
- **K16 Stored PDFs.** `resume-version-manager` L111-131, L302 keeps PDFs and archives per version; `candidate-artifacts.md`: "No PDF" in the Candidate folder. Dropped (D28, D76).

## Open decisions for the map

- **O1** Does the Version keep "never rewords a Bullet" (K6)? If yes, tailoring is selection and ordering only (V4, V10, V11 stand; wording changes are Story edits). If no, `format-rules.md` changes and V12 becomes the guard on wording.
- **O2** When a posting spells a Skill differently from its Keyword (`Vue 3` against `Vue.js`), does the Version show the Keyword or the posting's spelling (V7)? `format-rules.md` and `version/keyword-coverage` assume the Keyword.
- **O3** `requirements` is a string list (`job-employment.schema.json`). T2 needs a mention count or a tier per entry.
- **O4** Resolve K12: should `job/gaps-required` run on the employment route, given `letter-employment.md` renders `gaps` only on an ask?
- **O5** T5 to T9 change `flags.md` cues and levels; the owner sets the levels.
- **O6** Whether `voice.md` checks apply to the Version summary (V2), since the Letter's `intro` is built from it.
- **O7** Whether to build the years-per-Keyword script (R8) for screening forms.

## Confidence and gaps

- High: the quoted line ranges (each was read in the installed file) and the repo rules compared against. Conflicts K1 to K11 and K14 to K16 compare text that exists on disk side by side.
- High: K12. Both rules were read in full: the `verify.md` Checks list and `job` section, and the `letter-employment.md` Slot notes and rule switch 6.
- Local counts (96 lead lines, 50 without a digit, 63 to 283 characters with median 183, 10 of 10 Projects `naming: public`) come from `grep` over `profile/projects/*.md` on this branch. The lead-line pattern is `- [key] ...`; only the lead line is counted, not the indented Facts.
- The skills' vendor and recruiter claims (ATS rejection rates, attention and memorability figures, "80 percent match") carry no source in the skills. They are compared only with `docs/research/ats-title-matching.md`, which covers title matching, headline, phone and education and says nothing on keyword density or a pass threshold. D38 therefore rests on that file's iCIMS note alone.
- Check names and severities for new Checks (M1, M2, M6, M9 to M12, V2, V5, V6, V9, L5) are proposals in the `verify.md` vocabulary; none is implemented or tested. No script was run.
- Counts: M 13, V 14, T 9, L 5 (41 survivors); R 24 (reference); D 77 (dropped).
