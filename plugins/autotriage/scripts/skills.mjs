// The Skill ledger (catalogue/skills.md, GEM-337): data/profile/skills.md, a summary with one row per
// Skill. Targets and Evidence are derived here, never stored: Evidence from the Projects' `keywords`.
// `triage` records what a Job required through `record`, which increments `seen` and writes the
// Candidate's `recorded_skills` marker into its job.md so a re-run is a no-op; the skills skill prints
// through `print`.
// CLI: node scripts/skills.mjs print [gaps]
//      node scripts/skills.mjs match <item>...
//      node scripts/skills.mjs record <candidate> [--seen <name>]... [--gap <name>:<category>]...
import fs from "node:fs";
import path from "node:path";
import { YAML } from "./vendor/deps.mjs";
import { readLedger, readProjects, deriveEvidence, readArtifact, writeArtifact, validate, candidateDir, LEDGER_FILE } from "./lib.mjs";

export const LEVELS = ["gap", "learning", "used", "shipped"];

export function isTarget(row, targetAfter) {
  return row.level === "gap" && (row.seen ?? 0) >= targetAfter;
}

const bySeen = (a, b) => (b.seen ?? 0) - (a.seen ?? 0);

export function group(ledger) {
  const targets = [], gaps = [], rest = [];
  for (const r of ledger.skills) {
    if (isTarget(r, ledger.target_after)) targets.push(r);
    else if (r.level === "gap") gaps.push(r);
    else rest.push(r);
  }
  return { targets: targets.sort(bySeen), gaps: gaps.sort(bySeen), rest: rest.sort(bySeen) };
}

// Rows whose Level claims a Project (`shipped`) but no Project's keywords name them: a Guard warning.
export function shippedWithoutEvidence(ledger, evidence) {
  return ledger.skills.filter((r) => r.level === "shipped" && !(evidence.get(r.name) ?? []).length).map((r) => r.name);
}

