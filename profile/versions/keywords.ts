// The Keyword lines of a Version. Under each Project heading, a {{keywords}} marker is overwritten with one
// line of backtick Keywords: the union over the groups of the Bullets picked under that Project, once each
// (case-insensitive, in the first spelling), the Keywords in the most groups first, ties in the order they
// first appear. The person then trims the line by hand. A Project that already has a Keyword line keeps it
// untouched; the Keywords it lacks are reported instead. A link resolve cannot fill picks nothing here.
// CLI: node profile/versions/keywords.ts <version.md>   (rewrites the file, prints the reports)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KEYWORD_LINE, readProject, type Bullet } from "../lib/index.ts";
import { BULLET_ITEM, MARKER, PROJECT_HEADING } from "./resolve.ts";

export interface Filled { text: string; reports: string[] }

interface Section { line: number; name: string; picked: Bullet[]; marker: number | null; keywordLine: number | null }

// Keywords of the picked Bullets' groups, each group counted once, most groups first.
function union(picked: Bullet[]): string[] {
  const groups = new Map<number, string[]>();
  for (const b of picked) groups.set(b.group, b.keywords);
  const counts = new Map<string, { term: string; n: number; first: number }>();
  for (const terms of groups.values()) for (const term of terms) {
    const k = term.toLowerCase();
    const c = counts.get(k);
    if (c) c.n++;
    else counts.set(k, { term, n: 1, first: counts.size });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.first - b.first).map((c) => c.term);
}

const line = (terms: string[]) => terms.map((t) => `\`${t}\``).join(", ");

export function fillKeywords(file: string): Filled {
  const dir = path.dirname(file);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const sections: Section[] = [];
  let current: (Section & { file: string | null; bullets: Bullet[] }) | null = null;
  lines.forEach((text, i) => {
    const h = PROJECT_HEADING.exec(text);
    if (h) {
      const abs = path.resolve(dir, decodeURI(h[3]));
      const project = fs.existsSync(abs) ? readProject(abs) : null;
      current = { line: i, name: h[2], picked: [], marker: null, keywordLine: null, file: project?.file ?? null, bullets: project?.bullets ?? [] };
      sections.push(current);
      return;
    }
    if (!current) return;
    const b = BULLET_ITEM.exec(text);
    if (b) {
      const into = b[2] ? path.resolve(dir, decodeURI(b[2])) : null;
      const bullet = into === current.file ? current.bullets.find((x) => x.anchor === b[3]) : undefined;
      if (bullet) current.picked.push(bullet);
    } else if (MARKER.test(text)) current.marker ??= i;
    else if (KEYWORD_LINE.test(text.trim())) current.keywordLine ??= i;
  });

  const reports: string[] = [];
  for (const s of sections) {
    const terms = union(s.picked);
    if (s.keywordLine !== null) {
      const has = new Set([...lines[s.keywordLine].matchAll(/`([^`]+)`/g)].map((m) => m[1].trim().toLowerCase()));
      const lacks = terms.filter((t) => !has.has(t.toLowerCase()));
      if (lacks.length) reports.push(`line ${s.line + 1} ${s.name}: the Keyword line lacks ${line(lacks)}`);
    } else if (s.marker !== null) lines[s.marker] = line(terms);
  }
  return { text: lines.join("\n"), reports };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) { console.error("usage: keywords.ts <version.md>"); process.exit(2); }
  const abs = path.resolve(file);
  const { text, reports } = fillKeywords(abs);
  fs.writeFileSync(abs, text);
  for (const r of reports) console.log(`${file}: ${r}`);
}
