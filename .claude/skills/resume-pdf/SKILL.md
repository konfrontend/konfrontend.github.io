---
name: resume-pdf
description: Print a Version to PDF beside it - ask which Keywords each Project keeps, resolve the slots, Bullet links and Keyword markers from the Project files, then print the Markdown with resume.css.
argument-hint: "<version name, default frontend>"
disable-model-invocation: true
---

A Version is a resume the person writes by hand under `profile/versions/` (`GLOSSARY.md`). This skill prints one to a PDF beside it, named after it. It never edits the Version: a `{{keywords}}` marker stays in the file and is filled for this print only.

`<name>` is the argument (default `frontend`); `$ROOT` is `${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}`.

1. Offer the Keywords. Run:

   ```bash
   node "$ROOT/profile/versions/keywords.ts" "$ROOT/profile/versions/<name>.md"
   ```

   Each line is `line <n> <Project>: <ranked Keywords>`, one per marker, most repeated first; any line after them is a report (a hand-written Keyword line that lacks Keywords, or a marker with nothing to offer). Show the output verbatim. Then ask, in one message, which Keywords to drop under each Project; "all" keeps a Project's whole line. Nothing is stored: every print asks again.

2. Write the person's answer to `$TMPDIR/<name>.kept.json`, one entry per offered marker: its line number as the key, the Keywords kept, in the offered order and spelling, as the value (`{"22": ["TypeScript", "Vue 3"]}`). An empty list prints no Keyword line under that Project.

3. Resolve:

   ```bash
   node "$ROOT/profile/versions/resolve.ts" "$ROOT/profile/versions/<name>.md" --keywords "$TMPDIR/<name>.kept.json" > "$TMPDIR/<name>.md"
   ```

   Problems and warnings go to stderr, each with its line. On exit 1 a slot or Bullet link could not be filled: show the problems verbatim and stop; print nothing. Relay a warning verbatim; it does not stop the print.

4. Print:

   ```bash
   node "$ROOT/resume/scripts/print.ts" "$TMPDIR/<name>.md" "$ROOT/resume/scripts/resume.css" "$ROOT/profile/versions/<name>.pdf"
   ```

   Relay its one warning verbatim when the PDF is longer than one page. Length never fails the print, and nothing else is checked.

Argument received: $ARGUMENTS
