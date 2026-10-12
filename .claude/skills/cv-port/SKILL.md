---
name: cv-port
description: Port hand-picked highlights from one project's pool into compact bullets under that project in draft.md.
disable-model-invocation: true
---

A **port** rewrites highlights the user picks from one pool, `projects/<project>/highlights-pool.md`, into bullets under that project in `draft.md`. One project per port. The port writes only that project's entry in the draft; the header, the summary and every other project stay as they are.

Read `docs/cv-guidelines.md` and `GLOSSARY.md` first. Every bullet, keyword, rank and the draft shape follow the guidelines; this skill holds only the port procedure. Facts come from the pool alone: every phrase of a bullet is traceable to a pick's text. A fact the user states in chat is a clue: write it into the pick's highlight in the pool before it reaches a bullet.

## Input

- One project name.
- The picks, in chat: highlights named by theme and position ("Shade simulation 1"), or pasted text.

## Budget

The guidelines' Draft structure sets the bullets per section and the page total, and their Bullets rules set the bullet length; `build/lint.mjs` reads the numbers from there. This project's budget is the page total minus the bullets the other projects hold, within its section's range. Over budget, the user cuts: fewer picks here, or a later port of another project. The font and the margins stay fixed.

## Steps

1. **Orient.** Read the pool and the draft. When the pool breaks the guidelines' Pool structure, stop and point the user at `cv-scan`, whose Orient round fixes it. Find the project's entry in the draft, if it has one, and work out the budget. Check each existing bullet against the pool: a claim the pool lacks is dropped, or reaches the pool through `cv-scan` first. When highlights in the pool lack a rank mark, propose one per highlight, theme by theme, with one line of reason by the guidelines' Rank criteria; write the confirmed marks to the pool before picking. Done when every highlight carries a rank and the user has seen the budget and, one by one, each existing bullet of the entry with its verdict: keep as is, rewrite from picks, or drop.
2. **Pick.** Echo every pick the user named by position back as the full highlight text under its theme, so a wrong position shows before any writing. Picks the user takes from a suggestion that already quoted them need no echo. Order the picks by rank and re-check each rank against the others picked; a change goes to the pool once the user confirms it. Over budget, the lowest rank is cut or merged first. Done when the user confirms the ranked list, and kept bullets plus picks fit the section's range and the budget.
3. **Draft bullets.** Rewrite the picks into bullets by the guidelines' Bullets and Keywords rules. One bullet may merge several highlights, the weaker as a tail on the stronger; one highlight feeds one bullet. Bullets stand in rank order. A clue the user states now goes into the pick's highlight in the pool first. Read the pool's Skills line, highest tier first: a keyword surfaces once per entry, inside the bullet where it names the thing that bullet's picks built, in the form "did A using B". When the description's parts are not in rank order, propose the reordered description for the pool header. Run the humanizer skill on every bullet. Lint the entry before anyone sees it: write a copy of the draft with the entry in place to the scratchpad and run `node build/lint.mjs --draft <copy>`. Then send the bullets, the pool and the picks to a reviewer subagent briefed by `docs/cv-review.md`, and fix each finding; a finding you dispute goes to the user in step 4. Done when every pick sits in a bullet or in a one-line "left out, because" note, every bullet is within the guidelines' length or the user has accepted it up to the hard cap, the scratch lint shows no failure in the entry, and the reviewer has a line for every bullet.
4. **Review.** Show the whole entry in chat exactly as it will be written: `###` heading, description and role rows copied from the pool's header, then the bullets. Under it, per bullet, the picks it carries with their ranks and its character count, then the "left out" notes and any word inferred rather than quoted. The user approves, edits or drops. When the user corrects the heading, description or a role row, change the pool's header first; the entry copies it. Rework until the user approves the entry.
5. **Write.** Replace the project's entry in `draft.md` with the approved one. A new entry goes under `## Professional Experience`, or under `## Projects` when the work had no employer or client, in its place by recency within that section, the latest end date first and `Present` before any date. Run `npm --prefix build run lint`. Done when the draft holds the approved entry, the rest of the file is unchanged, and the lint shows no failure in the entry. Tell the user `cv-pdf` checks the page.
