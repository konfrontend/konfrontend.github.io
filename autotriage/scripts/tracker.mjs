// The Tracker (catalogue/candidate-artifacts.md, GEM-341): a print derived from each Candidate's job.md
// frontmatter, plus `version` from cover-cover-letter.md on the employment route, one table for both routes. Open Candidates first (decision not no-go, outcome not
// terminal), then closed, each by intake date descending. Folders under data/candidates/ that are not
// a dated Candidate (the archive) are skipped. Never writes.
// CLI: node scripts/tracker.mjs print
import fs from "node:fs";
import path from "node:path";
import { readArtifact, validate, listCandidates, CANDIDATES_DIR } from "./lib.mjs";

export const TERMINAL = ["hired", "rejected", "withdrawn"];
const LETTER_FILE = { freelance: "letter.md", employment: "cover-letter.md" };

// One row per Candidate folder, plus the warnings the print adds under the table.
export function readRows(dir = CANDIDATES_DIR) {
  const rows = [], warnings = [];
  for (const candidate of listCandidates(dir)) {
    const folder = path.join(dir, candidate);
    const job = readArtifact(path.join(folder, "job.md"));
    if (!job || job.frontmatter === null) { warnings.push(`${candidate}: job.md is missing or has no frontmatter`); continue; }
    const fm = job.frontmatter;
    const errors = validate("job", fm);
    if (errors.length) warnings.push(`${candidate}: job.md is invalid: ${errors.join("; ")}`);
    const route = fm.route ?? "freelance";
    const letterFile = LETTER_FILE[route] ?? LETTER_FILE.freelance;
    const cover = route === "employment" ? readArtifact(path.join(folder, letterFile))?.frontmatter : null;
    rows.push({
      date: fm.date ?? candidate.slice(0, 10),
      candidate,
      route,
      decision: fm.verdict?.decision ?? null,
      family: route === "freelance" ? fm.verdict?.family ?? null : null,
      version: route === "employment" ? cover?.version ?? null : null,
      outcome: fm.outcome ?? null,
    });
    if (fm.outcome === "sent" && !fs.existsSync(path.join(folder, letterFile))) warnings.push(`${candidate}: outcome is sent but ${letterFile} is not in the folder`);
  }
  return { rows, warnings };
}

export function isClosed(row) {
  return row.decision === "no-go" || TERMINAL.includes(row.outcome);
}

const byDateDesc = (a, b) => b.date.localeCompare(a.date) || b.candidate.localeCompare(a.candidate);

export function group(rows) {
  return { open: rows.filter((r) => !isClosed(r)).sort(byDateDesc), closed: rows.filter(isClosed).sort(byDateDesc) };
}

const COLUMNS = ["date", "candidate", "route", "decision", "family", "version", "outcome"];

export function renderTable(rows) {
  const g = group(rows);
  const out = [];
  for (const [title, list] of [["Open", g.open], ["Closed", g.closed]]) {
    out.push(`${title} (${list.length})`, "", `| ${COLUMNS.join(" | ")} |`, `| ${COLUMNS.map(() => "---").join(" | ")} |`);
    for (const r of list) out.push(`| ${COLUMNS.map((c) => r[c] ?? "").join(" | ")} |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd] = process.argv.slice(2);
  try {
    if (cmd === "print") {
      const { rows, warnings } = readRows();
      console.log(renderTable(rows));
      if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ${warnings.join("\n  ")}`);
    } else {
      console.error("usage: tracker.mjs print");
      process.exit(2);
    }
  } catch (e) {
    console.error(`autotriage: tracker.mjs failed: ${e.message}`); process.exit(1);
  }
}
