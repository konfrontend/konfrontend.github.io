// Fixtures for the Tracker print: one table, `candidate | route | verdict | outcome`, sorted by folder
// name descending, warning only on an invalid job.md, skipping folders that are not a dated Candidate. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeArtifact } from "./lib.ts";
import { readRows, renderTable } from "./tracker.ts";

const freelance = { title: "Full-Stack Developer - Clinic Booking MVP", route: "freelance", timezone: "America/New_York" };
const employment = { title: "Senior Frontend Developer", route: "employment", company: "Heymondo", employment: "full-time", timezone: "Europe/Madrid" };

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tracker-"));
  const put = (folder: string, job: object) => writeArtifact(path.join(dir, folder, "job.md"), job as Record<string, unknown>, "posting\n");
  put("2026-09-20-old-go-sent", { ...freelance, verdict: "go", requirements: [], flags: [], outcome: "sent" });
  put("2026-09-21-no-go", { ...freelance, verdict: "no-go", requirements: ["Steam"], flags: [] });
  put("2026-09-22-offer", { ...freelance, verdict: "go", requirements: [], flags: [], outcome: "offer" });
  put("2026-10-14-heymondo", { ...employment, verdict: "go", requirements: ["Vue 3"], outcome: "interview" });
  put("2026-10-15-invalid", { ...employment, verdict: "go", outcome: "hired" });
  put("2026-10-16-pending", { ...employment });
  put("archive/2026-09-01-archived", { ...freelance, verdict: "go", outcome: "sent" });
  return dir;
}

test("the print is one table by folder name descending and skips the archive", () => {
  const dir = fixture();
  try {
    const { rows } = readRows(dir);
    assert.deepEqual(rows.map((r) => r.candidate), ["2026-10-16-pending", "2026-10-15-invalid", "2026-10-14-heymondo", "2026-09-22-offer", "2026-09-21-no-go", "2026-09-20-old-go-sent"]);
    const table = renderTable(rows);
    assert.equal(table.split("\n")[0], "| candidate | route | verdict | outcome |");
    assert.match(table, /\n\| 2026-10-16-pending \| employment \|  \|  \|\n/);
    assert.match(table, /\n\| 2026-10-14-heymondo \| employment \| go \| interview \|\n/);
    assert.match(table, /\n\| 2026-09-21-no-go \| freelance \| no-go \|  \|\n/);
    assert.ok(!table.includes("archived"));
    assert.ok(!/Open|Closed|\| date|family|version/.test(table), "no groups, no date, family or version columns");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the print warns on an invalid job.md, and only then", () => {
  const dir = fixture();
  try {
    const { warnings } = readRows(dir);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^2026-10-15-invalid: job\.md is invalid: .*outcome/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
