// Test fixture: a temp project with a valid Profile, the general Version, and the Candidates a case
// adds. Scripts run against it through CLAUDE_PROJECT_DIR.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

export const run = (root: string, script: string, ...args: string[]) =>
  spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

export const hook = (root: string, script: string, input: unknown) =>
  spawnSync(process.execPath, [path.join(SCRIPTS, "hooks", script)], { encoding: "utf8", input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

export const PROFILE = `---
identity: { name: Kon, timezone: Europe/Madrid, constraints: [] }
contact: { location: "Gijon, Spain (UTC+2)", email: kon@example.com, github: https://github.com/kon }
resume_order: [acme]
terms: { rate: 60, rate_floor: 40 }
---
`;
export const VOICE = `---
language: en-US
greeting: { freelance: "Hi,", employment: "Hello," }
sign_off: Kon
---
`;
export const project = (keywords: string[], body = "## Bullets\n\n- [rbac-admin] Built the RBAC admin and the SAML login.\n\n## Notes\n\n- Collaborator and admin roles.\n") => `---
name: Acme
url: https://acme.example
role: Full Stack Developer
employment: contract
start: 2021-02
naming: public
description: B2B dashboard.
keywords: [${keywords.join(", ")}]
---
${body}`;
export const SUMMARY = "10+ years as a full stack developer in TypeScript and React.";
// A Version in the prose shape resume/scripts/generate.ts writes for the fixture Profile; `bullets` maps a
// Project slug to its `- [key] text` lines.
export const version = (summary = SUMMARY, skills = ["Core: React, TypeScript"], bullets: Record<string, string[]> = { acme: ["[rbac-admin] Built the RBAC admin and the SAML login."] }) => `# Kon

Full Stack Developer

Gijon, Spain (UTC+2) • [kon@example.com](mailto:kon@example.com) • [github.com/kon](https://github.com/kon)

${summary}

## Skills

${skills.map((s) => `- ${s}`).join("\n")}

## Professional Experience

${Object.entries(bullets).map(([slug, lines]) => `### [${slug}] [Acme](https://acme.example) – B2B dashboard.\n\nFull Stack Developer (Contract) | Feb 2021 – Present\n\n${lines.map((l) => `- ${l}`).join("\n")}`).join("\n\n")}
`;
export const verdict = (decision: string, extra = "") => `verdict:
  flags: []
  skill_fit: 4
  interest_fit: 3
  value: 3
  alert_level: 1
  hard_stops: []
  verdict: go
  decision: ${decision}
${extra}`;
export const employmentJob = ({ title = "Senior Frontend Developer", decision = "go" as string | "absent", requirements = "" } = {}) => `---
slug: acme-frontend
title: "${title}"
date: 2026-10-17
route: employment
company: Acme
employment: full-time
remote: remote
timezone: Europe/Madrid
${requirements}${decision === "absent" ? "" : verdict(decision)}---
Posting text.
`;
export const freelanceJob = ({ decision = "absent" as string } = {}) => `---
slug: acme-fix
title: Fix the admin
date: 2026-10-16
route: freelance
timezone: America/New_York
budget: { type: hourly, min: 30, max: 80 }
${decision === "absent" ? "" : verdict(decision, "  family: build\n  family_runner_up: null\n")}---
Posting text.
`;
export const cover = (v: string | null, body = "") => `---\nslug: acme-frontend\ndate: 2026-10-17\n${v ? `version: ${v}\n` : ""}---\n${body}`;

export interface Options { profile?: string; voice?: string; project?: string; version?: string; candidates?: Record<string, Record<string, string>> }

export function fixture({ profile = PROFILE, voice = VOICE, project: proj = project(["React", "TypeScript", "Postgres"]), version: ver = version(), candidates = {} }: Options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "autotriage-"));
  fs.mkdirSync(path.join(root, "profile", "projects"), { recursive: true });
  fs.mkdirSync(path.join(root, "resume", "versions"), { recursive: true });
  fs.writeFileSync(path.join(root, "profile", "profile.md"), profile);
  fs.writeFileSync(path.join(root, "profile", "voice.md"), voice);
  fs.writeFileSync(path.join(root, "profile", "projects", "acme.md"), proj);
  fs.writeFileSync(path.join(root, "resume", "versions", "general.md"), ver);
  for (const [folder, files] of Object.entries(candidates)) {
    const dir = path.join(root, "private", "candidates", folder);
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  }
  return { root, candidate: (folder: string) => path.join(root, "private", "candidates", folder) };
}
