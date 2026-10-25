// Renders a Version to PDF: the Markdown is read by position, the [slug] and [key] prefixes dropped, the
// rest styled with resume.css, printed by headless Chrome, then checked. The Profile is read for the
// checks only, never to assemble the page. The input path is the first argument, relative to the repo
// root, which follows CLAUDE_PROJECT_DIR. A Candidate folder renders the Version it is sent with into the
// folder under the sent name; no input, or resume/versions/general.md, writes Konstantin_Dolbilov_Resume.pdf
// at the root; any other Version writes a PDF of the same base name next to itself. The render is staged in
// a fresh temporary directory and copied to the target only when no check fails; with --check nothing is
// written outside that directory.
// Run: node resume/scripts/render.ts [input] [--check]   (override the browser with CHROME=/path/to/chrome)
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, statSync, existsSync } from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked, type Tokens } from "marked";
import { readProfile, repoRoot } from "../../profile/lib/index.ts";
import { readVersion, checkVersion, stripKey, type Result } from "./version.ts";
import { candidateFiles, readJob } from "../../autotriage/scripts/candidate.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const GENERAL = "resume/versions/general.md";
const PDF_NAME = "Konstantin_Dolbilov_Resume.pdf";
const MAX_BYTES = 2.5 * 1024 * 1024; // Greenhouse upload limit
const A4 = [595.28, 841.89]; // pt
const MAX_BULLET_LINES = 2; // bullet-rules.md rule 1

// Wraps every hyphenated token in text nodes, never in tags or attributes, in a nowrap span, so a word
// such as DCEL-based never breaks at its hyphen and de-hyphenates in the text layer.
const nowrapHyphens = (html: string) => html.replace(/<[^>]*>|[^<]+/g, (m) => (m[0] === "<" ? m : m.replace(/\S+-\S+/g, '<span class="nb">$&</span>')));
const inline = (md: string) => marked.parseInline(md) as string;

export interface Rendered { title: string; body: string; roles: [string, string][]; bullets: string[] }

// Fixed shape, read by position: h1 name; then three paragraphs (title, contact line, summary); then h2 sections.
// Under an h3 entry heading, the first paragraph is the role row `Role | Dates`.
export function toHtml(md: string): Rendered {
  const html: string[] = [];
  const roles: [string, string][] = [];
  const bullets: string[] = [];
  let title = "", para = 0, entry = false, section = "";
  for (const t of marked.lexer(md)) {
    if (t.type === "heading") {
      const h = t as Tokens.Heading;
      if (h.depth === 1) html.push(`<h1>${inline((title = h.text))}</h1>`);
      else if (h.depth === 2) { html.push(`<h2>${inline(h.text)}</h2>`); section = h.text; }
      else {
        const [name, ...desc] = stripKey(h.text).split(" – ");
        html.push(`<h3>${inline(name)} <span class="desc">– ${inline(desc.join(" – "))}</span></h3>`);
        entry = true;
      }
    } else if (t.type === "paragraph") {
      const text = (t as Tokens.Paragraph).text;
      if (entry) {
        const [role, dates] = text.split(" | ");
        roles.push([role, dates ?? ""]);
        html.push(`<p class="role"><span class="title">${inline(role)}</span> <span class="dates">${dates ?? ""}</span></p>`);
        entry = false;
      } else html.push(`<p class="${["headline", "contact", "summary"][para++] ?? "summary"}">${inline(text)}</p>`);
    } else if (t.type === "list") {
      const items = (t as Tokens.List).items.map((i) => stripKey(i.text));
      if (section !== "Skills") bullets.push(...items);
      html.push("<ul>", ...items.map((i) => `<li>${inline(i)}</li>`), "</ul>");
    }
  }
  return { title, body: nowrapHyphens(html.join("\n")), roles, bullets };
}

