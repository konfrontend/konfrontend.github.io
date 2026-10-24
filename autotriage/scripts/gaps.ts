// The Gap print: every Gap and every proved Skill a Job asked for, with how many Candidates asked.
// Reads the Candidates' `requirements` (one field of job.md, every dated folder, no-go included) and
// the Skills through profile/lib; nothing is stored. An invalid job.md is warned about and still counted.
// Where a Gap was seen is not printed; a search answers that.
// CLI: node scripts/gaps.ts print
import path from "node:path";
import { skills, profile, type Profile } from "./lib.ts";
import { candidatesDir, listCandidates, readJob } from "./candidate.ts";

export interface Requirement { candidate: string; requirements: string[] }
export interface Row { name: string; level: "shipped" | "gap"; seen: number }

export function readCandidateRequirements(candidatesRoot = candidatesDir()): { requirements: Requirement[]; warnings: string[] } {
  const requirements: Requirement[] = [];
  const warnings: string[] = [];
  for (const candidate of listCandidates(candidatesRoot)) {
    const job = readJob(path.join(candidatesRoot, candidate));
    if (!job || job.frontmatter === null) { warnings.push(`${candidate}: job.md is missing or has no frontmatter`); continue; }
    if (job.errors.length) warnings.push(`${candidate}: job.md is invalid: ${job.errors.join("; ")}`);
    const req = job.frontmatter.requirements;
    requirements.push({ candidate, requirements: Array.isArray(req) ? req.map(String) : [] });
  }
  return { requirements, warnings };
}

// Seen counts Candidates, not mentions; a requirement no Project proves is a Gap, spelled as first seen.
export function ledger(p: Profile, reqs: Requirement[]): Row[] {
  const rows: Row[] = skills(p).map((s) => ({ name: s.name, level: "shipped", seen: 0 }));
  const byKey = new Map(rows.map((r) => [r.name.toLowerCase(), r]));
  for (const { requirements } of reqs) {
    const once = new Set<string>();
    for (const term of requirements ?? []) {
      const k = String(term).trim().toLowerCase();
      if (!k || once.has(k)) continue;
      once.add(k);
      let row = byKey.get(k);
      if (!row) { row = { name: String(term).trim(), level: "gap", seen: 0 }; byKey.set(k, row); rows.push(row); }
      row.seen += 1;
    }
  }
  const order = (a: Row, b: Row) => (a.level === b.level ? 0 : a.level === "gap" ? -1 : 1) || b.seen - a.seen || a.name.localeCompare(b.name);
  return rows.sort(order);
}

const table = (rows: Row[]) => ["| skill | seen |", "| --- | --- |", ...rows.map((r) => `| ${r.name} | ${r.seen} |`)];

export function renderLedger(rows: Row[]): string {
  const gaps = rows.filter((r) => r.level === "gap");
  const asked = rows.filter((r) => r.level === "shipped" && r.seen > 0);
  return [`Gaps (${gaps.length}): required by a Candidate, proved by no Project.`, "", ...table(gaps), "", `Skills seen (${asked.length}): required by a Candidate, proved by a Project.`, "", ...table(asked)].join("\n") + "\n";
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (process.argv[2] !== "print") { console.error("usage: gaps.ts print"); process.exit(2); }
  const { requirements, warnings } = readCandidateRequirements();
  for (const w of warnings) console.error(`warning: ${w}`);
  process.stdout.write(renderLedger(ledger(profile(), requirements)));
}
