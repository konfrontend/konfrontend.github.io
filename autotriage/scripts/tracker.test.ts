// Fixtures for the Tracker print: `outcome` lives on job.md and is non-null only on decision go; the
// print splits open from closed, sorts each by intake date descending, warns on `sent` without a letter
// file, and skips folders that are not a dated Candidate. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validate, writeArtifact } from "./lib.ts";
import { readRows, group, renderTable } from "./tracker.ts";

const freelance = {
  slug: "clinic-booking-mvp", title: "Full-Stack Developer - Clinic Booking MVP", date: "2026-09-19", route: "freelance",
  timezone: "America/New_York", budget: { type: "hourly", min: 25, max: 100 },
};
const employment = {
  slug: "heymondo-senior-frontend", title: "Senior Frontend Developer", date: "2026-10-14", route: "employment",
  company: "Heymondo", employment: "full-time", remote: "remote", timezone: "Europe/Madrid",
};
const block = (decision: string | null, extra = {}) => ({ flags: [], skill_fit: 4, interest_fit: 3, value: 3, alert_level: 1, hard_stops: [], verdict: "go", decision, ...extra });
const fv = (decision: string | null) => block(decision, { family: "audit", family_runner_up: null });

test("outcome is on job.md on both routes, non-null only on decision go; the letter files lose it", () => {
  for (const [job, v] of [[freelance, fv], [employment, block]] as const) {
    assert.deepEqual(validate("job", job), [], "outcome is optional");
    assert.deepEqual(validate("job", { ...job, outcome: null }), [], "null before anything is sent");
    assert.deepEqual(validate("job", { ...job, verdict: v("go"), outcome: "interview" }), []);
    assert.ok(validate("job", { ...job, verdict: v("go"), outcome: "interviewed" }).length, "the enum is closed");
    assert.ok(validate("job", { ...job, verdict: v("no-go"), outcome: "sent" }).length, "no outcome on no-go");
    assert.ok(validate("job", { ...job, verdict: v(null), outcome: "sent" }).length, "no outcome before the decision");
    assert.ok(validate("job", { ...job, outcome: "sent" }).length, "no outcome without a verdict");
    assert.deepEqual(validate("job", { ...job, verdict: v("no-go"), outcome: null }), []);
  }
  assert.ok(validate("letter", { slug: "clinic-booking-mvp", family: "audit", date: "2026-09-19", outcome: null }).length);
  assert.ok(validate("cover-letter", { slug: "heymondo-senior-frontend", date: "2026-10-14", version: "general", outcome: null }).length);
});

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-"));
  const put = (folder: string, job: object, files: Record<string, object> = {}) => {
    writeArtifact(path.join(dir, folder, "job.md"), job as Record<string, unknown>, "posting\n");
    for (const [name, fm] of Object.entries(files)) writeArtifact(path.join(dir, folder, name), fm as Record<string, unknown>, "text\n");
  };
  const letter = { slug: "x", family: "audit", date: "2026-09-20" };
  put("2026-09-20-old-go-sent", { ...freelance, date: "2026-09-20", verdict: fv("go"), outcome: "sent" }, { "letter.md": letter });
  put("2026-09-21-no-go", { ...freelance, date: "2026-09-21", verdict: fv("no-go") });
  put("2026-09-22-hired", { ...freelance, date: "2026-09-22", verdict: fv("go"), outcome: "hired" }, { "letter.md": letter });
  put("2026-09-23-sent-no-letter", { ...freelance, date: "2026-09-23", verdict: fv("go"), outcome: "sent" });
  put("2026-10-14-heymondo", { ...employment, verdict: block("go"), outcome: "replied" }, { "cover-letter.md": { slug: "heymondo-senior-frontend", date: "2026-10-14", version: "tailored" } });
  put("2026-10-15-employment-rejected", { ...employment, date: "2026-10-15", verdict: block("go"), outcome: "rejected" }, { "cover-letter.md": { slug: "x", date: "2026-10-15", version: "general" } });
  put("2026-10-16-pending", { ...employment, date: "2026-10-16" });
  put("archive/2026-09-01-archived", { ...freelance, date: "2026-09-01", verdict: fv("go"), outcome: "sent" });
  return dir;
}

test("the print splits open from closed, each by intake date descending, and skips the archive", () => {
  const dir = fixture();
  try {
    const { rows } = readRows(dir);
    const g = group(rows);
    assert.deepEqual(g.open.map((r) => r.candidate), ["2026-10-16-pending", "2026-10-14-heymondo", "2026-09-23-sent-no-letter", "2026-09-20-old-go-sent"]);
    assert.deepEqual(g.closed.map((r) => r.candidate), ["2026-10-15-employment-rejected", "2026-09-22-hired", "2026-09-21-no-go"]);
    const heymondo = rows.find((r) => r.candidate === "2026-10-14-heymondo")!;
    assert.equal(heymondo.family, null, "family is empty on employment rows");
    assert.equal(heymondo.version, "tailored");
    assert.equal(rows.find((r) => r.candidate === "2026-09-22-hired")!.version, null, "version is empty on freelance rows");
    const table = renderTable(rows);
    assert.match(table, /^Open \(4\)/);
    assert.match(table, /\nClosed \(3\)\n/);
    assert.match(table, /\| 2026-10-14 \| 2026-10-14-heymondo \| employment \| go \|  \| tailored \| replied \|/);
    assert.match(table, /\| 2026-09-22 \| 2026-09-22-hired \| freelance \| go \| audit \|  \| hired \|/);
    assert.ok(!table.includes("archived"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the print warns on outcome sent with no letter file, and only then", () => {
  const dir = fixture();
  try {
    const { warnings } = readRows(dir);
    assert.deepEqual(warnings, ["2026-09-23-sent-no-letter: outcome is sent but letter.md is not in the folder"]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
