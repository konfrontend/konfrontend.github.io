// The Guard: the Profile gate reads the Profile through profile/lib, a refusal is printed on stdout with
// exit 0 so the model always sees it, the PreToolUse hook turns the same Refusal into a deny, and the write
// hook validates profile.md and voice.md.
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fixture, run, hook, VOICE, PROFILE } from "./fixture.ts";

test("the route gate passes on a valid Profile", () => {
  const { root } = fixture();
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "Profile gate passed.");
});

test("no Profile error refuses a State: a Project file in any shape and a broken voice.md pass the gate", () => {
  const bad = VOICE.replace(/greeting: .*/, 'greeting: "Hi,"');
  const { root } = fixture({ voice: bad, project: "- [old] An old-shape Bullet.\n" });
  assert.equal(run(root, "guard.ts", "route").stdout.trim(), "Profile gate passed.");
  assert.equal(run(root, "guard.ts", "verify").stdout.trim(), "Profile gate passed.");
});

test("a refusal is printed on stdout with exit 0: the Letter States need one Project file", () => {
  const { root } = fixture();
  fs.rmSync(path.join(root, "profile", "projects", "acme.md"));
  const r = run(root, "guard.ts", "route");
  assert.equal(r.status, 0);
  assert.equal(r.stderr, "");
  assert.match(r.stdout, /^autotriage: route refused\. no Project file under profile\/projects\/\.\nAdd at least one Project file\./);
});

test("an unknown State refuses with the known ones named", () => {
  const { root } = fixture();
  assert.match(run(root, "guard.ts", "bogus").stdout, /^autotriage: bogus refused\. unknown State\. Known: /);
});

test("the PreToolUse hook denies a refused State and stays silent on a passing one", () => {
  const { root } = fixture();
  fs.rmSync(path.join(root, "profile", "projects", "acme.md"));
  const deny = hook(root, "pre-tool-use.ts", { tool_input: { skill: "route-proposal", args: "" } });
  assert.equal(deny.status, 0, deny.stderr);
  const out = JSON.parse(deny.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, "deny");
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /proposal refused\. no Project file/);
  assert.equal(hook(fixture().root, "pre-tool-use.ts", { tool_input: { skill: "route", args: "" } }).stdout, "");
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "route-triage", args: "" } }).stdout, "", "triage cites no Project: no gate");
  assert.equal(hook(root, "pre-tool-use.ts", { tool_input: { skill: "other:thing" } }).stdout, "");
});

test("the write hook validates Profile files by their path and ignores the rest", () => {
  const { root } = fixture();
  const write = (file: string) => hook(root, "post-tool-use.ts", { tool_input: { file_path: file } });
  assert.equal(write(path.join(root, "profile", "profile.md")).stdout, "", "a valid file passes");
  fs.writeFileSync(path.join(root, "profile", "profile.md"), PROFILE.replace("terms: { rate: 60 }\n", ""));
  const blocked = JSON.parse(write(path.join(root, "profile", "profile.md")).stdout);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /does not match the profile schema:\n  \/ must have required property 'terms'/);
  assert.equal(write(path.join(root, "resume", "versions", "frontend.md")).stdout, "", "a Version is the person's prose, with no schema");
  assert.equal(write(path.join(root, "README.md")).stdout, "");
  fs.writeFileSync(path.join(root, "profile", "projects", "acme.md"), "No frontmatter, no sections.\n");
  assert.equal(write(path.join(root, "profile", "projects", "acme.md")).stdout, "", "a Project file is never blocked");
});

test("every State's guard line runs with CLAUDE_PROJECT_DIR unset, from a subfolder, falling back to the repo root", () => {
  const repo = path.resolve(import.meta.dirname, "..", "..");
  const skills = path.join(repo, ".claude", "skills");
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  const lines = fs.readdirSync(skills).flatMap((s) => {
    const file = path.join(skills, s, "SKILL.md");
    return fs.existsSync(file) ? (fs.readFileSync(file, "utf8").match(/^!`(.+)`$/gm) ?? []).map((l) => [s, l.slice(2, -1)]) : [];
  });
  assert.ok(lines.length >= 3, "the route, proposal and verify guard lines");
  for (const [skill, line] of lines) {
    const r = spawnSync("sh", ["-c", line], { cwd: path.join(repo, "autotriage"), env, encoding: "utf8" });
    assert.equal(r.stderr, "", `${skill}: ${line}`);
    assert.match(r.stdout, /^(?:Profile gate passed\.|autotriage: \w+ refused\. )/, `${skill}: ${r.stdout}`);
  }
});
