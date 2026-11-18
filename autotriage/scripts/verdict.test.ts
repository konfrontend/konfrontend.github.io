// The Verdict arithmetic from arguments, counting only the Flags of the Job's route.
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { compute } from "./verdict.ts";
import { fixture, run } from "./fixture.ts";

test("verdict arithmetic from arguments: no money hard stop on either route", () => {
  for (const route of ["freelance", "employment"]) {
    assert.deepEqual(compute({ route, flags: [], skill_fit: 4 }), { alert_level: 1, hard_stops: [], verdict: "go" }, `${route}: a posted rate is a Checkpoint line, not a stop`);
  }
  assert.equal(compute({ route: "employment", flags: ["unmet-constraint"], skill_fit: 4 }).verdict, "no-go", "the stop Flag stops on both routes");
  assert.deepEqual(compute({ route: "freelance", flags: ["unmet-constraint"], skill_fit: 4 }), { alert_level: 1, hard_stops: ["unmet-constraint"], verdict: "no-go" });
  assert.equal(compute({ route: "freelance", flags: [], skill_fit: 2 }).verdict, "ask");
  assert.equal(compute({ route: "freelance", flags: ["no-such-flag"], skill_fit: 4 }).verdict, "go", "an unknown id counts for nothing");
});

test("the verdict CLI takes its inputs as arguments", () => {
  const { root } = fixture();
  const r = run(root, "verdict.ts", "--route", "freelance", "--skill-fit", "4", "--flags", "regulated-domain,paid-first-milestone");
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { alert_level: 1, hard_stops: [], verdict: "go" }, "no money stop");
  const ok = run(root, "verdict.ts", "--route", "employment", "--skill-fit", "3", "--flags", "role-sprawl,codebase-handover,unpaid-assignment");
  assert.deepEqual(JSON.parse(ok.stdout), { alert_level: 4, hard_stops: [], verdict: "ask" });
  assert.equal(run(root, "verdict.ts", "--route", "freelance").status, 2, "skill-fit is required");
});

test("verdict arithmetic counts only the Flags of the Job's route", () => {
  // hostile-tone is freelance only: on employment it adds no level and no compound step
  assert.equal(compute({ route: "employment", flags: ["hostile-tone"], skill_fit: 4 }).alert_level, 1);
  assert.equal(compute({ route: "freelance", flags: ["hostile-tone"], skill_fit: 4 }).alert_level, 4);
  // codebase-handover is employment only
  assert.equal(compute({ route: "employment", flags: ["codebase-handover"], skill_fit: 4 }).alert_level, 2);
  assert.equal(compute({ route: "freelance", flags: ["codebase-handover"], skill_fit: 4 }).alert_level, 1);
  // employment green Flag lowers, level 5 Flag stops
  assert.equal(compute({ route: "employment", flags: ["unpaid-assignment", "practices-stated"], skill_fit: 4 }).alert_level, 2);
  assert.deepEqual(compute({ route: "employment", flags: ["recruitment-scam"], skill_fit: 4 }).hard_stops, ["alert-level-5", "level-5-flag"]);
});
