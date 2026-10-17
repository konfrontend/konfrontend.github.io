// Fixtures for the Guard's Profile gate over data/projects/ and the summary ledger: a keywords term the
// ledger lacks refuses, a shipped row with no Project in Evidence warns, and `record` writes the
// Candidate's marker so a re-run is a no-op. Each case runs the scripts against a temp data/ folder
// through CLAUDE_PROJECT_DIR. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const run = (root, script, ...args) => spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

const profile = `---
identity: { name: Kon, timezone: Europe/Madrid, constraints: [] }
refused_stacks: []
family_precedence: [audit, build, maintenance, fix]
word_cap: 350
terms: { rate: 60, rate_floor: 40, budget_floor: 0, billing: hourly-caps }
---
`;
const ledger = (rows) => `---
target_after: 3
categories:
  frontend: Frontend
  backend: Backend
skills:
${rows.map((r) => `  - ${r}`).join("\n")}
---
`;
const project = (keywords, extra = "") => `---
name: Acme
url: https://acme.example
role: Full Stack Developer
employment: contract
start: 2021-02
naming: public
description: B2B dashboard.
keywords: [${keywords.join(", ")}]${extra}
---
**Admin**

- Built the RBAC admin and the SAML login.
  Collaborator and admin roles.
`;
const job = `---
slug: acme-fix
title: Fix the admin
date: 2026-10-16
route: freelance
timezone: America/New_York
budget: { type: hourly, min: 30, max: 80 }
---
Posting text.
`;

const voice = `---
language: en-US
greeting: { freelance: "Hi,", employment: "Hello," }
sign_off: Kon
cite_role_period: false
---
`;
const employmentJob = `---
slug: acme-frontend
title: Frontend Developer
date: 2026-10-16
route: employment
company: Acme
employment: full-time
remote: remote
timezone: Europe/Madrid
verdict: { flags: [], skill_fit: 4, interest_fit: 3, value: 3, alert_level: 1, hard_stops: [], verdict: go, decision: go }
---
Posting text.
`;

function fixture({ rows, keywords, withJob = false, voiceText = voice }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "autotriage-guard-"));
  fs.mkdirSync(path.join(root, "data", "profile"), { recursive: true });
  fs.mkdirSync(path.join(root, "data", "projects"), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "profile", "profile.md"), profile);
  fs.writeFileSync(path.join(root, "data", "profile", "voice.md"), voiceText);
  fs.writeFileSync(path.join(root, "data", "profile", "skills.md"), ledger(rows));
  fs.writeFileSync(path.join(root, "data", "projects", "acme.md"), project(keywords));
  if (withJob) {
    fs.mkdirSync(path.join(root, "data", "candidates", "2026-10-16-acme-fix"), { recursive: true });
    fs.writeFileSync(path.join(root, "data", "candidates", "2026-10-16-acme-fix", "job.md"), job);
  }
  return root;
}

const shippedReact = "{ name: React, category: frontend, level: shipped, keywords: [], roles: [], seen: 0 }";
const shippedVue = "{ name: Vue.js, category: frontend, level: shipped, keywords: [], roles: [], seen: 0 }";

test("the route gate passes on a valid Project under data/projects/ and lists its Evidence in print", () => {
  const root = fixture({ rows: [shippedReact], keywords: ["React"] });
  const r = run(root, "guard.mjs", "route");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Profile gate passed/);
  assert.doesNotMatch(r.stdout, /Warning/);
  const p = run(root, "skills.mjs", "print");
  assert.equal(p.status, 0, p.stderr);
  assert.match(p.stdout, /\| React \| shipped \| frontend \| acme \| 0 \|/);
  const st = run(root, "profile.mjs", "status");
  assert.match(st.stdout, /data\/projects\/acme\.md: ok/);
  assert.match(st.stdout, /proposal gate .*: pass/);
});

test("a keywords term the ledger lacks refuses every ledger-gated State", () => {
  const root = fixture({ rows: [shippedReact], keywords: ["React", "Supabase"] });
  for (const state of ["skills", "route"]) {
    const r = run(root, "guard.mjs", state);
    assert.equal(r.status, 1, state);
    assert.match(r.stderr, new RegExp(`autotriage: ${state} refused. keywords the ledger lacks:\\n  data/projects/acme.md: Supabase`));
  }
});

