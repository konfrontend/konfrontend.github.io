// Profile commands. `check` runs the Profile check: every error printed, exit 1 when there is one,
// warnings printed either way. `build` checks, then writes the generated skills.md.
// CLI: node lib/cli.ts build|check [--root <profile dir>]
import fs from "node:fs";
import path from "node:path";
import { readProfile, renderSkills, repoRoot, skills } from "./index.ts";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const args = process.argv.slice(2);
const cmd = args[0];
const root = flag(args, "--root");

if (cmd === "check" || cmd === "build") {
  const profile = readProfile(root === undefined ? undefined : path.resolve(root));
  for (const w of profile.warnings) console.error(`warning: ${w}`);
  if (profile.errors.length) {
    console.error(`profile: ${profile.errors.length} error${profile.errors.length === 1 ? "" : "s"}\n  ${profile.errors.join("\n  ")}`);
    process.exit(1);
  }
  const count = `${profile.projects.length} Projects, ${profile.projects.reduce((n, p) => n + p.bullets.length, 0)} Bullets, ${skills(profile).length} Skills, ${profile.answers.length} Answers`;
  if (cmd === "build") {
    fs.writeFileSync(profile.files.skills, renderSkills(profile));
    console.log(`Wrote ${path.relative(repoRoot(), profile.files.skills)} (${count})`);
  } else {
    console.log(`profile ok: ${count}`);
  }
} else {
  console.error("usage: cli.ts build|check [--root <profile dir>]");
  process.exit(2);
}
