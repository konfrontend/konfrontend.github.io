---
name: cv-pdf
description: Render draft.md to CV_Konstantin_Dolbilov.pdf and check it fits one A4 page with a clean text layer.
disable-model-invocation: true
---

A **render** turns `draft.md` into `CV_Konstantin_Dolbilov.pdf` at the repo root through `build/render.mjs`: Markdown to HTML with `build/cv.css`, printed by headless Chrome, then checked with Poppler. The script replaces the root PDF only when every check passes. A render reads the draft and never edits it.

## Steps

1. **Prepare.** Run `npm --prefix build ci` when `build/node_modules` is missing. The script needs Google Chrome (override its path with `CHROME=`) and Poppler (`pdfinfo`, `pdffonts`, `pdfimages`, `pdftotext`, `pdftoppm`). Done when `marked` is installed and every tool resolves.
2. **Render.** Run `npm --prefix build run build`. Done when the script prints one PASS or FAIL line per check and exits.
3. **Look.** Read `build/out/cv.png`, the rendered page, and show it to the user. Look for what the checks cannot see: a bullet wrapping onto a third line, a heading stranded at the page bottom, broken characters, a role row out of line. Done when the user has seen the page.
4. **Report.** Give the user the check lines verbatim and what you saw on the page. For each FAIL, name the cause and the fix from the table below. Done when every FAIL has a named fix and the user decides on it.

## Failures

| Check | Cause | Fix |
| --- | --- | --- |
| lint | The draft or a pool breaks a mechanical rule of the guidelines; each `file:line` is named. | A pool line goes back through `cv-scan`, a bullet through `cv-port`, a header line to the user. |
| pages | The draft is longer than one page. | Cut the oldest and least relevant bullets in a port, per the guidelines' Draft structure. The font size and margins in `cv.css` stay fixed. |
| role rows | A role row's dates break the `Mon YYYY – Mon YYYY` or `– Present` form. | Copy the role line from the project's pool. |
| fonts intended | Chrome substituted a missing font. | Install Georgia or Helvetica Neue on the build machine. |
| text layer, role lines | The PDF text differs from the draft, or a role title lost its dates. | Check the draft's markup against the guidelines' Draft structure, then `build/out/cv.html` in a browser. |
| page size, title, images, file size | The stylesheet or the script changed. | Read `git diff build/`. |
