// The prose Version: assemble writes it from a Plan, readVersion reads it back by position, the cut keeps the
// Plan's rank, and the checks hold a Variant to its Story or its canonical Bullet. Chrome is not needed:
// the page count is stubbed where a test cuts. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readProfile } from "../../profile/lib/index.ts";
import { assemble, readVersion, checkVersion, planOf, versionSkillTerms, type Plan } from "./version.ts";
import { bulletLines } from "./render.ts";

const PROFILE = `---
identity: { name: Kon, timezone: Europe/Madrid, constraints: [] }
contact: { location: "Gijon, Spain (UTC+2)", email: kon@example.com, github: https://github.com/kon }
resume_order: [acme, side]
terms: { rate: 60, rate_floor: 40 }
---
`;
const VOICE = "---\nlanguage: en-US\ngreeting: { freelance: \"Hi,\", employment: \"Hello,\" }\nsign_off: Kon\n---\n";
const ACME = `---
name: Acme
url: https://acme.example
role: Full Stack Developer
employment: contract
start: 2021-02
naming: public
description: B2B dashboard.
keywords: [React, TypeScript, Postgres, SAML]
---
## Stories

### The admin

Acme needed an admin for 12 tenants. Built it in React over Postgres with 40 tests; tenants onboarded in 2 days.

- [admin] Built the React admin for 12 tenants over Postgres, covered by 40 tests.

## Bullets

- [saml] Built the SAML login in TypeScript, cutting support tickets by 30%.
`;
const SIDE = `---
name: side
role: Author
employment: independent
start: 2024-01
end: 2024-06
naming: public
description: A side project.
keywords: [Vue.js]
---
## Bullets

- [site] Built the site in Vue.js.
`;

function profileAt() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
  fs.mkdirSync(path.join(root, "projects"));
  fs.writeFileSync(path.join(root, "profile.md"), PROFILE);
  fs.writeFileSync(path.join(root, "voice.md"), VOICE);
  fs.writeFileSync(path.join(root, "projects", "acme.md"), ACME);
  fs.writeFileSync(path.join(root, "projects", "side.md"), SIDE);
  const profile = readProfile(root);
  assert.deepEqual(profile.errors, []);
  return { root, profile };
}

const plan = (bullets: Plan["bullets"], summary = "Full stack developer with 10+ years in TypeScript and React."): Plan => ({ title: "Full Stack Developer", summary, skills: ["Core: React, TypeScript", "Data: Postgres"], bullets });
const write = (root: string, name: string, md: string) => { const f = path.join(root, name); fs.writeFileSync(f, md); return f; };

