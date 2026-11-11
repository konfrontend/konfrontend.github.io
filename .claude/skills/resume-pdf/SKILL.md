---
name: resume-pdf
description: Print a Version to PDF beside it - resolve its slots and Bullet links from the Project files, then print the Markdown with resume.css.
argument-hint: "<version name, default frontend>"
disable-model-invocation: true
---

A Version is a resume the person writes by hand under `profile/versions/` (`GLOSSARY.md`). This skill prints one to a PDF beside it, named after it. It edits no Version.

1. Resolve. Run, with `<name>` the argument (default `frontend`) and `$ROOT` the repo root (`${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}`):

   ```bash
   node "$ROOT/profile/versions/resolve.ts" "$ROOT/profile/versions/<name>.md" > "$TMPDIR/<name>.md"
   ```

   Problems and warnings go to stderr, each with its line. On exit 1 a slot or Bullet link could not be filled: show the problems verbatim and stop; print nothing. A warning (a `{{keywords}}` marker still in the file) does not stop the print: relay it and say the `version-keywords` skill fills the marker.

2. Print:

   ```bash
   node "$ROOT/resume/scripts/print.ts" "$TMPDIR/<name>.md" "$ROOT/resume/scripts/resume.css" "$ROOT/profile/versions/<name>.pdf"
   ```

   Relay its one warning verbatim when the PDF is longer than one page. Length never fails the print, and nothing else is checked.

Argument received: $ARGUMENTS