export function renderTable(ledger, { gapsOnly = false, evidence = new Map() } = {}) {
  const g = group(ledger);
  const sections = [["Targets", g.targets], ["Gaps", g.gaps]];
  if (!gapsOnly) sections.push(["Rest", g.rest]);
  const out = [];
  for (const [title, rows] of sections) {
    out.push(`${title} (${rows.length})`, "", "| name | level | category | evidence | seen |", "| --- | --- | --- | --- | --- |");
    for (const r of rows) out.push(`| ${r.name} | ${r.level} | ${r.category} | ${(evidence.get(r.name) ?? []).join(", ")} | ${r.seen ?? 0} |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function termRe(term) {
  const a = /^\w/.test(term) ? "\\b" : "", z = /\w$/.test(term) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(term)}${z}`, "i");
}

// Rows a Job item matches: by name or by keyword, whole words, any number of rows per item.
export function match(ledger, item) {
  const text = String(item);
  return ledger.skills.filter((r) => [r.name, ...(r.keywords ?? [])].some((t) => termRe(t).test(text)));
}

function rowNamed(ledger, name) {
  const row = ledger.skills.find((r) => r.name.toLowerCase() === String(name).toLowerCase());
  if (!row) throw new Error(`no row named "${name}" in the ledger`);
  return row;
}

// Increment `seen` on each named row and add a gap row per unknown item. `recorded` is the Candidate's
// marker (job.md `recorded_skills`): a row already in it is left alone, so a re-run is a no-op. Returns
// the changes and the marker to write back.
export function record(ledger, recorded, { seen = [], gaps = [] }) {
  const changes = { incremented: [], added: [], unchanged: [] };
  const marker = [...(recorded ?? [])];
  const done = (name) => marker.some((m) => m.toLowerCase() === name.toLowerCase());
  const bump = (row) => {
    if (done(row.name)) { changes.unchanged.push(row.name); return; }
    row.seen = (row.seen ?? 0) + 1;
    marker.push(row.name);
    changes.incremented.push(row.name);
  };
  for (const name of seen) bump(rowNamed(ledger, name));
  for (const { name, category } of gaps) {
    const existing = ledger.skills.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (existing) { bump(existing); continue; }
    if (!(category in (ledger.categories ?? {}))) throw new Error(`category "${category}" is not a key of the ledger's categories (${Object.keys(ledger.categories ?? {}).join(", ")})`);
    ledger.skills.push({ name, category, level: "gap", keywords: [], roles: [], seen: 1 });
    marker.push(name);
    changes.added.push(name);
  }
  return { changes, recorded: marker };
}

function loadOrFail() {
  const ledger = readLedger();
  if (!ledger) throw new Error(`no ledger at data/profile/skills.md. Run /autotriage:setup.`);
  if (ledger.errors.length) throw new Error(`data/profile/skills.md is invalid:\n  ${ledger.errors.join("\n  ")}`);
  return ledger;
}

// One flow-style row per line, so a hand edit and a diff stay readable at tens of rows.
export function serialize(fm) {
  const { skills, ...rest } = fm;
  const head = YAML.stringify(rest, { lineWidth: 0 }).trimEnd();
  const rows = skills.map((r) => "  - " + YAML.stringify(r, { flow: true, lineWidth: 0 }).trim());
  return `${head}\nskills:\n${rows.join("\n")}`;
}

function save(ledger) {
  const errors = validate("skills", ledger.frontmatter);
  if (errors.length) throw new Error(`refusing to write an invalid ledger:\n  ${errors.join("\n  ")}`);
  fs.writeFileSync(LEDGER_FILE, `---\n${serialize(ledger.frontmatter)}\n---\n${ledger.body ?? ""}`);
}

function flagValues(args, flag) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === flag && args[i + 1] !== undefined) out.push(args[++i]);
  return out;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === "print") {
      const ledger = loadOrFail().frontmatter;
      const { evidence, unknown } = deriveEvidence(ledger, readProjects());
      console.log(renderTable(ledger, { gapsOnly: args[0] === "gaps", evidence }));
      const missing = shippedWithoutEvidence(ledger, evidence);
      if (missing.length) console.log(`\nshipped with no Project in Evidence (${missing.length}): ${missing.join(", ")}`);
      if (unknown.length) console.log(`\nkeywords the ledger lacks (${unknown.length}): ${unknown.map((u) => `${u.slug}: ${u.term}`).join("; ")}`);
    } else if (cmd === "match") {
      const ledger = loadOrFail().frontmatter;
      for (const item of args) console.log(`${item}: ${match(ledger, item).map((r) => r.name).join(", ") || "(no row)"}`);
    } else if (cmd === "record") {
      const candidate = args[0];
      const dir = candidateDir(candidate);
      if (!dir) throw new Error("usage: skills.mjs record <candidate> [--seen <name>]... [--gap <name>:<category>]...");
      const job = readArtifact(path.join(dir, "job.md"));
      if (!job || job.frontmatter === null) throw new Error(`data/candidates/${candidate}/job.md is missing or has no frontmatter`);
      const gaps = flagValues(args, "--gap").map((g) => {
        const m = /^(.+):([a-z0-9-]+)$/.exec(g);
        if (!m) throw new Error(`--gap wants <name>:<category>, got "${g}"`);
        return { name: m[1], category: m[2] };
      });
      const ledger = loadOrFail();
      const { changes, recorded } = record(ledger.frontmatter, job.frontmatter.recorded_skills, { seen: flagValues(args, "--seen"), gaps });
      if (changes.incremented.length || changes.added.length) {
        job.frontmatter.recorded_skills = recorded;
        const errors = validate("job", job.frontmatter);
        if (errors.length) throw new Error(`refusing to write an invalid job.md:\n  ${errors.join("\n  ")}`);
        save(ledger);
        writeArtifact(job.file, job.frontmatter, job.body);
      }
      console.log(JSON.stringify(changes));
    } else {
      console.error("usage: skills.mjs print [gaps] | match <item>... | record <candidate> [--seen <name>]... [--gap <name>:<category>]...");
      process.exit(2);
    }
  } catch (e) {
    console.error(`autotriage: skills.mjs failed: ${e.message}`); process.exit(1);
  }
}
