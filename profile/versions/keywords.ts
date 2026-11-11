// The Keywords a Version's {{keywords}} markers are offered. Under each Project heading, a marker is offered
// the union over the groups of the Bullets picked under that Project, once each (case-insensitive, in the
// first spelling), the Keywords in the most groups first, ties in the order they first appear. The person
// picks from that list at print time; nothing here writes the Version. A Project with a hand-written Keyword
// line prints it as written; the Keywords it lacks are reported. A link resolve cannot fill picks nothing
// here; a marker whose Project picks no Bullet is offered nothing and reported.
// CLI: node profile/versions/keywords.ts <version.md>   (one line per marker: its line, the Project, the ranked
// Keywords; then the reports)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KEYWORD_LINE, readProject, type Bullet } from "../lib/index.ts";
import { BULLET_ITEM, MARKER, PROJECT_HEADING } from "./resolve.ts";

export interface Offer { line: number; project: string; keywords: string[] }
export interface Ranked { markers: Offer[]; reports: string[] }

interface Section { line: number; name: string; picked: Bullet[]; marker: number | null; keywordLine: number | null }

// Keywords of the picked Bullets' groups, each group counted once, most groups first.
function ranked(picked: Bullet[]): string[] {
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

const backticks = (terms: string[]) => terms.map((t) => `\`${t}\``).join(", ");

export function rankKeywords(file: string): Ranked {
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

  const markers: Offer[] = [];
  const reports: string[] = [];
  for (const s of sections) {
    const terms = ranked(s.picked);
    if (s.keywordLine !== null) {
      const has = new Set([...lines[s.keywordLine].matchAll(/`([^`]+)`/g)].map((m) => m[1].trim().toLowerCase()));
      const lacks = terms.filter((t) => !has.has(t.toLowerCase()));
      if (lacks.length) reports.push(`line ${s.line + 1} ${s.name}: the Keyword line lacks ${backticks(lacks)}`);
    } else if (s.marker !== null) {
      if (terms.length) markers.push({ line: s.marker + 1, project: s.name, keywords: terms });
      else reports.push(`line ${s.line + 1} ${s.name}: no Bullet picked, nothing to offer for the marker on line ${s.marker + 1}`);
    }
  }
  return { markers, reports };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) { console.error("usage: keywords.ts <version.md>"); process.exit(2); }
  const { markers, reports } = rankKeywords(path.resolve(file));
  for (const m of markers) console.log(`line ${m.line} ${m.project}: ${backticks(m.keywords)}`);
  for (const r of reports) console.log(`${file}: ${r}`);
}
