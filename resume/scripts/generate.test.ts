// The resume scripts follow the root: generate.ts reads the Profile and resolves its paths from
// CLAUDE_PROJECT_DIR, while bannedPhrases reads the catalogue next to its own module. The cut needs
// Chrome and stays untested. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readProfile } from "../../profile/lib/index.ts";
import { fixture } from "../../autotriage/scripts/fixture.ts";
import { bannedPhrases } from "./version.ts";

const GENERATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "generate.ts");
const generate = (root: string, input: string, ...args: string[]) => spawnSync(process.execPath, [GENERATE, ...args], { encoding: "utf8", input, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

test("generate takes the Plan on stdin, reads the fixture's Profile and resolves the target from the root", () => {
  const { root } = fixture();
  const plan = JSON.stringify({ title: "", summary: "S.", skills: ["Core: React"], bullets: [{ project: "acme", key: "rbac-admin" }, { project: "acme", key: "nope" }] });
  const r = generate(root, plan, "version.md");
  assert.equal(r.stdout.trim(), "FAIL  plan: the Plan has no title; acme has no Bullet [nope]", "acme and [rbac-admin] exist in the fixture only");
  assert.ok(!fs.existsSync(path.join(root, "version.md")));
  assert.equal(generate(root, "", "version.md").stdout.trim(), "FAIL  plan: no Plan on stdin");
  const refused = generate(root, "", "--refresh", "private/candidates/2026-10-17-acme-frontend/version.md");
  assert.match(refused.stdout, /^refused: private\/candidates\/2026-10-17-acme-frontend\/version\.md is a tailored Version/);
});

test("bannedPhrases reads the catalogue next to its module, under any root", () => {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  const { root } = fixture();
  process.env.CLAUDE_PROJECT_DIR = root;
  try {
    const banned = bannedPhrases(readProfile());
    assert.ok(banned.length > 0, "the fixture holds no catalogue; the module's own is read");
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev;
  }
});
