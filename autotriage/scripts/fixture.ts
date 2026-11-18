// Test fixture: a temp project with a valid Profile. Scripts run against it through CLAUDE_PROJECT_DIR.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

export const pipe = (root: string, input: string, script: string, ...args: string[]) =>
  spawnSync(process.execPath, [path.join(SCRIPTS, script), ...args], { encoding: "utf8", input, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
export const run = (root: string, script: string, ...args: string[]) => pipe(root, "", script, ...args);

export const hook = (root: string, script: string, input: unknown) =>
  spawnSync(process.execPath, [path.join(SCRIPTS, "hooks", script)], { encoding: "utf8", input: JSON.stringify(input), env: { ...process.env, CLAUDE_PROJECT_DIR: root } });

export const PROFILE = `---
identity: { name: Kon, timezone: Europe/Madrid, constraints: [] }
contact: { email: kon@example.com, github: https://github.com/kon }
terms: { rate: 60 }
---
`;
export const VOICE = `---
language: en-US
greeting: { freelance: "Hi,", employment: "Hello," }
sign_off: Kon
banned_phrases: ["I'm excited"]
---
`;
export const project = (keywords: string[], body = "### RBAC Admin\nBuilt the RBAC admin and the SAML login.\n") => `---
url: https://acme.example
role: Full Stack Developer
employment: contract
start: 2021-02
---
# Acme

## Description
B2B dashboard.

## Keywords
${keywords.map((k) => `\`${k}\``).join(", ")}

***

${body}
***

## Notes
- Collaborator and admin roles.
`;
export interface Options { profile?: string; voice?: string; project?: string }

export function fixture({ profile = PROFILE, voice = VOICE, project: proj = project(["React", "TypeScript", "Postgres"]) }: Options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "autotriage-"));
  fs.mkdirSync(path.join(root, "profile", "projects"), { recursive: true });
  fs.writeFileSync(path.join(root, "profile", "profile.md"), profile);
  fs.writeFileSync(path.join(root, "profile", "voice.md"), voice);
  fs.writeFileSync(path.join(root, "profile", "projects", "acme.md"), proj);
  return { root };
}
