---
status: accepted
---
# Stories hold the Bullets; the Master and the Skill ledger are generated

Every Bullet exists once, as the lead line of a Story in a Project file, under a key that never changes. A Version is a selection of those keys with its own Skills lines and summary; the renderer assembles the resume from the Project files. The Master (every Story in resume order) and the Skill ledger (Skills from the Projects' keywords, Gaps and Seen counts from the Candidates' requirements) are pure functions of the Profile, written to committed files that nothing reads, so their git history shows how the resume and the demand change over time. Chosen over a hand-written Master of polished Bullets citing Stories, which would keep two phrasings of every fact, and over hand-copied Version prose, which drifted from the Stories within weeks.

## Consequences

- A wording only one application needs is a Story edit or a new Story, never a Version edit.
- Skills are never declared: a Skill exists because a Project file names it in `keywords`, and `level` is one derived field, `shipped` or `gap`; `used` and `learning` are gone.
- A Story key is part of the Profile's contract: renaming one breaks every Version that selects it, so the Guard and the renderer refuse an unknown key.
