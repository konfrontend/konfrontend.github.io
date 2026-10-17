---
route: employment
cap: { chars: 500 }
slots:
  - greeting
  - intro
  - relevant_work
  - { id: gaps, when: job asks }
  - { id: terms, when: job asks }
  - closing
  - sign_off
---

# Letter template: employment

The cover letter of the employment route, selected by `route: employment` in `job.md`; the four Family templates serve the freelance route. It goes out with the application form and the CV PDF, so it says who is writing and what they work in, and leaves the Projects, the dates and the contact details to the PDF. `proposal` writes it to `cover-letter.md`; `verify` checks it against this template. Order and the rules for every route are in the Slot catalogue `letter-slots.md`, `Employment route`.

Cap: 500 characters for the whole Letter, greeting and sign-off included (`cap.chars`). No word cap, no Hook Slot, no `answers`, no headers, no lists.

Slot notes for this template:

- `greeting`: the Profile `voice.md` `greeting.employment` (`Hello,`).
- `intro`: the picked Version's summary in first person, rephrased to the posting's keywords. A role title and `10+ years` are allowed here only.
- `relevant_work`: one paragraph. Stack and domains in prose, picked by match to the Job's requirements, every item traced to a Project's `keywords` or Stories. No Project names, no dates: the PDF carries them. `cite_role_period` is a freelance setting and does not apply here.
- `gaps`: only when the posting asks how a missing requirement is covered. Never by default. Same fill as the Slot catalogue `gaps`, as one prose paragraph.
- `terms`: only when the posting asks (availability, notice, location, overlap). Same fill as the Slot catalogue `terms`; no salary figure unless the posting asks for one.
- `closing`: one line, always, the same rule as the proposal.
- `sign_off`: the Profile `voice.md` `sign_off`.

## Rule switches on this route

The voice catalogue applies as on the freelance route, with these switches (GEM-339, to be revisited after the merge):

1. The no-introduction rule is off: `intro` opens the Letter where the freelance route has the Hook Slot.
2. A role title (`frontend developer`) is allowed in `intro` only. `senior`, `lead`, `expert`, `experienced` stay banned everywhere.
3. `10+ years` is allowed as a fact in `intro`. `extensive experience` stays banned.
4. The contact ban stays: the application form and the PDF carry contact.
5. Length is this template's 500 characters. The 350-word prose cap, the 700-word total and the 4,500-character ceiling are freelance template numbers.
6. `gaps` renders when the posting asks, never by default.
7. `terms` renders when the posting asks.
8. No Project names or dates anywhere in the Letter.
9. Everything else applies as is: banned phrases, no `we`, no exclamation mark, no Markdown, no apology, rhythm, no arithmetic, every fact traceable.
