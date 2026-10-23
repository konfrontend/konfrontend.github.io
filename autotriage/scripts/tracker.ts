// The Tracker (catalogue/candidate-artifacts.md): a print derived from each Candidate's job.md
// frontmatter, one table for both routes, sorted by folder name descending. Folders under the
// Candidates root that are not a dated Candidate (the archive) are skipped. Never writes.
// CLI: node scripts/tracker.ts print
import path from "node:path";
import { readArtifact, validateArtifact, listCandidates, CANDIDATES_DIR } from "./lib.ts";

export interface Row { candidate: string; route: string; verdict: string | null; outcome: string | null }

// One row per Candidate folder, plus the warnings the print adds under the table.
export function readRows(dir = CANDIDATES_DIR): { rows: Row[]; warnings: string[] } {
  const rows: Row[] = [], warnings: string[] = [];
  for (const candidate of listCandidates(dir)) {
    const job = readArtifact(path.join(dir, candidate, "job.md"));
    if (!job || job.frontmatter === null) { warnings.push(`${candidate}: job.md is missing or has no frontmatter`); continue; }
    const errors = validateArtifact("job", job);
    if (errors.length) warnings.push(`${candidate}: job.md is invalid: ${errors.join("; ")}`);
    const fm = job.frontmatter as Record<string, any>;
    rows.push({ candidate, route: String(fm.route ?? ""), verdict: fm.verdict ?? null, outcome: fm.outcome ?? null });
  }
  rows.sort((a, b) => b.candidate.localeCompare(a.candidate));
  return { rows, warnings };
}

const COLUMNS: (keyof Row)[] = ["candidate", "route", "verdict", "outcome"];

export function renderTable(rows: Row[]): string {
  const out = [`| ${COLUMNS.join(" | ")} |`, `| ${COLUMNS.map(() => "---").join(" | ")} |`];
  for (const r of rows) out.push(`| ${COLUMNS.map((c) => r[c] ?? "").join(" | ")} |`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd] = process.argv.slice(2);
  if (cmd !== "print") { console.error("usage: tracker.ts print"); process.exit(2); }
  const { rows, warnings } = readRows();
  console.log(renderTable(rows));
  if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ${warnings.join("\n  ")}`);
}
