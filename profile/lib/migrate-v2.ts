// One-off migration of the Project files to v2: `## Stories` (empty), `## Bullets` (today's lead
// lines), `## Notes` (today's indented lines); the Themes and `domain` go. Run once, then deleted.
// CLI: node profile/lib/migrate-v2.ts [<projects dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "projects"));

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  const file = path.join(dir, name);
  const text = fs.readFileSync(file, "utf8");
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${name}: no frontmatter`);
  const frontmatter = m[1].split("\n").filter((l) => !/^domain:/.test(l)).join("\n");
  const bullets: string[] = [];
  const notes: string[] = [];
  for (const line of m[2].split("\n")) {
    if (/^- \[/.test(line)) bullets.push(line);
    else if (/^\s+\S/.test(line)) notes.push(`- ${line.trim()}`);
    else if (line.trim() && !/^\*\*[^*]+\*\*$/.test(line.trim())) throw new Error(`${name}: unexpected line: ${line}`);
  }
  const section = (title: string, lines: string[]) => (lines.length ? `## ${title}\n\n${lines.join("\n")}\n` : `## ${title}\n`);
  const body = [section("Stories", []), section("Bullets", bullets), section("Notes", notes)].join("\n");
  fs.writeFileSync(file, `---\n${frontmatter}\n---\n${body}`);
  console.log(`${name}: ${bullets.length} Bullets, ${notes.length} Notes`);
}
