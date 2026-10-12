# CV review

The brief for the reviewer subagent that `cv-scan` and `cv-port` dispatch before the user sees a candidate. The reviewer starts with a fresh context and has one job: hold every candidate against its source and the judgement rules of `docs/cv-guidelines.md`. `build/lint.mjs` covers the mechanical rules, so the reviewer leaves those to it. The reviewer reports and never edits.

## Input

- `docs/cv-guidelines.md` and `GLOSSARY.md`.
- The source. For a scan: the scratchpad evidence notes, the ownership notes and the user's clues. For a port: the pool and the picks.
- The candidates, worded exactly as the user will see them.

## Checks

Apply every check to every candidate.

- **Traceable.** Every phrase traces to the source. Quote each word the source lacks: a technology, a number, a product part, a before state.
- **Owned.** The candidate claims only the user's part, as the source states it.
- **Shipped.** It describes what shipped. A replaced thing appears only when the replaced work was not the user's. A migration, a rebuild or a duration appears only when the source states it.
- **Attached.** Each keyword names the thing it built, in the form "did A using B", and holds its rank in the guidelines' Tiers. A keyword riding on a detail it did not build is a finding: `three.js` on raycasting.
- **Full stack.** A stack bullet names every Platforms-tier technology of the project, TypeScript left out as implied. Quote each one missing.
- **Clue kept.** A bullet that carries a clue says what the user said. Quote a rewrite that changed its meaning.
- **Strongest.** The candidate frames the source from its strongest side. Quote any phrase that undersells it: a verb below the source's rung on the guidelines' Ownership ladder ("chose" for "decided"), a starting point that shrinks the work ("from a prototype"), a hedge the source does not need.
- **Opener.** A bullet names the result and what was used and stops. Quote any mechanism or algorithm name that belongs in the pool, any explanation clause, any clause that restates an outcome already stated.
- **Readable.** Every clause stands without the codebase: the field's own words, internal names left out, no detail an outside reader cannot place ("errors that name the bad argument", "year-long runs").
- **Judgeable.** A bullet carries at most one measurement, the strongest, and it is one a reader can judge: a rate with its baseline, users, team size. A second fact in the bullet appears without its numbers.
- **Ranked.** Bullets stand in the picks' Rank order, strongest first; a weaker pick merges as a tail onto a stronger bullet, never the reverse. A pick whose rank the bullets contradict is a finding.
- **Placed.** A keyword that appears once per project sits in the bullet it strengthens most or where it fills a gap. Lint catches the duplicate; the reviewer judges the place.
- **Plain.** No AI writing tells survive the humanizer: staged openers, forced triads, inflated claims.

## Report

One line per finding: the candidate, the check, the quoted phrase, the fix. A candidate with no finding gets one line saying "clean". Done when every candidate has a line.
