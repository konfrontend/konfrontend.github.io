// The proposal State's scripts: milestone prices and due dates derived from the person's answers, and the
// one write of `rate` into job.md. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { derive } from "./proposal.ts";
import { fixture, run, freelanceJob } from "./fixture.ts";

test("prices are hours times the rate; the total sums them", () => {
  const r = derive({ rate: 30, start: "2026-10-27", perDay: 6, hours: [10, 9, 3, 4] });
  assert.deepEqual(r.milestones.map((m) => m.price), [300, 270, 90, 120]);
  assert.equal(r.total, 780);
});

test("due dates follow the hours per day with no review gap: the next milestone starts where the last ended", () => {
  // Tue Oct 27, 6 hours a day: 10 hours end Wed, 19 end Fri (day 4), 22 end Fri, 26 end Mon
  const r = derive({ rate: 30, start: "2026-10-27", perDay: 6, hours: [10, 9, 3, 4] });
  assert.deepEqual(r.milestones.map((m) => m.due), ["2026-10-28", "2026-10-30", "2026-10-30", "2026-11-02"]);
});

test("a milestone that fills its last day exactly is due that day", () => {
  const r = derive({ rate: 40, start: "2026-10-26", perDay: 5, hours: [5, 10, 1] });
  assert.deepEqual(r.milestones.map((m) => m.due), ["2026-10-26", "2026-10-28", "2026-10-29"]);
});

test("no weekend due dates: Saturday and Sunday are skipped, a weekend start begins on Monday", () => {
  const fri = derive({ rate: 30, start: "2026-10-30", perDay: 4, hours: [6] });
  assert.equal(fri.milestones[0].due, "2026-11-02", "Friday plus two hours lands on Monday");
  const sat = derive({ rate: 30, start: "2026-10-31", perDay: 4, hours: [4] });
  assert.equal(sat.milestones[0].due, "2026-11-02");
});

test("derive refuses a non-positive rate, hours per day, or milestone hours, and a bad date", () => {
  assert.throws(() => derive({ rate: 0, start: "2026-10-27", perDay: 6, hours: [1] }), /rate/);
  assert.throws(() => derive({ rate: 30, start: "2026-10-27", perDay: 0, hours: [1] }), /hours per day/);
  assert.throws(() => derive({ rate: 30, start: "2026-10-27", perDay: 6, hours: [2, 0] }), /milestone 2/);
  assert.throws(() => derive({ rate: 30, start: "27 Oct", perDay: 6, hours: [1] }), /start/);
});

test("the milestones CLI prints one line per milestone and the total", () => {
  const { root } = fixture();
  const r = run(root, "proposal.ts", "milestones", "--rate", "30", "--start", "2026-10-27", "--per-day", "6", "--hours", "10,9");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "1. 10 hours, $300, due Wed Oct 28 (2026-10-28)\n2. 9 hours, $270, due Fri Oct 30 (2026-10-30)\ntotal: 19 hours, $570\n");
});

test("write-rate sets rate in job.md once, keeps the body, and refuses an invalid rate", () => {
  const C = "2026-10-26-acme-fix";
  const { root, candidate } = fixture({ candidates: { [C]: { "job.md": freelanceJob({ verdict: "go" }) } } });
  const ok = run(root, "proposal.ts", "write-rate", C, "--rate", "35");
  assert.equal(ok.status, 0, ok.stderr);
  const text = fs.readFileSync(`${candidate(C)}/job.md`, "utf8");
  assert.match(text, /\nrate: 35\n/);
  assert.match(text, /Posting text\.\n$/);
  const bad = run(root, "proposal.ts", "write-rate", C, "--rate", "-1");
  assert.match(bad.stdout, /proposal refused\. job\.md would be invalid/);
  assert.match(fs.readFileSync(`${candidate(C)}/job.md`, "utf8"), /\nrate: 35\n/, "nothing written on a refusal");
});
