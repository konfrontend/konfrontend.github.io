---
name: cv-pdf
description: Render a version to PDF and check it fits one A4 page with a clean text layer. Takes the version's path as its argument; without one, renders versions/general.md to the public CV_Konstantin_Dolbilov.pdf.
disable-model-invocation: true
---

A **render** turns one version into a PDF through `build/render.mjs`: Markdown to HTML with `build/cv.css`, printed by headless Chrome, then checked with Poppler. The script takes the input path as its first argument, relative to the repo root. The default, `versions/general.md`, writes `CV_Konstantin_Dolbilov.pdf` at the repo root, the public CV. Any other input, such as a tailored version under `applications/<company>-<role>/`, writes a PDF of the same base name next to itself and leaves the root PDF alone. The script replaces the target PDF only when every check passes. A render reads the version and never edits it.

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
| page size, title, images, file size | The stylesheet or the script changed. | Read `git diff build/`. |
