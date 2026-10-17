// Fixtures for the version State and the employment Guards: the pick rule reads the role title,
// version.mjs writes `version` into job.md and copies the picked Version on --tailor, and the Guards
// refuse version off the employment route or before go, proposal without `version` or with
// `version: tailored` and no version.md, and verify without cover-letter.md. Each case runs the
// scripts against a temp project through CLAUDE_PROJECT_DIR. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pickVersion, summaryParagraph } from "./version.mjs";

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const run = (root, script, ...args) => spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

const GENERAL = "10+ years shipping web products end to end in TypeScript and Java.";
const FRONTEND = "10+ years building web frontends in TypeScript.";
const profile = `---
identity: { name: Kon, timezone: Europe/Madrid, constraints: [] }
refused_stacks: []
family_precedence: [audit, build, maintenance, fix]
word_cap: 350
summaries:
  general: "${GENERAL}"
  frontend: "${FRONTEND}"
terms: { rate: 60, rate_floor: 40, budget_floor: 0, billing: hourly-caps }
---
`;
const ledger = `---
target_after: 3
categories:
  frontend: Frontend
skills:
  - { name: React, category: frontend, level: shipped, keywords: [], roles: [], seen: 0 }
---
`;
const project = `---
name: Acme
url: https://acme.example
role: Frontend Developer
employment: contract
start: 2021-02
naming: public
description: B2B dashboard.
keywords: [React]
---
**Admin**

- Built the RBAC admin.
`;
const versionSource = (summary) => `---
role: frontend
---
# Kon

Senior Frontend Developer

Gijon, Spain (UTC+2) • [kon@example.com](mailto:kon@example.com) • [github.com/kon](https://github.com/kon)

${summary}

## Professional Experience
`;
const verdict = (decision) => `verdict:
  flags: []
  skill_fit: 4
  interest_fit: 3
  value: 3
  alert_level: 1
  hard_stops: []
  verdict: go
  decision: ${decision}
`;
const job = ({ title = "Senior Frontend Developer", route = "employment", decision = "go", version } = {}) => `---
slug: acme-frontend
title: "${title}"
date: 2026-10-17
route: ${route}
${route === "employment" ? "company: Acme\nemployment: full-time\nremote: remote\n" : "budget: { type: hourly, min: 30, max: 80 }\n"}timezone: Europe/Madrid
${version ? `version: ${version}\n` : ""}${decision === "absent" ? "" : verdict(decision)}---
Posting text.
`;

const CANDIDATE = "2026-10-17-acme-frontend";
function fixture(jobText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "autotriage-version-"));
  const data = path.join(root, "data");
  for (const d of ["profile", "projects", path.join("candidates", CANDIDATE)]) fs.mkdirSync(path.join(data, d), { recursive: true });
  fs.mkdirSync(path.join(root, "versions"));
  fs.writeFileSync(path.join(data, "profile", "profile.md"), profile);
  fs.writeFileSync(path.join(data, "profile", "voice.md"), "---\nlanguage: en-US\ngreeting: \"Hi,\"\nsign_off: Kon\n---\n");
  fs.writeFileSync(path.join(data, "profile", "skills.md"), ledger);
  fs.writeFileSync(path.join(data, "projects", "acme.md"), project);
  fs.writeFileSync(path.join(root, "versions", "general.md"), versionSource(GENERAL));
  fs.writeFileSync(path.join(root, "versions", "frontend.md"), versionSource(FRONTEND));
  fs.writeFileSync(path.join(data, "candidates", CANDIDATE, "job.md"), jobText);
  return { root, dir: path.join(data, "candidates", CANDIDATE) };
}

test("the pick rule: frontend, front-end, React, Vue or UI in the role title picks frontend", () => {
  for (const title of ["Senior Frontend Developer", "Front-end Engineer", "Front End Lead", "React Developer", "Vue.js Engineer", "Senior UI Engineer", "UI/UX Developer"]) {
    assert.equal(pickVersion(title), "frontend", title);
  }
  for (const title of ["Full Stack Developer", "Senior Software Engineer", "Backend Engineer (Node.js)", "Building Tools Engineer", "Reactor Physicist", undefined]) {
    assert.equal(pickVersion(title), "general", String(title));
  }
});

test("the summary of a Version source is the paragraph after the contact line", () => {
  assert.equal(summaryParagraph(versionSource("Line one\nline two.")), "Line one line two.");
  assert.equal(summaryParagraph("# Kon\n\nno contact line\n"), null);
});

test("version writes the pick into job.md before the verdict block and names the next command", () => {
  const { root, dir } = fixture(job({ title: "Senior Vue Engineer" }));
  const r = run(root, "version.mjs", CANDIDATE);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^version: frontend, picked by the title "Senior Vue Engineer"/);
  assert.match(r.stdout.trim().split("\n").at(-1), new RegExp(`^Next: /autotriage:proposal ${CANDIDATE}$`));
  const text = fs.readFileSync(path.join(dir, "job.md"), "utf8");
  assert.match(text, /version: frontend\nverdict:/);
  assert.match(text, /Posting text\./, "the body survives the write");
  assert.ok(!fs.existsSync(path.join(dir, "version.md")));
  const g = fixture(job({ title: "Full Stack Developer" }));
  assert.match(run(g.root, "version.mjs", CANDIDATE).stdout, /^version: general/);
});

