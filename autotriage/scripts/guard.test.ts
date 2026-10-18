// The Guard as a transition table: the Profile gate reads the Profile through @konfrontend/profile, a
// refusal is printed on stdout with exit 0 so the model always sees it, the PreToolUse hook turns the
// same Refusal into a deny, and the write hook validates every Profile, Candidate and Version file.
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, run, hook, project, VOICE, PROFILE, employmentJob, freelanceJob, cover } from "./fixture.ts";

test("the route gate passes on a valid Profile and status reports every file valid", () => {
  const { root } = fixture();
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "Profile gate passed.");
  const st = run(root, "profile.ts", "status");
  assert.match(st.stdout, /1 Projects, 1 Stories, 0 Answers, every file valid/);
  assert.match(st.stdout, /triage gate .*: pass\nproposal gate .*: pass/);
});

test("a refusal is printed on stdout with exit 0 and names the Profile errors", () => {
  const { root } = fixture({ project: project(["React"], "- Built the admin without a key.\n") });
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^autotriage: route refused\. the Profile has 1 error:\n  projects\/acme\.md: Story without a key: "Built the admin without a key\."\nRun \/autotriage:setup or fix the file by hand\./);
  assert.match(run(root, "profile.ts", "status").stdout, /proposal gate .*: fail/);
});

test("triage needs only profile.md; the Letter States need every Profile file", () => {
  const bad = VOICE.replace(/greeting: .*/, 'greeting: "Hi,"');
  const { root } = fixture({ voice: bad, candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  const t = run(root, "guard.ts", "triage", "2026-10-16-acme-fix");
  assert.match(t.stdout, /^Candidate: private\/candidates\/2026-10-16-acme-fix\nRoute: freelance\nTitle: Fix the admin\nBudget: /, t.stdout);
  const v = run(root, "guard.ts", "verify", "2026-10-16-acme-fix");
  assert.match(v.stdout, /verify refused\. the Profile has 1 error:\n  voice\.md: \/greeting must be object/);
  const body = fixture({ voice: `${VOICE}Hi,\n\nA calibration Letter.\n` });
  assert.match(run(body.root, "guard.ts", "route").stdout, /voice\.md: body must be empty/);
});

test("an unknown State and a missing Candidate argument refuse with the fix named", () => {
  const { root } = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  assert.match(run(root, "guard.ts", "bogus").stdout, /^autotriage: bogus refused\. unknown State\. Known: setup, route, intake, triage, version, proposal, verify\./);
  assert.match(run(root, "guard.ts", "triage").stdout, /triage refused\. needs a Candidate folder name as argument\.\nKnown Candidates:\n  2026-10-16-acme-fix\nUsage: \/autotriage:triage <YYYY-MM-DD-slug>/);
  assert.match(run(root, "guard.ts", "triage", "2026-10-16-nope").stdout, /no Candidate folder private\/candidates\/2026-10-16-nope\./);
});

test("intake prints today and the known Candidates; triage refuses once the Letter file exists", () => {
  const { root } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob(), "cover-letter.md": cover("general") } } });
  assert.match(run(root, "guard.ts", "intake").stdout.trim(), /^Today: \d{4}-\d{2}-\d{2}\nKnown Candidates:\n  2026-10-17-acme-frontend$/);
  const t = run(root, "guard.ts", "triage", "2026-10-17-acme-frontend");
  assert.match(t.stdout, /cover-letter\.md already exists; the Route has passed triage\.\nRun \/autotriage:verify 2026-10-17-acme-frontend/);
});

test("the PreToolUse hook denies a refused State and stays silent on a passing one", () => {
  const { root } = fixture();
  const deny = hook(root, "pre-tool-use.ts", { tool_input: { skill: "autotriage:triage", args: "" } });
  assert.equal(deny.status, 0, deny.stderr);
  const out = JSON.parse(deny.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, "deny");
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /triage refused\. needs a Candidate folder name/);
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "autotriage:route", args: "" } }).stdout, "");
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "other:thing" } }).stdout, "");
});

test("the write hook validates Profile, Candidate and Version files by their path and ignores the rest", () => {
  const { root, candidate } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob() } } });
  const write = (file: string) => hook(root, "post-tool-use.ts", { tool_input: { file_path: file } });
  assert.equal(write(path.join(root, "profile", "profile.md")).stdout, "", "a valid file passes");
  fs.writeFileSync(path.join(root, "profile", "profile.md"), PROFILE.replace("word_cap: 350\n", ""));
  const blocked = JSON.parse(write(path.join(root, "profile", "profile.md")).stdout);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /does not match the profile schema:\n  \/ must have required property 'word_cap'/);
  fs.writeFileSync(path.join(candidate("2026-10-17-acme-frontend"), "job.md"), employmentJob().replace("remote: remote\n", ""));
  assert.match(JSON.parse(write(path.join(candidate("2026-10-17-acme-frontend"), "job.md")).stdout).reason, /job-employment schema/);
  fs.writeFileSync(path.join(root, "resume", "versions", "general.md"), "---\ntitle: X\n---\n");
  assert.match(JSON.parse(write(path.join(root, "resume", "versions", "general.md")).stdout).reason, /version schema/);
  assert.equal(write(path.join(root, "README.md")).stdout, "");
  assert.equal(write(path.join(root, "profile", "master.md")).stdout, "", "generated files have no schema");
});