test("a shipped row with no Project in Evidence is a warning, not a refusal", () => {
  const root = fixture({ rows: [shippedReact, shippedVue], keywords: ["React"] });
  const r = run(root, "guard.mjs", "skills");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Warning: shipped with no Project in Evidence \(1\): Vue\.js/);
  const p = run(root, "skills.mjs", "print");
  assert.match(p.stdout, /shipped with no Project in Evidence \(1\): Vue\.js/);
});

test("a ledger row whose category is not in the categories map is invalid", () => {
  const root = fixture({ rows: [shippedReact, "{ name: Rust, category: languages, level: learning, keywords: [], roles: [], seen: 0 }"], keywords: ["React"] });
  const r = run(root, "guard.mjs", "skills");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\/skills\/1\/category "languages" is not a key of categories/);
});

test("record increments seen, writes the marker into job.md, and a re-run is a no-op", () => {
  const root = fixture({ rows: [shippedReact], keywords: ["React"], withJob: true });
  const jobFile = path.join(root, "data", "candidates", "2026-10-16-acme-fix", "job.md");
  const first = run(root, "skills.mjs", "record", "2026-10-16-acme-fix", "--seen", "React", "--gap", "Supabase:backend");
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(JSON.parse(first.stdout), { incremented: ["React"], added: ["Supabase"], unchanged: [] });
  const ledgerText = fs.readFileSync(path.join(root, "data", "profile", "skills.md"), "utf8");
  assert.match(ledgerText, /name: React, category: frontend, level: shipped, keywords: \[\], roles: \[\], seen: 1/);
  assert.match(ledgerText, /name: Supabase, category: backend, level: gap, keywords: \[\], roles: \[\], seen: 1/);
  const jobText = fs.readFileSync(jobFile, "utf8");
  assert.match(jobText, /recorded_skills:\n  - React\n  - Supabase/);
  assert.match(jobText, /Posting text\./, "the body survives the write");
  const again = run(root, "skills.mjs", "record", "2026-10-16-acme-fix", "--seen", "React", "--gap", "Supabase:backend");
  assert.deepEqual(JSON.parse(again.stdout), { incremented: [], added: [], unchanged: ["React", "Supabase"] });
  assert.equal(fs.readFileSync(path.join(root, "data", "profile", "skills.md"), "utf8"), ledgerText, "nothing rewritten");
  assert.equal(fs.readFileSync(jobFile, "utf8"), jobText);
  const triage = run(root, "guard.mjs", "triage", "2026-10-16-acme-fix");
  assert.equal(triage.status, 0, triage.stderr);
  assert.match(triage.stdout, /already holds this Candidate for React, Supabase/);
  const bad = run(root, "skills.mjs", "record", "2026-10-16-acme-fix", "--gap", "Figma:design");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /category "design" is not a key/);
});

test("voice.md takes a greeting per route and no body", () => {
  const ok = run(fixture({ rows: [shippedReact], keywords: ["React"] }), "guard.mjs", "route");
  assert.equal(ok.status, 0, ok.stderr);
  const single = run(fixture({ rows: [shippedReact], keywords: ["React"], voiceText: voice.replace(/greeting: .*/, 'greeting: "Hi,"') }), "guard.mjs", "route");
  assert.equal(single.status, 1);
  assert.match(single.stderr, /voice\.md is invalid:\n  \/greeting must be object/);
  const body = fixture({ rows: [shippedReact], keywords: ["React"], voiceText: `${voice}Hi,\n\nA calibration Letter.\n` });
  const r = run(body, "guard.mjs", "route");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /voice\.md is invalid:\n  body must be empty/);
  assert.match(run(body, "profile.mjs", "status").stdout, /data\/profile\/voice\.md: invalid\n    body must be empty/);
});

test("the employment route checks cover-letter.md against letter-employment", () => {
  const root = fixture({ rows: [shippedReact], keywords: ["React"] });
  const dir = path.join(root, "data", "candidates", "2026-10-16-acme-frontend");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "job.md"), employmentJob);
  const missing = run(root, "guard.mjs", "verify", "2026-10-16-acme-frontend");
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /cover-letter\.md is missing/);
  fs.writeFileSync(path.join(dir, "cover-letter.md"), "---\nslug: acme-frontend\ndate: 2026-10-16\nversion: general\n---\nHello,\n");
  const r = run(root, "guard.mjs", "verify", "2026-10-16-acme-frontend");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Letter: cover-letter\.md\nTemplate: letter-employment/);
  const triage = run(root, "guard.mjs", "triage", "2026-10-16-acme-frontend");
  assert.equal(triage.status, 1);
  assert.match(triage.stderr, /cover-letter\.md already exists/);
});
