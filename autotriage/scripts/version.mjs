// The version State (employment route). Picks the Version a Candidate is sent with by the posting's
// role title and records it as `version` in cover-cover-letter.md, created with frontmatter only and an empty
// body (a CV-only application until proposal writes the Letter into it); with --tailor it writes
// `version: tailored` and copies the picked Version into the Candidate folder as version.md for the human to edit.
// CLI: node scripts/version.mjs <candidate> [--tailor]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, writeArtifact, splitFrontmatter, candidateDir, Refusal, VERSIONS_DIR } from "./lib.mjs";

// frontend, front-end, React, Vue, UI in the role title pick `frontend`; anything else `general`.
export function pickVersion(title) {
  return /\b(front[- ]?end|react|vue|ui)\b/i.test(String(title ?? "")) ? "frontend" : "general";
}

// The summary of a Version's source: the paragraph after the contact line (docs/format-rules.md).
// The contact line is the first line carrying the email. Returns null when there is none.
export function summaryParagraph(text) {
  const lines = splitFrontmatter(String(text ?? "")).body.split(/\r?\n/);
  const contact = lines.findIndex((l) => /@|mailto:/.test(l));
  if (contact < 0) return null;
  const rest = lines.slice(contact + 1);
  const start = rest.findIndex((l) => l.trim());
  if (start < 0 || /^#/.test(rest[start])) return null;
  const end = rest.findIndex((l, i) => i > start && !l.trim());
  return rest.slice(start, end < 0 ? undefined : end).join(" ").trim();
}

// The text the intro Slot starts from: the Profile's summary for the picked Version, or on `tailored`
// the summary paragraph of the Candidate's version.md. Returns { source, text }; text is null when absent.
export function introSummary(profile, dir, version) {
  if (version === "tailored") {
    const file = path.join(dir, "version.md");
    return { source: "the paragraph after the contact line in version.md", text: fs.existsSync(file) ? summaryParagraph(fs.readFileSync(file, "utf8")) : null };
  }
  return { source: `summaries.${version} in data/profile/profile.md`, text: profile?.summaries?.[version] ?? null };
}

// Writes `version` into cover-cover-letter.md: a new file gets `slug` and `date` from job.md and an empty body;
// a re-run rewrites `version` and leaves the body alone. On tailor also creates version.md from the
// picked Version. An existing version.md is the human's edit and is never overwritten.
export function setVersion(candidate, { tailor = false } = {}) {
  const dir = candidateDir(candidate);
  const job = readArtifact(path.join(dir, "job.md"));
  const picked = pickVersion(job.frontmatter.title);
  const version = tailor ? "tailored" : picked;
  const cover = readArtifact(path.join(dir, "cover-letter.md"));
  const { slug, date } = job.frontmatter;
  writeArtifact(path.join(dir, "cover-letter.md"), cover ? { ...cover.frontmatter, version } : { slug, date, version }, cover ? cover.body : "");
  const out = [`version: ${version}${tailor ? ` (from ${picked})` : ""}, picked by the title "${job.frontmatter.title}"`];
  const target = path.join(dir, "version.md");
  if (tailor) {
    if (fs.existsSync(target)) out.push(`data/candidates/${candidate}/version.md already exists; left as it is.`);
    else {
      const source = path.join(VERSIONS_DIR, `${picked}.md`);
      if (!fs.existsSync(source)) throw new Refusal(`autotriage: version refused. no versions/${picked}.md to tailor from.`);
      fs.copyFileSync(source, target);
      out.push(`Created data/candidates/${candidate}/version.md from versions/${picked}.md. Tailor it before the proposal.`);
    }
  } else if (fs.existsSync(target)) out.push(`Note: data/candidates/${candidate}/version.md exists but is not used; proposal reads it only on version: tailored.`);
  out.push(`Next: /autotriage:proposal ${candidate}, or stop here to send the Version without a Letter`);
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const candidate = args.find((a) => !a.startsWith("--"));
  try {
    console.log(setVersion(candidate, { tailor: args.includes("--tailor") }));
  } catch (e) {
    if (e instanceof Refusal) { console.error(e.message); process.exit(1); }
    console.error(`autotriage: version.mjs failed: ${e.stack}`); process.exit(1);
  }
}
