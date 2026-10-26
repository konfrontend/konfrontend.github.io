// The Guard as a transition table: the Profile gate reads the Profile through profile/lib, a
// refusal is printed on stdout with exit 0 so the model always sees it, the PreToolUse hook turns the
// same Refusal into a deny, and the write hook validates every Profile and Candidate file.
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fixture, run, hook, project, VOICE, PROFILE, employmentJob, freelanceJob } from "./fixture.ts";

test("the route gate passes on a valid Profile", () => {
  const { root } = fixture();
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "Profile gate passed.");
});

test("a refusal is printed on stdout with exit 0 and names the Profile errors", () => {
  const { root } = fixture({ project: project(["React"], "## Bullets\n\n- Built the admin without a key.\n") });
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^autotriage: route refused\. the Profile has 1 error:\n  projects\/acme\.md: Bullet without a key: "Built the admin without a key\."\nFix the file by hand\./);
});

test("triage needs only profile.md; the Letter States need every Profile file", () => {
  const bad = VOICE.replace(/greeting: .*/, 'greeting: "Hi,"');
  const { root } = fixture({ voice: bad, candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob({ verdict: "go" }), "letter.md": "Hi,\n" } } });
  const t = run(root, "guard.ts", "triage", "2026-10-16-acme-fix");
  assert.match(t.stdout, /letter\.md already exists; the Route has passed triage/, t.stdout);
  const v = run(root, "guard.ts", "verify", "2026-10-16-acme-fix");
  assert.match(v.stdout, /verify refused\. the Profile has 1 error:\n  voice\.md: \/greeting must be object/);
  const body = fixture({ voice: `${VOICE}Hi,\n\nA calibration Letter.\n` });
  assert.match(run(body.root, "guard.ts", "route").stdout, /voice\.md: body must be empty/);
});

test("an unknown State and a missing Candidate argument refuse with the fix named", () => {
  const { root } = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  assert.match(run(root, "guard.ts", "bogus").stdout, /^autotriage: bogus refused\. unknown State\. Known: route, intake, triage, version, proposal, verify\./);
  assert.match(run(root, "guard.ts", "triage").stdout, /triage refused\. needs a Candidate folder name as argument\.\nKnown Candidates:\n  2026-10-16-acme-fix\nUsage: \/route-triage <YYYY-MM-DD-slug>/);
  assert.match(run(root, "guard.ts", "triage", "2026-10-16-nope").stdout, /no Candidate folder private\/candidates\/2026-10-16-nope\./);
});

test("intake prints today and the known Candidates; triage prints the Job's identity and notes a Verdict", () => {
  const { root } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob() }, "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  assert.match(run(root, "guard.ts", "intake").stdout.trim(), /^Today: \d{4}-\d{2}-\d{2}\nKnown Candidates:\n  2026-10-16-acme-fix\n  2026-10-17-acme-frontend$/);
  const t = run(root, "guard.ts", "triage", "2026-10-17-acme-frontend");
  assert.match(t.stdout, /^Candidate: private\/candidates\/2026-10-17-acme-frontend\nRoute: employment\nTitle: Senior Frontend Developer\nCompany: Acme\nEmployment: full-time\nTimezone: Europe\/Madrid\nNote: the Verdict is already go; the Checkpoint rewrites it\./, t.stdout);
  const f = run(root, "guard.ts", "triage", "2026-10-16-acme-fix");
  assert.match(f.stdout.trim(), /^Candidate: private\/candidates\/2026-10-16-acme-fix\nRoute: freelance\nTitle: Fix the admin\nTimezone: America\/New_York$/, f.stdout);
});

