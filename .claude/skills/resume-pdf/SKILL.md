---
name: resume-pdf
description: Render a Version to PDF and check it fits one A4 page with a clean text layer. Takes the Version's path as its argument; without one, renders resume/versions/general.md to the public Konstantin_Dolbilov_Resume.pdf.
disable-model-invocation: true
---

A **render** turns one Version into a PDF through `resume/scripts/render.ts`: the selection is read through `profile/lib` and assembled from the Project files, turned into HTML with `resume/scripts/resume.css`, printed by headless Chrome, then checked with Poppler. The script takes the input path as its first argument, relative to the repo root. The default, `resume/versions/general.md`, writes `Konstantin_Dolbilov_Resume.pdf` at the repo root, the public resume. Any other input, such as a tailored Version at `private/candidates/<folder>/version.md`, writes a PDF of the same base name next to itself and leaves the root PDF alone. The script replaces the target PDF only when every check passes. A render reads the Version and never edits it.

A Version is a selection over the Profile, frontmatter only (`profile/schemas/version.schema.json`): `title` (the headline under the name), `summary` (the paragraph after the contact line), `skills` (the hand-grouped Skills lines, `Label: term, term`, every term a canonical Skill, which is a keyword some Project file names), and `projects`, a map from Project slug to the Story keys it shows, in the order the Profile's `resume_order` gives. The renderer takes the name and contact line from `profile/profile.md`, each entry's heading, description and role row from the Project file's frontmatter by the rules in `docs/format-rules.md`, and each Bullet from the Story's lead line. A Project whose `employment` is `independent` renders under Projects, every other one under Professional Experience.

## Steps

1. **Prepare.** Run `npm install` at the repo root when `node_modules` is missing. The script needs Node 24, Google Chrome (override its path with `CHROME=`) and Poppler (`pdfinfo`, `pdffonts`, `pdfimages`, `pdftotext`, `pdftoppm`). Done when every tool resolves.
2. **Render.** Run `node resume/scripts/render.ts <input>` with the path the user gave the skill (`$ARGUMENTS`), or `node resume/scripts/render.ts` when they gave none. Done when the script prints one PASS or FAIL line per check, then the `Wrote` line naming the target PDF, and exits.
3. **Look.** Read `resume/scripts/out/resume.png`, the rendered page, and show it to the user. Look for what the checks cannot see: a bullet wrapping onto a third line, a heading stranded at the page bottom, broken characters, a role row out of line. Done when the user has seen the page.
4. **Report.** Give the user the check lines verbatim and what you saw on the page. For each FAIL, name the cause and the fix from the table below. Done when every FAIL has a named fix and the user decides on it.

## Failures

| Check | Cause | Fix |
| --- | --- | --- |
| source | The Profile or the Version does not read: a Profile error, a Story key no Project has, a Skills term that is no Project keyword, a slug with no Project file. | Fix the named file: the Project file, the Version's `projects` or `skills`, or `profile/profile.md`. |
| pages | The Version selects more than one page holds. | Drop the oldest and least relevant Story keys from `projects`. The font size and margins in `resume.css` stay fixed. |
| fonts intended | Chrome substituted a missing font. | Install Georgia or Helvetica Neue on the build machine. |
| text layer, role lines | The PDF text differs from the assembled resume, or a role title lost its dates. | Check `resume/scripts/out/resume.html` in a browser, then `git diff resume/scripts/`. |
| reading order | The default pdftotext mode, like a parser, reads stacked role rows as a column of titles and a column of dates. | Read `git diff resume/scripts/`; each entry renders one role row. |
| first line | Something shares the name's line. | Read `git diff resume/scripts/`. |
| bullets | A list lost its glyphs, or a Story lead line holds a stray `•`. | Remove the stray `•` from the Story, else read `git diff resume/scripts/`. |
| hyphens | A spaced hyphen in a Story or the summary wrapped at the line end. | Write it as an en dash, or reword the line. |
| dates | A Project's `start` or `end` is not `YYYY-MM`. | Fix the Project file's frontmatter. |
| characters | A Story, the summary or a Skills line holds a character outside the whitelist: an emoji, a curly quote, a symbol. | Replace it in the file; `docs/format-rules.md` names the allowed ones. |
| page size, title, images, file size | The stylesheet or the script changed. | Read `git diff resume/scripts/`. |
