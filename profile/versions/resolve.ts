// Resolve: a Version, written by hand, turned into plain Markdown from the Project files. A heading that
// opens with a link to a Project file prints its link text and makes that Project the one the slots and
// Bullet links below it read, down to the next such heading. {{url}}, {{role}}, {{employment}}, {{start}}
// and {{end}} print the Project's frontmatter values, {{Description}} its Description; a list item that is
// only a link to a Bullet's anchor prints that Bullet's claim. A {{keywords}} marker prints nothing and is
// a warning. A slot or link that cannot be filled is a problem; both are named with their line. Everything
// else prints as written and nothing else is checked.
// CLI: node profile/versions/resolve.ts <version.md>   (Markdown on stdout, problems and warnings on stderr,
// exit 1 on a problem)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { META_KEYS, readProject, type Project } from "../lib/index.ts";

export interface Resolved { markdown: string; problems: string[]; warnings: string[] }

// A link target with a scheme (https:, mailto:) is another site; only a relative path reads a Project file.
export const PROJECT_HEADING = /^(#{1,6}\s+)\[([^\]]*)\]\(([^)#\s:]+\.md)\)(.*)$/;
export const BULLET_ITEM = /^(\s*[*+-]\s+)\[[^\]]*\]\(([^)#\s:]+)#([^)\s]+)\)\s*$/;
const SLOT = /\{\{\s*([^}]*?)\s*\}\}/g;
export const MARKER = /^\s*\{\{\s*keywords\s*\}\}\s*$/;

export function resolveVersion(file: string): Resolved {
  const dir = path.dirname(file);
  const problems: string[] = [];
  const warnings: string[] = [];
  const projects = new Map<string, Project | null>();
  const project = (target: string): Project | null => {
    const abs = path.resolve(dir, decodeURI(target));
    if (!projects.has(abs)) projects.set(abs, fs.existsSync(abs) ? readProject(abs) : null);
    return projects.get(abs)!;
  };
  let current: { target: string; project: Project | null } | null = null;
  const out: string[] = [];
  const lines = fs.readFileSync(file, "utf8").split("\n");

  const fill = (text: string, n: number) => text.replace(SLOT, (slot, name: string) => {
    const p = current?.project;
    const value = !p ? undefined
      : name === "Description" ? p.description || undefined
      : (META_KEYS as readonly string[]).includes(name) ? p.meta[name as (typeof META_KEYS)[number]]
      : undefined;
    if (value === undefined) {
      problems.push(`line ${n}: ${slot} ${!current ? "is under no Project heading" : !p ? `reads ${current.target}, which does not exist` : "has no value in the Project file"}`);
      return slot;
    }
    return value;
  });

  lines.forEach((line, i) => {
    const n = i + 1;
    if (MARKER.test(line)) { warnings.push(`line ${n}: {{keywords}} marker still in the file`); return; }
    const h = PROJECT_HEADING.exec(line);
    if (h) {
      current = { target: h[3], project: project(h[3]) };
      if (!current.project) problems.push(`line ${n}: Project heading links ${h[3]}, which does not exist`);
      out.push(fill(`${h[1]}${h[2]}${h[4]}`, n));
      return;
    }
    const b = BULLET_ITEM.exec(line);
    if (b) {
      const [, lead, target, anchor] = b;
      const into = target ? path.resolve(dir, decodeURI(target)) : null;
      const bullet = current?.project && into === current.project.file ? current.project.bullets.find((x) => x.anchor === anchor) : undefined;
      if (!bullet) {
        problems.push(`line ${n}: Bullet link ${target}#${anchor} ${!current ? "is under no Project heading"
          : into !== path.resolve(dir, decodeURI(current.target)) ? `points outside ${current.target}`
          : !current.project ? `reads ${current.target}, which does not exist` : "names no Bullet of that Project"}`);
        out.push(line);
        return;
      }
      const indent = " ".repeat(lead.length);
      out.push(lead + bullet.text.split("\n").map((l, j) => (j && l ? indent + l : l)).join("\n"));
      return;
    }
    out.push(fill(line, n));
  });
  return { markdown: out.join("\n"), problems, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) { console.error("usage: resolve.ts <version.md>"); process.exit(2); }
  const { markdown, problems, warnings } = resolveVersion(path.resolve(file));
  process.stdout.write(markdown);
  for (const p of problems) console.error(`${file}: ${p}`);
  for (const w of warnings) console.error(`${file}: warning: ${w}`);
  if (problems.length) process.exitCode = 1;
}