test("version --tailor writes tailored, copies the picked Version, and never overwrites version.md", () => {
  const { root, dir } = fixture(job());
  const r = run(root, "version.mjs", CANDIDATE, "--tailor");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^version: tailored \(from frontend\)/);
  assert.match(fs.readFileSync(path.join(dir, "job.md"), "utf8"), /version: tailored/);
  assert.equal(fs.readFileSync(path.join(dir, "version.md"), "utf8"), versionSource(FRONTEND));
  fs.writeFileSync(path.join(dir, "version.md"), versionSource("Edited by hand."));
  const again = run(root, "version.mjs", CANDIDATE, "--tailor");
  assert.match(again.stdout, /version\.md already exists; left as it is/);
  assert.match(fs.readFileSync(path.join(dir, "version.md"), "utf8"), /Edited by hand\./);
});

test("the version Guard requires a valid job.md, route employment, and decision go", () => {
  const ok = fixture(job());
  assert.equal(run(ok.root, "guard.mjs", "version", CANDIDATE).status, 0);
  const freelance = fixture(job({ route: "freelance" }).replace("verdict:\n", "verdict:\n  family: build\n  family_runner_up: null\n"));
  const f = run(freelance.root, "guard.mjs", "version", CANDIDATE);
  assert.equal(f.status, 1);
  assert.match(f.stderr, /version refused\. .* freelance route; the version State runs on employment only/);
  for (const [decision, reason] of [["null", /decision is not go/], ["no-go", /decision is no-go\. Route ended\./], ["absent", /decision is not go/]]) {
    const r = run(fixture(job({ decision })).root, "guard.mjs", "version", CANDIDATE);
    assert.equal(r.status, 1, decision);
    assert.match(r.stderr, reason);
  }
  const invalid = run(fixture(job().replace("remote: remote\n", "")).root, "guard.mjs", "version", CANDIDATE);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /job\.md is invalid against job-employment/);
});

test("the proposal Guard on employment refuses without version and on tailored without version.md", () => {
  const none = run(fixture(job()).root, "guard.mjs", "proposal", CANDIDATE);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /proposal refused\. .*job\.md has no version\.\nRun \/autotriage:version/);

  const tailored = fixture(job({ version: "tailored" }));
  const t = run(tailored.root, "guard.mjs", "proposal", CANDIDATE);
  assert.equal(t.status, 1);
  assert.match(t.stderr, /version is tailored but .*version\.md is missing/);
  fs.writeFileSync(path.join(tailored.dir, "version.md"), versionSource("Tailored summary."));
  const tOk = run(tailored.root, "guard.mjs", "proposal", CANDIDATE);
  assert.equal(tOk.status, 0, tOk.stderr);
  assert.match(tOk.stdout, /Version: tailored\nIntro summary \(the paragraph after the contact line in version\.md\): Tailored summary\./);

  const frontend = run(fixture(job({ version: "frontend" })).root, "guard.mjs", "proposal", CANDIDATE);
  assert.equal(frontend.status, 0, frontend.stderr);
  assert.match(frontend.stdout, new RegExp(`Intro summary \\(summaries\\.frontend in data/profile/profile\\.md\\): ${FRONTEND.replace(/[.+]/g, "\\$&")}`));

  const noSummaries = fixture(job({ version: "general" }));
  fs.writeFileSync(path.join(noSummaries.root, "data", "profile", "profile.md"), profile.replace(/summaries:\n.*\n.*\n/, ""));
  const s = run(noSummaries.root, "guard.mjs", "proposal", CANDIDATE);
  assert.equal(s.status, 1);
  assert.match(s.stderr, /no summary for the intro Slot: summaries\.general in data\/profile\/profile\.md is missing/);
});

test("the verify Guard on employment requires a valid cover-letter.md; triage refuses once it exists", () => {
  const { root, dir } = fixture(job({ version: "general" }));
  const missing = run(root, "guard.mjs", "verify", CANDIDATE);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /cover-letter\.md is missing/);
  fs.writeFileSync(path.join(dir, "cover-letter.md"), "---\nslug: acme-frontend\ndate: 2026-10-17\nversion: general\noutcome: null\n---\nHi,\n");
  const invalid = run(root, "guard.mjs", "verify", CANDIDATE);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /cover-letter\.md is invalid/);
  fs.writeFileSync(path.join(dir, "cover-letter.md"), "---\nslug: acme-frontend\ndate: 2026-10-17\noutcome: null\n---\nHi,\n");
  const ok = run(root, "guard.mjs", "verify", CANDIDATE);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /Version: general/);
  const triage = run(root, "guard.mjs", "triage", CANDIDATE);
  assert.equal(triage.status, 1);
  assert.match(triage.stderr, /cover-letter\.md already exists; the Route has passed triage/);
});
