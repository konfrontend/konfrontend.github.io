import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProfile, parseProject, checkBullet, skills, skillFor, renderSkills, writeArtifact, repoRoot } from "./index.ts";

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "profile-"));
  writeArtifact(path.join(root, "profile.md"), {
    identity: { name: "Ada Lovelace", timezone: "Europe/London", constraints: [] },
    contact: { location: "London (UTC+0)", email: "ada@example.com", github: "https://github.com/ada" },
    resume_order: ["engine", "notes"],
    terms: { rate: 60, rate_floor: 40 },
  });
  writeArtifact(path.join(root, "voice.md"), { language: "en-US", greeting: { freelance: "Hi,", employment: "Hello," }, sign_off: "Ada" });
  writeArtifact(path.join(root, "projects", "engine.md"), {
    name: "Analytical Engine", url: "https://example.com/engine", role: "Programmer", employment: "contract", start: "1842-01", end: "1843-09", naming: "public", description: "A mechanical computer.", keywords: ["Punched cards", "Bernoulli numbers"],
  }, "## Overview\n\nThe Engine had no program. I wrote one.\n\n## Bullets\n\n- [bernoulli] Wrote the first program, computing Bernoulli numbers.\n- [loops] Described loops and conditional branches.\n\n## Notes\n\n- Published in 1843.\n");
  writeArtifact(path.join(root, "projects", "notes.md"), {
    name: "Notes", role: "Author", employment: "independent", start: "1843-01", naming: "public", description: "Translation notes.", keywords: ["punched cards", "Writing"],
  }, "## Bullets\n\n- [translation] Translated Menabrea's memoir with notes three times its length.\n");
  fs.mkdirSync(path.join(root, "answers"));
  writeArtifact(path.join(root, "answers", "why.md"), { question: "Why compute?" }, "Because the Engine can.\n");
  return root;
}

test("parseProject reads the Overview, the Bullets and the Notes", () => {
  const body = "## Overview\n\nProblem.\n\n- Solution and outcome.\n\n## Bullets\n\n- [rbac] Built the RBAC admin.\n- [saml] Added SAML login,\n  the second line.\n\n## Notes\n\n- Raw line one.\n- Raw line two.\n";
  const p = parseProject(body);
  assert.deepEqual(p.errors, []);
  assert.equal(p.overview, "Problem.\n\n- Solution and outcome.");
  assert.deepEqual(p.bullets.map((b) => [b.key, b.text]), [["rbac", "Built the RBAC admin."], ["saml", "Added SAML login, the second line."]]);
  assert.deepEqual(Object.keys(p.bullets[0]), ["key", "text"], "a Bullet is its key and text only");
  assert.deepEqual(p.notes, ["Raw line one.", "Raw line two."]);
  assert.deepEqual(parseProject("").errors, []);
  assert.equal(parseProject("## Overview\n\n## Bullets\n").overview, "");
});

test("parseProject reports a Bullet without a key, a duplicate key, an unknown section (Stories included), a ### line and text outside the sections", () => {
  const p = parseProject("Stray.\n\n## Themes\n\n## Bullets\n\n- No key.\n- [a] One.\n- [a] Two.\n\n## Stories\n\n## Overview\n\n### Admin\n");
  assert.deepEqual(p.errors, ['text outside the sections: "Stray."', 'unknown section "## Themes"', 'Bullet without a key: "No key."', "duplicate Bullet key [a]", 'unknown section "## Stories"', 'a "###" line: "### Admin"']);
});

test("checkBullet fails a duty opener, warns on more than three measured claims and on a present-tense opener", () => {
  const b = (text: string) => checkBullet({ key: "k", text });
  assert.deepEqual(b("Built 314 of the 332 components on a 2-person team."), { errors: [], warnings: [] });
  assert.match(b("Responsible for the admin.").errors[0], /opens with a duty/);
  assert.deepEqual(b("Scaled it from 1 to 2,600 positions at 10–50 samples in 40 ms to 15 s, 37 of its 84 at 4.5:1.").warnings.length, 1, "a base, a range and a ratio count with their claim");
  assert.match(b("Scaled it from 1 to 2,600 positions at 10–50 samples in 40 ms to 15 s, 37 of its 84 at 4.5:1.").warnings[0], /has 5 measured claims \(at most 3\): 1 to 2,600, 10–50, 40 ms to 15, 37 of its 84, 4.5:1/);
  assert.deepEqual(b("Cut LCP from 3.6 s to 1.1 s and memory to 52 MB against 576 MB to 1.3 GB.").warnings, []);
  assert.deepEqual(b("Rendered 3D roofs in i18n-ready UI with Vue 3.").warnings, [], "3D and i18n are not numbers");
  assert.match(b("Builds the admin.").warnings[0], /past tense/);
});

test("readProfile validates every file, orders Projects by resume_order and reads Answers", () => {
  const p = readProfile(fixture());
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.warnings, []);
  assert.deepEqual(p.projects.map((x) => x.slug), ["engine", "notes"]);
  assert.equal(p.projects[0].overview, "The Engine had no program. I wrote one.");
  assert.equal(p.projects[0].bullets.length, 2);
  assert.deepEqual(p.projects[0].notes, ["Published in 1843."]);
  assert.deepEqual(p.answers.map((a) => [a.question, a.text]), [["Why compute?", "Because the Engine can."]]);
});

test("readProfile names a resume_order slug with no Project file, a Project missing from the order, and a Bullet that breaks a rule", () => {
  const root = fixture();
  writeArtifact(path.join(root, "projects", "extra.md"), { name: "X", role: "R", employment: "independent", start: "1850-01", naming: "public", description: "D", keywords: ["Writing"] }, "## Bullets\n\n- [x] Helped with 1, 2, 3 and 4.\n");
  const p = readProfile(root);
  assert.ok(p.errors.includes("profile.md: resume_order lacks the Project extra"));
  assert.ok(p.errors.includes('projects/extra.md: [x] opens with a duty, not an active verb: "Helped with 1, 2, 3 and 4."'));
  assert.ok(p.warnings.some((e) => e.startsWith("projects/extra.md: [x] has 4 measured claims")));
  assert.equal(p.profile, null);
});

test("skills derive from keywords: canonical spelling from the first Project in resume order, exact match only; skills.md lists them", () => {
  const p = readProfile(fixture());
  assert.deepEqual(skills(p).map((s) => [s.name, s.evidence]), [["Punched cards", ["engine", "notes"]], ["Bernoulli numbers", ["engine"]], ["Writing", ["notes"]]]);
  assert.equal(skillFor(p, "punched CARDS")?.name, "Punched cards");
  assert.equal(skillFor(p, "cards"), null);
  assert.match(renderSkills(p), /3 Skills\.\n\n\| skill \| evidence \|\n\| --- \| --- \|\n\| Bernoulli numbers \| engine \|\n\| Punched cards \| engine, notes \|\n\| Writing \| notes \|\n$/);
});

test("repoRoot is CLAUDE_PROJECT_DIR when set, else the repo this module sits in, read on each call", () => {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  try {
    delete process.env.CLAUDE_PROJECT_DIR;
    const own = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    assert.equal(repoRoot(), own);
    process.env.CLAUDE_PROJECT_DIR = os.tmpdir();
    assert.equal(repoRoot(), path.resolve(os.tmpdir()));
    assert.equal(readProfile().root, path.join(path.resolve(os.tmpdir()), "profile"), "the Profile follows the root");
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev;
  }
});
