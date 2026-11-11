---
name: resume-pdf
description: Print a Version to PDF beside it - resolve its slots, Bullet links and Keyword markers from the Project files, then print the Markdown with resume.css.
argument-hint: "<version name, default frontend>"
disable-model-invocation: true
---

A Version is a resume the person writes by hand under `profile/versions/` (`GLOSSARY.md`). This skill prints one to a PDF beside it, named after it. It never edits the Version and asks nothing: a `{{keywords}}` marker prints every Keyword of the groups of the Bullets picked under that Project, most repeated first. A Keyword line the person writes in place of the marker prints as written.

`<name>` is the argument (default `frontend`); `$ROOT` is `${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}`.

1. Resolve:

   ```bash
   node "$ROOT/profile/versions/resolve.ts" "$ROOT/profile/versions/<name>.md" > "$TMPDIR/<name>.md"
   ```

   Problems and warnings go to stderr, each with its line. On exit 1 a slot or Bullet link could not be filled: show the problems verbatim and stop; print nothing. Relay a warning verbatim; it does not stop the print.

2. Print:

   ```bash
   node "$ROOT/resume/scripts/print.ts" "$TMPDIR/<name>.md" "$ROOT/resume/scripts/resume.css" "$ROOT/profile/versions/<name>.pdf"
   ```

   Relay its one warning verbatim when the PDF is longer than one page. Length never fails the print, and nothing else is checked.

Argument received: $ARGUMENTS
