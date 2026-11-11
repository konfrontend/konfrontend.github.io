---
name: version-keywords
description: Fill the Keyword lines of a Version - overwrite each {{keywords}} marker with the Keywords of the Bullets picked under that Project, most repeated first.
argument-hint: "<version name, default frontend>"
disable-model-invocation: true
---

A Version (`profile/versions/<name>.md`, `GLOSSARY.md`) has a `{{keywords}}` marker under a Project heading where that Project's Keyword line goes. The marker is never printed; resolve warns while one is left.

Run, with `<name>` the argument (default `frontend`):

```bash
node "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/profile/versions/keywords.ts" "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/profile/versions/<name>.md"
```

The script overwrites each marker in the file with one line of backtick Keywords: the union over the groups of the Bullets picked under that Project, without duplicates, the Keywords in the most groups first. A Project that already has a Keyword line keeps it untouched; the script prints the Keywords that line lacks. Show its output verbatim, then tell the person the new lines are theirs to trim by hand. Edit nothing yourself.

Argument received: $ARGUMENTS
