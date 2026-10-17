# Issue tracker: Linear

Issues and specs for this repo live in Linear. Workspace `gembag` (https://linear.app/gembag), team `GEM` (Gembag), project "Professional Profile". Use the connected Linear MCP tools for all operations; there is no CLI.

## Conventions

- **Create an issue**: team `GEM`, project "Professional Profile", issue template `What-Why-Done`. Fill the template shape: observable gap, impact, optional notes and out-of-scope list, then checkbox acceptance criteria.
- **Read an issue**: fetch the issue by identifier (`GEM-123`) with its comments and labels.
- **List issues**: filter by team `GEM`, project "Professional Profile", state and label.
- **Comment**: add a comment on the issue.
- **Apply / remove labels**: edit the issue's labels; create a missing label on team `GEM` first.
- **Close**: move the issue to a completed state and leave a closing comment.

## When a skill says "publish to the issue tracker"

Create a Linear issue as above.

## When a skill says "fetch the relevant ticket"

Fetch the `GEM-<n>` issue with comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one issue; tickets are its **sub-issues**.

- **Map**: an issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a sub-issue of the map, labelled `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, assigned to the driving dev.
- **Blocking**: Linear's native "blocked by" relation. A ticket is unblocked when every blocker is completed.
- **Frontier query**: open sub-issues of the map, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: assign the ticket to yourself, the session's first write.
- **Resolve**: comment the answer, complete the issue, then append a context pointer to the map's Decisions-so-far.
