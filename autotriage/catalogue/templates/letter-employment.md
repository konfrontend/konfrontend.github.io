---
route: employment
cap: { chars: 500 }
slots:
  - greeting
  - intro
  - relevant_work
  - { id: terms, when: job asks }
  - closing
  - sign_off
---

# Letter template: employment

The cover letter of the employment route, selected by `route: employment` in `job.md`; `letter-freelance.md` serves the freelance route. It goes out with the application form and the resume PDF, so it says who is writing and what they work in, and leaves the Projects, the dates and the contact details to the PDF. `proposal` writes it into `letter.md`, which the `version` State created empty; `verify` checks it against this template. A resume-only application leaves `letter.md` empty. Order and the rules for every route are in the Slot catalogue `letter-slots.md`, `Employment route`.

Cap: 500 characters for the whole Letter, greeting and sign-off included (`cap.chars`). No word cap, no Hook Slot, no `answers`, no headers, no lists.

Slot notes for this template:

- `greeting`: the Profile `voice.md` `greeting.employment` (`Hello,`).
- `intro`: the summary of the Version sent (the Candidate's `version.md` when tailored, else `resume/versions/general.md`) in first person, rephrased to the posting's keywords. A role title and `10+ years` are allowed here only.
- `relevant_work`: one paragraph. Stack and domains in prose, picked by match to the Job's requirements, every item traced to a Project's `keywords`, Overview, Bullets or Notes. No Project names, no dates: the PDF carries them. When a required item has no Project proving it, the nearest thing done may appear here as work done, with no mention of the item.
- `terms`: only when the posting asks (availability, notice, location, overlap). Same fill as the Slot catalogue `terms`; no salary figure unless the posting asks for one.
- `closing`: one line, always, the same rule as the proposal.
- `sign_off`: the Profile `voice.md` `sign_off`.

## Rule switches on this route

The voice catalogue applies as on the freelance route, with these switches:

1. The no-introduction rule is off: `intro` opens the Letter where the freelance route has the Hook Slot.
2. A role title (`frontend developer`) is allowed in `intro` only. `senior`, `lead`, `expert`, `experienced` stay banned everywhere.
3. `10+ years` is allowed as a fact in `intro`. `extensive experience` stays banned.
4. The contact ban stays: the application form and the PDF carry contact.
5. Length is this template's 500 characters. The 350-word prose cap, the 700-word total and the 4,500-character ceiling are freelance template numbers.
6. `terms` renders when the posting asks.
7. No Project names or dates anywhere in the Letter.
8. Everything else applies as is: banned phrases, no `we`, no exclamation mark, no Markdown, no apology, rhythm, no arithmetic, every fact traceable.
