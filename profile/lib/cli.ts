// Profile command. `check` runs the Profile check on profile.md, voice.md and the Answers: every error
// printed, exit 1 when there is one. A Project file is read as written and never fails it.
// CLI: node lib/cli.ts check [--root <profile dir>]
import path from "node:path";
import { keywords, readProfile } from "./index.ts";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const args = process.argv.slice(2);
const root = flag(args, "--root");

if (args[0] === "check") {
  const profile = readProfile(root === undefined ? undefined : path.resolve(root));
  if (profile.errors.length) {
    console.error(`profile: ${profile.errors.length} error${profile.errors.length === 1 ? "" : "s"}\n  ${profile.errors.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`profile ok: ${profile.projects.length} Projects, ${profile.projects.reduce((n, p) => n + p.bullets.length, 0)} Bullets, ${keywords(profile).length} Keywords, ${profile.answers.length} Answers`);
} else {
  console.error("usage: cli.ts check [--root <profile dir>]");
  process.exit(2);
}
