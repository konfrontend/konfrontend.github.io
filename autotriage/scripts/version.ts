// The version State (employment route). The Candidate is sent with the general Version, or with its own
// version.md when the tailoring skill `resume-version <candidate>` wrote one: the script never writes a
// Version. It writes letter.md empty when the folder has none (a resume-only application until proposal
// fills it) and leaves an existing letter.md alone. With --tailor it names the skill to invoke next.
// CLI: node scripts/version.ts <candidate> [--tailor]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, readVersion, candidateDir, versionFile, versionName, profile, Refusal, LETTER_FILE, VERSION_FILE, type Profile } from "./lib.ts";

// The text the intro Slot starts from: the summary of the Version sent. Returns { source, text }; text
// is null when the Version file is missing or invalid.
export function introSummary(dir: string, p: Profile = profile()): { source: string; text: string | null; errors: string[] } {
  const source = versionName(dir) === "tailored" ? "the summary of version.md in the Candidate folder" : "the summary of resume/versions/general.md";
  const v = readVersion(versionFile(dir), p);
  return { source, text: v.errors.length ? null : v.summary, errors: v.errors };
}

export function setVersion(candidate: string | undefined, { tailor = false } = {}): string {
  const dir = candidateDir(candidate);
  if (!dir) throw new Refusal("autotriage: version refused. needs a Candidate folder name as argument.");
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job?.frontmatter) throw new Refusal(`autotriage: version refused. private/candidates/${candidate}/job.md is missing.`);
  const out: string[] = [];
  const letter = path.join(dir, LETTER_FILE);
  if (fs.existsSync(letter)) out.push(`private/candidates/${candidate}/letter.md exists; left as it is.`);
  else { fs.writeFileSync(letter, ""); out.push(`Wrote private/candidates/${candidate}/letter.md, empty: a resume-only application until proposal fills it.`); }
  const own = path.join(dir, VERSION_FILE);
  if (tailor && !fs.existsSync(own)) out.push(`Version: tailored, not yet generated. Invoke resume-version ${candidate}; it writes private/candidates/${candidate}/version.md from the Project files for this Job.`);
  else out.push(`Version: ${versionName(dir)}${fs.existsSync(own) ? ` (private/candidates/${candidate}/version.md)` : " (resume/versions/general.md)"}`);
  out.push(`Next: /route-proposal ${candidate}, or stop here to send the Version without a Letter`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const candidate = args.find((a) => !a.startsWith("--"));
  try {
    console.log(setVersion(candidate, { tailor: args.includes("--tailor") }));
  } catch (e) {
    if (e instanceof Refusal) { console.log(e.message); process.exit(0); }
    console.error(`autotriage: version.ts failed: ${(e as Error).stack}`); process.exit(1);
  }
}
