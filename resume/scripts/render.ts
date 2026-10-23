// Renders a Version to PDF: the selection is read by version.ts and assembled from the Project files
// through profile/lib, turned into HTML with resume.css, printed by headless Chrome, then checked.
// The input path is the first argument, relative to the repo root. The default, resume/versions/general.md,
// writes Konstantin_Dolbilov_Resume.pdf at the root; any other input writes a PDF of the same base name
// next to itself. The target PDF is replaced only when every check passes. Work files go to resume/scripts/out/.
// Run: node resume/scripts/render.ts [input]   (override the browser with CHROME=/path/to/chrome)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { readProfile, type Profile } from "../../profile/lib/index.ts";
import { readVersion, selection, contactLine, projectName, roleLine, period, isExperience, type Version } from "./version.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const out = path.join(here, "out");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const GENERAL = "resume/versions/general.md";
const PDF_NAME = "Konstantin_Dolbilov_Resume.pdf";
const MAX_BYTES = 2.5 * 1024 * 1024; // Greenhouse upload limit
const A4 = [595.28, 841.89]; // pt

// Wraps every hyphenated token in text nodes, never in tags or attributes, in a nowrap span, so a word
// such as DCEL-based never breaks at its hyphen and de-hyphenates in the text layer.
const nowrapHyphens = (html: string) => html.replace(/<[^>]*>|[^<]+/g, (m) => (m[0] === "<" ? m : m.replace(/\S+-\S+/g, '<span class="nb">$&</span>')));
const inline = (md: string) => marked.parseInline(md) as string;

interface Rendered { title: string; body: string; roles: [string, string][] }

// The resume: name, headline, contact line and summary; the Skills lines; one entry per selected Project,
// Professional Experience first and the independent Projects after, each with its selected Bullets.
export function toHtml(version: Version, profile: Profile): Rendered {
  const meta = profile.profile!;
  const html: string[] = [];
  const roles: [string, string][] = [];
  html.push(`<h1>${inline(meta.identity.name)}</h1>`, `<p class="headline">${inline(version.title)}</p>`, `<p class="contact">${inline(contactLine(meta.contact))}</p>`, `<p class="summary">${inline(version.summary)}</p>`);
  html.push("<h2>Skills</h2>", "<ul>", ...version.skills.map((l) => `<li>${inline(l)}</li>`), "</ul>");
  const picked = selection(version, profile);
  for (const [title, test] of [["Professional Experience", isExperience], ["Projects", (m: Parameters<typeof isExperience>[0]) => !isExperience(m)]] as const) {
    const entries = picked.filter(({ project }) => test(project.meta));
    if (!entries.length) continue;
    html.push(`<h2>${title}</h2>`);
    for (const { project, bullets } of entries) {
      const m = project.meta;
      html.push(`<h3>${inline(projectName(m))} <span class="desc">– ${inline(m.description)}</span></h3>`);
      const role = roleLine(m), dates = period(m);
      roles.push([role, dates]);
      html.push(`<p class="role"><span class="title">${inline(role)}</span> <span class="dates">${dates}</span></p>`);
      html.push("<ul>", ...bullets.map((b) => `<li>${inline(b.text)}</li>`), "</ul>");
    }
  }
  return { title: meta.identity.name, body: nowrapHyphens(html.join("\n")), roles };
}

const page = (title: string, body: string, css: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>${css}</style></head>
<body><main>
${body}
</main></body></html>`;

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8" });
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

const input = process.argv[2] ?? GENERAL;
const target = input === GENERAL ? PDF_NAME : input.replace(/\.[^./]*$/, "") + ".pdf";

mkdirSync(out, { recursive: true });
const profile = readProfile(path.join(root, "profile"));
const version = readVersion(path.join(root, input), profile);
const problems = [...profile.errors, ...version.errors];
if (problems.length) {
  console.log(`FAIL  source: ${problems.join("; ")}`);
  console.log(`${target} left unchanged; nothing rendered`);
  process.exit(1);
}
const { title, body, roles } = toHtml(version, profile);
const htmlPath = path.join(out, "resume.html");
const pdf = path.join(out, "resume.pdf");
writeFileSync(htmlPath, page(title, body, readFileSync(path.join(here, "resume.css"), "utf8")));
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, pathToFileURL(htmlPath).href], { stdio: "ignore" });

const checks: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

const info = run("pdfinfo", [pdf]);
const pages = Number(info.match(/Pages:\s+(\d+)/)![1]);
check("pages", pages === 1, `${pages}`);
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
const bullets = (plain.match(/•/g) ?? []).length;
const wanted = (body.match(/<li>/g) ?? []).length + (text(body.match(/<p class="contact">(.*?)<\/p>/)?.[1] ?? "").match(/•/g) ?? []).length;
check("bullets", bullets === wanted, `${bullets} of ${wanted}: one per list item plus the contact separators`);
const layout = run("pdftotext", ["-layout", "-enc", "UTF-8", pdf, "-"]).split("\n");
const split = roles.filter(([role, dates]) => !layout.some((line) => line.includes(decode(role.replace(/<[^>]+>/g, ""))) && line.includes(dates)));
check("role lines", !split.length, split.length ? `split from dates: ${split.map(([role]) => role).join(", ")}` : "each title on one line with its dates");
const broken = layout.filter((line) => /-\s*$/.test(line));
check("hyphens", !broken.length, broken.length ? `line ends with a hyphen: "${broken[0].trim()}"` : "no word broken at its hyphen");
const odd = roles.filter(([, dates]) => !DATES.test(dates));
check("dates", !odd.length, odd.length ? `off format: ${odd.map(([, dates]) => dates).join(", ")}` : "Mon YYYY – Mon YYYY or Present throughout");
const foreign = [...new Set(text(body).match(FOREIGN) ?? [])];
check("characters", !foreign.length, foreign.length
  ? `outside the whitelist: ${foreign.map((c) => `${c} U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(", ")}`
  : "letters, digits, punctuation, •, – and |");

run("pdftoppm", ["-png", "-r", "110", "-f", "1", "-l", "1", "-singlefile", pdf, path.join(out, "resume")]);

for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}: ${c.detail}`);
console.log("Screenshot: resume/scripts/out/resume.png");
if (checks.every((c) => c.ok)) {
  copyFileSync(pdf, path.join(root, target));
  console.log(`Wrote ${target}`);
} else {
  console.log(`${target} left unchanged; failed render at resume/scripts/out/resume.pdf`);
  process.exitCode = 1;
}
