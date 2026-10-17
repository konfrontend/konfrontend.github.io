---
name: cv-pdf
description: Render a version to PDF and check it fits one A4 page with a clean text layer. Takes the version's path as its argument; without one, renders versions/general.md to the public Konstantin_Dolbilov_Resume.pdf.
disable-model-invocation: true
---

A **render** turns one version into a PDF through `build/render.mjs`: Markdown to HTML with `build/cv.css`, printed by headless Chrome, then checked with Poppler. The script takes the input path as its first argument, relative to the repo root. The default, `versions/general.md`, writes `Konstantin_Dolbilov_Resume.pdf` at the repo root, the public CV. Any other input, such as a tailored version at `data/candidates/<folder>/version.md`, writes a PDF of the same base name next to itself and leaves the root PDF alone. The script replaces the target PDF only when every check passes. A render reads the version and never edits it.

The version's shape, beyond plain Markdown: frontmatter with `role` (`full-stack` or `frontend`, the ledger's role names); an entry `### <slug>` names the Project file `data/projects/<slug>.md` and takes its heading, description and role row from that file's frontmatter (`name`, `url`, `role`, `employment`, `start`, `end`, `description`) by the rules in `docs/format-rules.md`; the Bullets under it are the version's own. An entry written out (`### [Name](url)`, a description paragraph, a `Role | dates` row) renders as is. The Skills section is hand-grouped lines of `Label: term, term`; its terms are checked against the ledger `data/profile/skills.md`: each a Skill with the version's role, none of those missing. A Project file's `keywords` are checked to be ledger Skill names.

## Steps

1. **Prepare.** Run `npm --prefix build ci` when `build/node_modules` is missing. The script needs Google Chrome (override its path with `CHROME=`) and Poppler (`pdfinfo`, `pdffonts`, `pdfimages`, `pdftotext`, `pdftoppm`). Done when `marked` is installed and every tool resolves.
2. **Render.** Run `npm --prefix build run build -- <input>` with the path the user gave the skill (`$ARGUMENTS`), or `npm --prefix build run build` when they gave none. Done when the script prints one PASS or FAIL line per check, then the `Wrote` line naming the target PDF, and exits.
3. **Look.** Read `build/out/cv.png`, the rendered page, and show it to the user. Look for what the checks cannot see: a bullet wrapping onto a third line, a heading stranded at the page bottom, broken characters, a role row out of line. Done when the user has seen the page.
4. **Report.** Give the user the check lines verbatim and what you saw on the page. For each FAIL, name the cause and the fix from the table below. Done when every FAIL has a named fix and the user decides on it.

## Failures

| Check | Cause | Fix |
| --- | --- | --- |
| pages | The version is longer than one page. | Cut the oldest and least relevant bullets. The font size and margins in `cv.css` stay fixed. |
| fonts intended | Chrome substituted a missing font. | Install Georgia or Helvetica Neue on the build machine. |
| text layer, role lines | The PDF text differs from the version, or a role title lost its dates. | Check the version's markup, then `build/out/cv.html` in a browser. |
| reading order | The default pdftotext mode, like a parser, reads stacked role rows as a column of titles and a column of dates. | Keep one role row per project: give each further role its own entry. |
| first line | Something shares the name's line. | Read `git diff build/`. |
| bullets | A list lost its glyphs, or the version's text holds a stray `•` beyond the contact line. | Remove the stray `•` from the version, else read `git diff build/`. |
| hyphens | A spaced hyphen in the version wrapped at the line end. | Write it as an en dash, or rewrite the bullet. |
| dates | A role row's dates stray from `Mon YYYY – Mon YYYY` or `Mon YYYY – Present`. | Fix the role row in the version. |
| characters | The version holds a character outside the whitelist: an emoji, a curly quote, a symbol. | Replace it in the version; `docs/format-rules.md` names the allowed ones. |
| page size, title, images, file size | The stylesheet or the script changed. | Read `git diff build/`. |
| source | Nothing rendered: an entry's slug has no Project file, or the file lacks frontmatter or a meta field, or its `employment` is unknown; or the version has a Skills section and no `role`; or the ledger is missing. | Fix the named file: the Project file's frontmatter, or the version's `role`. |
| skills | A Skills term is not a ledger Skill, matches more than one row, or lacks the version's role; or a ledger Skill with the role is absent from the version. | Edit the version's Skills lines, or the ledger's `roles` for that Skill. |
| keywords | A Project file's `keywords` entry is not a ledger Skill name. | Use the ledger name in the Project file, or add the Skill to the ledger. |