test("the Letter States check the Verdict the human confirmed and recompute nothing", () => {
  const go = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob({ verdict: "go", flags: ["regulated-domain"] }) } } });
  const p = run(go.root, "guard.ts", "proposal", "2026-10-16-acme-fix");
  assert.match(p.stdout.trim(), /^Candidate: private\/candidates\/2026-10-16-acme-fix\nRoute: freelance\nTitle: Fix the admin\nRequirements: none recorded\nFlags: regulated-domain$/, p.stdout);
  const noGo = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob({ verdict: "no-go" }) } } });
  assert.match(run(noGo.root, "guard.ts", "proposal", "2026-10-16-acme-fix").stdout, /^autotriage: proposal refused\. the Verdict is no-go\. Route ended\.\n?$/);
  const none = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  assert.match(run(none.root, "guard.ts", "proposal", "2026-10-16-acme-fix").stdout, /proposal refused\. no Verdict yet\.\nRun \/route-triage 2026-10-16-acme-fix and answer go or no-go at the Checkpoint\./);
  assert.match(run(none.root, "guard.ts", "verify", "2026-10-16-acme-fix").stdout, /verify refused\. no Verdict yet\./);
  assert.match(run(go.root, "guard.ts", "verify", "2026-10-16-acme-fix").stdout, /verify refused\. .*letter\.md is missing\.\nRun \/route-proposal 2026-10-16-acme-fix first\./);
  fs.writeFileSync(path.join(go.candidate("2026-10-16-acme-fix"), "letter.md"), "---\nslug: x\n---\nHi,\n");
  assert.match(run(go.root, "guard.ts", "verify", "2026-10-16-acme-fix").stdout, /letter\.md is invalid:\n  letter\.md carries frontmatter; a Letter is body only\nDrop the frontmatter/);
  fs.writeFileSync(path.join(go.candidate("2026-10-16-acme-fix"), "letter.md"), "Hi,\n");
  assert.match(run(go.root, "guard.ts", "verify", "2026-10-16-acme-fix").stdout.trim(), /^Candidate: .*\nRoute: freelance\nLetter: letter\.md\nTemplate: letter-freelance$/);
});

test("the PreToolUse hook denies a refused State and stays silent on a passing one", () => {
  const { root } = fixture();
  const deny = hook(root, "pre-tool-use.ts", { tool_input: { skill: "route-triage", args: "" } });
  assert.equal(deny.status, 0, deny.stderr);
  const out = JSON.parse(deny.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, "deny");
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /triage refused\. needs a Candidate folder name/);
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "route", args: "" } }).stdout, "");
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "other:thing" } }).stdout, "");
});

test("the write hook validates Profile and Candidate files by their path and ignores the rest", () => {
  const { root, candidate } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob(), "letter.md": "Hello,\n" } } });
  const write = (file: string) => hook(root, "post-tool-use.ts", { tool_input: { file_path: file } });
  assert.equal(write(path.join(root, "profile", "profile.md")).stdout, "", "a valid file passes");
  fs.writeFileSync(path.join(root, "profile", "profile.md"), PROFILE.replace("resume_order: [acme]\n", ""));
  const blocked = JSON.parse(write(path.join(root, "profile", "profile.md")).stdout);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /does not match the profile schema:\n  \/ must have required property 'resume_order'/);
  const dir = candidate("2026-10-17-acme-frontend");
  fs.writeFileSync(path.join(dir, "job.md"), employmentJob().replace("company: Acme\n", ""));
  assert.match(JSON.parse(write(path.join(dir, "job.md")).stdout).reason, /the Candidate contract:\n  \/ must have required property 'company'/);
  assert.equal(write(path.join(dir, "letter.md")).stdout, "", "a body-only Letter passes");
  fs.writeFileSync(path.join(dir, "letter.md"), "---\nfamily: audit\n---\nHello,\n");
  assert.match(JSON.parse(write(path.join(dir, "letter.md")).stdout).reason, /the Candidate contract:\n  letter\.md carries frontmatter; a Letter is body only/);
  assert.equal(write(path.join(dir, "version.md")).stdout, "", "a Version has no schema; render.ts checks it");
  assert.equal(write(path.join(root, "resume", "versions", "general.md")).stdout, "");
  assert.equal(write(path.join(root, "README.md")).stdout, "");
  assert.equal(write(path.join(root, "profile", "skills.md")).stdout, "", "generated files have no schema");
});

test("every State's guard line runs with CLAUDE_PROJECT_DIR unset, from a subfolder, falling back to the repo root", () => {
  const repo = path.resolve(import.meta.dirname, "..", "..");
  const skills = path.join(repo, ".claude", "skills");
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  const lines = fs.readdirSync(skills).flatMap((s) => {
    const file = path.join(skills, s, "SKILL.md");
    return fs.existsSync(file) ? (fs.readFileSync(file, "utf8").match(/^!`(.+)`$/gm) ?? []).map((l) => [s, l.slice(2, -1).replace("$ARGUMENTS", "")]) : [];
  });
  assert.ok(lines.length >= 6, "the route, intake and four State guard lines");
  for (const [skill, line] of lines) {
    const r = spawnSync("sh", ["-c", line], { cwd: path.join(repo, "autotriage"), env, encoding: "utf8" });
    assert.equal(r.stderr, "", `${skill}: ${line}`);
    assert.match(r.stdout, /^(?:Today: |Profile gate passed\.|autotriage: \w+ refused\. )/, `${skill}: ${r.stdout}`);
  }
});
