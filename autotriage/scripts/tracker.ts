// The Tracker (catalogue/candidate-artifacts.md): a print derived from each Candidate's job.md
// frontmatter, plus `version` from cover-letter.md on the employment route, one table for both routes.
// Open Candidates first (decision not no-go, outcome not terminal), then closed, each by intake date
// descending. Folders under the Candidates root that are not a dated Candidate (the archive) are skipped. Never writes.
// CLI: node scripts/tracker.ts print
import fs from "node:fs";
import path from "node:path";
import { readArtifact, validate, listCandidates, letterFileFor, CANDIDATES_DIR } from "./lib.ts";

export const TERMINAL = ["hired", "rejected", "withdrawn"];
export interface Row { date: string; candidate: string; route: string; decision: string | null; family: string | null; version: string | null; outcome: string | null }

// One row per Candidate folder, plus the warnings the print adds under the table.
export function readRows(dir = CANDIDATES_DIR): { rows: Row[]; warnings: string[] } {
  const rows: Row[] = [], warnings: string[] = [];
  for (const candidate of listCandidates(dir)) {
    const folder = path.join(dir, candidate);
    const job = readArtifact(path.join(folder, "job.md"));
    if (!job || job.frontmatter === null) { warnings.push(`${candidate}: job.md is missing or has no frontmatter`); continue; }
    const fm = job.frontmatter as Record<string, any>;
    const errors = validate("job", fm);
    if (errors.length) warnings.push(`${candidate}: job.md is invalid: ${errors.join("; ")}`);
    const route = String(fm.route ?? "freelance");
    const letterFile = letterFileFor(route);
    const cover = route === "employment" ? readArtifact(path.join(folder, letterFile))?.frontmatter : null;
    rows.push({
      date: String(fm.date ?? candidate.slice(0, 10)),
      candidate,
      route,
      decision: fm.verdict?.decision ?? null,
      family: route === "freelance" ? fm.verdict?.family ?? null : null,
      version: route === "employment" ? (cover?.version as string | undefined) ?? null : null,
      outcome: fm.outcome ?? null,
    });
    if (fm.outcome === "sent" && !fs.existsSync(path.join(folder, letterFile))) warnings.push(`${candidate}: outcome is sent but ${letterFile} is not in the folder`);
  }
  return { rows, warnings };
}

export function isClosed(row: Row): boolean {
  return row.decision === "no-go" || TERMINAL.includes(row.outcome ?? "");
}

const byDateDesc = (a: Row, b: Row) => b.date.localeCompare(a.date) || b.candidate.localeCompare(a.candidate);

export function group(rows: Row[]): { open: Row[]; closed: Row[] } {
  return { open: rows.filter((r) => !isClosed(r)).sort(byDateDesc), closed: rows.filter(isClosed).sort(byDateDesc) };
}

const COLUMNS: (keyof Row)[] = ["date", "candidate", "route", "decision", "family", "version", "outcome"];

export function renderTable(rows: Row[]): string {
  const g = group(rows);
  const out: string[] = [];
  for (const [title, list] of [["Open", g.open], ["Closed", g.closed]] as const) {
    out.push(`${title} (${list.length})`, "", `| ${COLUMNS.join(" | ")} |`, `| ${COLUMNS.map(() => "---").join(" | ")} |`);
    for (const r of list) out.push(`| ${COLUMNS.map((c) => r[c] ?? "").join(" | ")} |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd] = process.argv.slice(2);
  if (cmd !== "print") { console.error("usage: tracker.ts print"); process.exit(2); }
  const { rows, warnings } = readRows();
  console.log(renderTable(rows));
  if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ${warnings.join("\n  ")}`);
}