const page = (title: string, body: string, css: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>${css}</style></head>
<body><main>
${body}
</main></body></html>`;

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8" });

// A fresh temporary directory a render or a cut is staged in.
export const stage = () => mkdtempSync(path.join(os.tmpdir(), "resume-"));

// Prints the Markdown to <dir>/resume.pdf (and .html) and returns the page count. generate.ts cuts by it.
export function pages(md: string, dir: string): number {
  const { title, body } = toHtml(md);
  const htmlPath = path.join(dir, "resume.html"), pdf = path.join(dir, "resume.pdf");
  writeFileSync(htmlPath, page(title, body, readFileSync(path.join(here, "resume.css"), "utf8")));
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, pathToFileURL(htmlPath).href], { stdio: "ignore" });
  return Number(run("pdfinfo", [pdf]).match(/Pages:\s+(\d+)/)![1]);
}

const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e as "amp"]!);
// Tag-free, entity-decoded text of an HTML fragment.
const text = (html: string) => decode(html.replace(/<[^>]+>/g, ""));
// Text compared without whitespace or case: line breaks and text-transform differ by design.
const flat = (s: string) => s.replace(/\s/g, "").toLowerCase();
const DATES = /^[A-Z][a-z]{2} \d{4} – ([A-Z][a-z]{2} \d{4}|Present)$/;
// The format-rules whitelist: letters, digits, ASCII punctuation, •, – and |.
const FOREIGN = /[^\x20-\x7E\s\p{L}\p{N}•–]/gu;

function firstDiff(expected: string, actual: string): string | null {
  let i = 0;
  while (i < expected.length && expected[i] === actual[i]) i++;
  return i === expected.length && i === actual.length ? null
    : `at char ${i}: expected "…${expected.slice(Math.max(0, i - 20), i + 20)}…", got "…${actual.slice(Math.max(0, i - 20), i + 20)}…"`;
}

// How many lines each Bullet took on the page, read from the layout text: from its glyph line until the
// accumulated text holds the whole Bullet. A Bullet the layout does not hold counts as 0; the text layer
// check reports it.
export function bulletLines(layout: string[], bullets: string[]): number[] {
  const lines = layout.map(flat);
  return bullets.map((b) => {
    const want = flat(text(inline(b)));
    const start = lines.findIndex((l) => l.startsWith("•") && want.startsWith(l.slice(1)) && l.length > 1);
    if (start < 0) return 0;
    let acc = "";
    for (let i = start; i < lines.length; i++) {
      acc += i === start ? lines[i].slice(1) : lines[i];
      if (acc.length >= want.length) return want === acc.slice(0, want.length) ? i - start + 1 : 0;
    }
    return 0;
  });
}

const camel = (s: string) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The Version an input renders and the PDF it writes, both relative to the root. A Candidate folder renders
// its tailored Version, else the general one, to Dolbilov_<Role>_<Company>_<MonYYYY>.pdf inside the folder.
export function resolveRender(input: string | undefined, root: string, date: Date): { version: string; target: string } {
  const rel = (p: string) => path.relative(root, p);
  const file = path.resolve(root, input ?? GENERAL);
  if (rel(file) === GENERAL) return { version: GENERAL, target: PDF_NAME };
  if (!existsSync(file) || !statSync(file).isDirectory()) return { version: rel(file), target: rel(file).replace(/\.[^./]*$/, "") + ".pdf" };
  const job = readJob(file)?.frontmatter;
  if (!job?.company) throw new Error(`${rel(file)} has no company in job.md; only an employment Candidate is sent a PDF`);
  const tailored = candidateFiles(file).version;
  return {
    version: existsSync(tailored) ? rel(tailored) : GENERAL,
    target: rel(path.join(file, `Dolbilov_${camel(job.title)}_${camel(job.company)}_${MONTHS[date.getMonth()]}${date.getFullYear()}.pdf`)),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const input = args.find((a) => !a.startsWith("--"));
  const root = repoRoot();
  let resolved: ReturnType<typeof resolveRender>;
  try { resolved = resolveRender(input, root, new Date()); } catch (e) { console.log(`FAIL  source: ${(e as Error).message}`); process.exit(1); }
  const { target } = resolved;
  const file = path.resolve(root, resolved.version);

  const profile = readProfile();
  const version = readVersion(file, profile);
  const problems = [...profile.errors, ...version.errors];
  if (problems.length) {
    console.log(`FAIL  source: ${problems.join("; ")}`);
    console.log(`${target} left unchanged; nothing rendered`);
    process.exit(1);
  }
  const md = readFileSync(file, "utf8");
  const { title, body, roles, bullets } = toHtml(md);
  const dir = stage();
  const n = pages(md, dir);
  const pdf = path.join(dir, "resume.pdf");

  const checks: Result[] = [];
  const check = (name: string, ok: boolean, detail: string, level: "FAIL" | "WARN" = "FAIL") => checks.push({ level: ok ? "PASS" : level, name, detail });

  const info = run("pdfinfo", [pdf]);
  check("pages", n === 1, `${n}`);
  const [w, h] = info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts/)!.slice(1).map(Number);
  check("page size", Math.abs(w - A4[0]) < 2 && Math.abs(h - A4[1]) < 2, `${w} x ${h} pt`);
  const pdfTitle = info.match(/Title:\s+(.*)/)?.[1].trim() ?? "";
  check("title", pdfTitle === title, `"${pdfTitle}"`);
  const bytes = statSync(pdf).size;
  check("file size", bytes < MAX_BYTES, `${(bytes / 1024).toFixed(0)} KB`);

  const images = run("pdfimages", ["-list", pdf]).trim().split("\n").slice(2).length;
  check("images", images === 0, `${images}`);

  // pdffonts rows: name, type (may be two words), encoding, then emb sub uni object gen.
  const fonts = run("pdffonts", [pdf]).trim().split("\n").slice(2).map((row) => {
    const cols = row.trim().split(/\s+/);
    const [emb, , uni] = cols.slice(-5);
    return { name: cols[0].replace(/^[A-Z]{6}\+/, ""), emb: emb === "yes", uni: uni === "yes" };
  });
  const names = [...new Set(fonts.map((f) => f.name))].join(", ");
  const stray = fonts.filter((f) => !/^(Georgia|HelveticaNeue|Helvetica|Arial)/.test(f.name));
  check("fonts embedded", fonts.every((f) => f.emb && f.uni), names);
  check("fonts intended", fonts.some((f) => f.name.startsWith("Georgia")) && fonts.some((f) => !f.name.startsWith("Georgia")) && !stray.length,
    stray.length ? `substituted: ${stray.map((f) => f.name).join(", ")}` : "Georgia and the heading sans");

  // -raw reads the content stream, which Chrome writes in DOM order. The default mode orders by geometry, as a parser
  // does, and groups stacked right-aligned dates into a column of their own; -layout confirms that each role title
  // shares a line with its dates. The list bullets are ::before content, so the body gets one per item.
  const expected = flat(decode(body.replace(/<li>/g, "<li>• ").replace(/<[^>]+>/g, " ")));
  const diff = firstDiff(expected, flat(run("pdftotext", ["-raw", "-enc", "UTF-8", pdf, "-"])));
  check("text layer", diff === null, diff ?? "every word in reading order, no header or footer");
  const plain = run("pdftotext", ["-enc", "UTF-8", pdf, "-"]);
  const order = firstDiff(expected, flat(plain));
  check("reading order", order === null, order ?? "the default pdftotext mode reads the same text");
  const h1 = text(body.match(/<h1>(.*?)<\/h1>/)![1]);
  const firstLine = plain.split("\n")[0];
  check("first line", firstLine === h1, `"${firstLine}"`);
  const glyphs = (plain.match(/•/g) ?? []).length;
  const wanted = (body.match(/<li>/g) ?? []).length + (text(body.match(/<p class="contact">(.*?)<\/p>/)?.[1] ?? "").match(/•/g) ?? []).length;
  check("bullets", glyphs === wanted, `${glyphs} of ${wanted}: one per list item plus the contact separators`);
  const layout = run("pdftotext", ["-layout", "-enc", "UTF-8", pdf, "-"]).split("\n");
  const split = roles.filter(([role, dates]) => !layout.some((line) => line.includes(text(inline(role))) && line.includes(dates)));
  check("role lines", !split.length, split.length ? `split from dates: ${split.map(([role]) => role).join(", ")}` : "each title on one line with its dates");
  const broken = layout.filter((line) => /-\s*$/.test(line));
  check("hyphens", !broken.length, broken.length ? `line ends with a hyphen: "${broken[0].trim()}"` : "no word broken at its hyphen");
  const odd = roles.filter(([, dates]) => !DATES.test(dates));
  check("dates", !odd.length, odd.length ? `off format: ${odd.map(([, dates]) => dates).join(", ")}` : "Mon YYYY – Mon YYYY or Present throughout");
  const foreign = [...new Set(text(body).match(FOREIGN) ?? [])];
  check("characters", !foreign.length, foreign.length
    ? `outside the whitelist: ${foreign.map((c) => `${c} U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`
    : "letters, digits, punctuation, •, – and |");
  const long = bulletLines(layout, bullets).map((lines, i) => [lines, version.bullets[i]?.key ?? `#${i + 1}`] as const).filter(([lines]) => lines > MAX_BULLET_LINES);
  check("bullet length", !long.length, long.length ? `over ${MAX_BULLET_LINES} lines: ${long.map(([lines, key]) => `${key} (${lines})`).join(", ")}` : `every Bullet within ${MAX_BULLET_LINES} rendered lines`, "WARN");

  checks.push(...checkVersion(version, md, profile));

  run("pdftoppm", ["-png", "-r", "110", "-f", "1", "-l", "1", "-singlefile", pdf, path.join(dir, "resume")]);

  for (const c of checks) console.log(`${c.level}  ${c.name}: ${c.detail}`);
  console.log(`Rendered ${resolved.version} in ${dir}`);
  console.log(`Screenshot: ${path.join(dir, "resume.png")}`);
  const failed = checks.some((c) => c.level === "FAIL");
  if (checkOnly) console.log(failed ? `${target} not written: a check failed` : `${target} not written (--check); the render is at ${pdf}`);
  else if (!failed) {
    copyFileSync(pdf, path.join(root, target));
    console.log(`Wrote ${target}`);
  } else console.log(`${target} left unchanged; failed render at ${pdf}`);
  if (failed) process.exitCode = 1;
}
