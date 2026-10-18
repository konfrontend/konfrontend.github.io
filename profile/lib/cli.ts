// Profile commands. `build` writes the generated Master and Skill ledger beside the authored files;
// `check` prints every Profile error and exits 1 when there is one.
// CLI: node lib/cli.ts build|check [--root <profile dir>] [--candidates <dir>]
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_ROOT, readProfile, readCandidateRequirements, ledger, renderLedger, master } from "./index.ts";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const args = process.argv.slice(2);
const cmd = args[0];
const root = path.resolve(flag(args, "--root") ?? DEFAULT_ROOT);
const candidates = path.resolve(flag(args, "--candidates") ?? path.join(root, "..", "private", "candidates"));
const profile = readProfile(root);

if (cmd === "check" || cmd === "build") {
  if (profile.errors.length) {
    console.error(`profile: ${profile.errors.length} error${profile.errors.length === 1 ? "" : "s"}\n  ${profile.errors.join("\n  ")}`);
    process.exit(1);
  }
  const { requirements, warnings } = readCandidateRequirements(candidates);
  for (const w of warnings) console.error(`warning: ${w}`);
  if (cmd === "build") {
    fs.writeFileSync(profile.files.master, master(profile));
    fs.writeFileSync(profile.files.ledger, renderLedger(ledger(profile, requirements)));
    console.log(`Wrote ${path.relative(process.cwd(), profile.files.master)} and ${path.relative(process.cwd(), profile.files.ledger)} (${profile.projects.length} Projects, ${requirements.length} Candidates)`);
  } else {
    console.log(`profile ok: ${profile.projects.length} Projects, ${profile.projects.reduce((n, p) => n + p.stories.length, 0)} Stories, ${profile.answers.length} Answers`);
  }
} else {
  console.error("usage: cli.ts build|check [--root <profile dir>] [--candidates <dir>]");
  process.exit(2);
}
