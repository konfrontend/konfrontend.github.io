// Print: a Markdown file and a stylesheet to a PDF, through headless Chrome. The Markdown is rendered as
// written (GFM, a line break kept as a break), the first h1 is the document title, and every hyphenated
// word is kept whole on one line. One warning goes to stderr when the PDF is longer than one page; nothing
// else is checked and length never fails the print. Knows nothing of the Profile.
// CLI: node resume/scripts/print.ts <file.md> <stylesheet.css> [out.pdf]   (out defaults to the .md path with .pdf)
// Override the browser with CHROME=/path/to/chrome.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { marked } from "marked";

export const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Wraps every hyphenated token in text nodes, never in tags or attributes, in a .nb span, so a word such
// as DCEL-based never breaks at its hyphen.
const nowrapHyphens = (html: string) => html.replace(/<[^>]*>|[^<]+/g, (m) => (m[0] === "<" ? m : m.replace(/\S+-\S+/g, '<span class="nb">$&</span>')));
const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function toHtml(md: string, css: string): string {
  const title = /^#\s+(.+)$/m.exec(md)?.[1].trim() ?? "";
  const body = marked.parse(md, { gfm: true, breaks: true, async: false });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title>
<style>${css}</style></head>
<body><main>
${nowrapHyphens(body)}
</main></body></html>`;
}

// The page count Chrome writes in the root page tree.
export function pageCount(pdf: Buffer): number {
  const counts = [...pdf.toString("latin1").matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages\b/g)].map((m) => Number(m[1] ?? m[2]));
  return Math.max(0, ...counts);
}

export function print(input: string, stylesheet: string, out: string): number {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "print-"));
  const html = path.join(dir, "page.html");
  fs.writeFileSync(html, toHtml(fs.readFileSync(input, "utf8"), fs.readFileSync(stylesheet, "utf8")));
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${path.resolve(out)}`, pathToFileURL(html).href], { stdio: "ignore" });
  return pageCount(fs.readFileSync(out));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, stylesheet, out = input?.replace(/\.[^./]*$/, "") + ".pdf"] = process.argv.slice(2);
  if (!input || !stylesheet) { console.error("usage: print.ts <file.md> <stylesheet.css> [out.pdf]"); process.exit(2); }
  const pages = print(input, stylesheet, out);
  console.log(`Wrote ${out}`);
  if (pages > 1) console.error(`warning: ${out} is ${pages} pages, longer than one page`);
}
