// The version State (employment route). Records which Version a Candidate is sent with as `version` in
// cover-letter.md, created with frontmatter only and an empty body (a CV-only application until proposal
// writes the Letter into it). The one stored Version is `general`; with --tailor it writes
// `version: tailored` and copies the general Version into the Candidate folder as version.md for the
// human to edit. An existing version.md is the human's edit and is never overwritten.
// CLI: node scripts/version.ts <candidate> [--tailor]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, writeArtifact, readVersion, candidateDir, versionFile, profile, Refusal, GENERAL_VERSION, type Profile, type Frontmatter } from "./lib.ts";

export const VERSIONS = ["general", "tailored"] as const;
export type VersionName = (typeof VERSIONS)[number];

// The text the intro Slot starts from: the summary of the Version sent. Returns { source, text }; text
// is null when the Version file is missing or invalid.
export function introSummary(dir: string, version: unknown, p: Profile = profile()): { source: string; text: string | null; errors: string[] } {
  const file = versionFile(dir, version);
  const source = version === "tailored" ? "the summary of version.md in the Candidate folder" : "the summary of resume/versions/general.md";
  const v = readVersion(file, p);
  return { source, text: v.errors.length ? null : v.summary, errors: v.errors };
}

export function setVersion(candidate: string | undefined, { tailor = false } = {}): string {
  const dir = candidateDir(candidate);
  if (!dir) throw new Refusal("autotriage: version refused. needs a Candidate folder name as argument.");
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job?.frontmatter) throw new Refusal(`autotriage: version refused. private/candidates/${candidate}/job.md is missing.`);
  const version: VersionName = tailor ? "tailored" : "general";
  const cover = readArtifact(path.join(dir, "cover-letter.md"));
  const { slug, date } = job.frontmatter as { slug: string; date: string };
  writeArtifact(path.join(dir, "cover-letter.md"), cover?.frontmatter ? { ...cover.frontmatter, version } : { slug, date, version }, cover ? cover.body : "");
  const out = [`version: ${version}`];
  const target = path.join(dir, "version.md");
  if (tailor) {
    if (fs.existsSync(target)) out.push(`private/candidates/${candidate}/version.md already exists; left as it is.`);
    else {
      if (!fs.existsSync(GENERAL_VERSION)) throw new Refusal("autotriage: version refused. no resume/versions/general.md to tailor from.");
      fs.copyFileSync(GENERAL_VERSION, target);
      out.push(`Created private/candidates/${candidate}/version.md from resume/versions/general.md. Tailor its selection and summary before the proposal.`);
    }
  } else if (fs.existsSync(target)) out.push(`Note: private/candidates/${candidate}/version.md exists but is not used; proposal reads it only on version: tailored.`);
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