test("assemble writes the Version in resume order with Bullets in Plan rank; readVersion reads it back", () => {
  const { root, profile } = profileAt();
  const p = plan([{ project: "side", key: "site" }, { project: "acme", key: "saml" }, { project: "acme", key: "admin" }]);
  const md = assemble(p, profile);
  assert.match(md, /^# Kon\n\nFull Stack Developer\n\nGijon, Spain \(UTC\+2\) • \[kon@example.com\]\(mailto:kon@example.com\) • \[github.com\/kon\]\(https:\/\/github.com\/kon\)\n\nFull stack developer/);
  assert.match(md, /## Skills\n\n- Core: React, TypeScript\n- Data: Postgres\n\n## Professional Experience\n\n### \[acme\] \[Acme\]\(https:\/\/acme.example\) – B2B dashboard.\n\nFull Stack Developer \(Contract\) \| Feb 2021 – Present\n\n- \[saml\] Built the SAML login[^\n]*\n- \[admin\] Built the React admin/);
  assert.match(md, /## Projects\n\n### \[side\] side – A side project.\n\nAuthor \| Jan 2024 – Jun 2024\n\n- \[site\] Built the site in Vue.js.\n$/);
  const v = readVersion(write(root, "general.md", md), profile);
  assert.deepEqual(v.errors, []);
  assert.equal(v.title, "Full Stack Developer");
  assert.equal(v.summary, p.summary);
  assert.deepEqual(versionSkillTerms(v.skills), ["React", "TypeScript", "Postgres"]);
  assert.deepEqual(v.bullets.map((b) => `${b.project}/${b.key}`), ["acme/saml", "acme/admin", "side/site"]);
  assert.ok(v.bullets.every((b) => !b.variant));
  assert.deepEqual(planOf(v).bullets, [{ project: "acme", key: "saml" }, { project: "acme", key: "admin" }, { project: "side", key: "site" }], "the Plan a base Version carries has no text");
  assert.ok(checkVersion(v, md, profile).every((c) => c.level === "PASS"), JSON.stringify(checkVersion(v, md, profile).filter((c) => c.level !== "PASS")));
});

test("readVersion refuses a Bullet or a Project the Profile lacks, a Skills term that is no Keyword, and the old frontmatter shape", () => {
  const { root, profile } = profileAt();
  const md = assemble(plan([{ project: "acme", key: "admin" }]), profile);
  const bad = readVersion(write(root, "general.md", md.replace("[admin]", "[nope]").replace("[acme]", "[zeta]").replace("Data: Postgres", "Data: Oracle")), profile);
  assert.deepEqual(bad.errors, ["general.md: no Project file for zeta", "general.md: Skills term is not a Project keyword: Oracle"]);
  const key = readVersion(write(root, "general.md", md.replace("[admin]", "[nope]")), profile);
  assert.deepEqual(key.errors, ["general.md: acme has no Bullet [nope]"]);
  assert.match(readVersion(write(root, "general.md", "---\ntitle: X\n---\n"), profile).errors[0], /has frontmatter/);
  assert.match(readVersion(path.join(root, "none.md"), profile).errors[0], /missing/);
});

test("checks: a hand edit to a sourced line fails source; a Variant fails in a base Version and is held to its Story or canonical Bullet in a tailored one", () => {
  const { root, profile } = profileAt();
  const base = assemble(plan([{ project: "acme", key: "admin" }]), profile);
  const edited = base.replace("B2B dashboard.", "B2C dashboard.");
  const r = checkVersion(readVersion(write(root, "general.md", edited), profile), edited, profile);
  assert.match(r.find((c) => c.name === "source")!.detail, /B2C dashboard/);
  assert.equal(r.find((c) => c.name === "source")!.level, "FAIL");

  const variant = assemble(plan([{ project: "acme", key: "admin", text: "Onboarded 12 tenants in 2 days on a React admin over Postgres." }]), profile);
  const inBase = checkVersion(readVersion(write(root, "general.md", variant), profile), variant, profile);
  assert.equal(inBase.find((c) => c.name === "variants")!.level, "FAIL");
  assert.equal(inBase.find((c) => c.name === "source")!.level, "PASS", "a Variant is not a source mismatch");

  const tailored = checkVersion(readVersion(write(root, "version.md", variant), profile), variant, profile);
  assert.equal(tailored.find((c) => c.name === "variant numbers")!.level, "PASS", "12 and 2 are in the Story");
  assert.equal(tailored.find((c) => c.name === "variant keywords")!.level, "PASS");
  assert.equal(tailored.find((c) => c.name === "variant claims")!.level, "WARN");

  const invented = assemble(plan([{ project: "acme", key: "admin", text: "Built the React admin for 50 customers." }, { project: "acme", key: "saml", text: "Built the SAML login in React, cutting support tickets by 30%." }]), profile);
  const bad = checkVersion(readVersion(write(root, "version.md", invented), profile), invented, profile);
  assert.equal(bad.find((c) => c.name === "variant numbers")!.detail, "acme/admin", "50 is in no Story line");
  assert.equal(bad.find((c) => c.name === "variant keywords")!.detail, "acme/saml", "React is not in the canonical Bullet of a Story-less Bullet");
});

test("checks: Skills lines and the summary", () => {
  const { root, profile } = profileAt();
  const p = plan([{ project: "acme", key: "admin" }], "Seeking a role; he is a results-driven engineer with 10+ years.");
  p.skills = ["Core: React, TypeScript, react", "Expert: Postgres"];
  const md = assemble(p, profile);
  const r = Object.fromEntries(checkVersion(readVersion(write(root, "general.md", md), profile), md, profile).map((c) => [c.name, c]));
  assert.equal(r["skills duplicates"].detail, "react");
  assert.equal(r["skills labels"].level, "FAIL");
  assert.equal(r["summary role noun"].level, "WARN");
  assert.match(r["summary voice"].detail, /objective or trait filler; third person/);
});

test("bulletLines counts the layout lines each Bullet took", () => {
  const layout = ["Kon", "", "  • Built the React admin for 12 tenants over", "    Postgres, covered by 40 tests.", "  • Built the SAML login in TypeScript, cutting support tickets by 30%.", ""];
  assert.deepEqual(bulletLines(layout, ["Built the React admin for 12 tenants over Postgres, covered by 40 tests.", "Built the SAML login in TypeScript, cutting support tickets by 30%.", "Not on the page."]), [2, 1, 0]);
});
