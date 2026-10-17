// Route guard. Runs as the injected command at the top of each State's SKILL.md and from the
// PreToolUse hook. Exit 1 with the refusal on stderr when the State may not run; on success
// print the context the State starts from.
// CLI: node scripts/guard.mjs <state> [candidate]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, readLedger, readProjects, deriveEvidence, validate, validateArtifact, jobSchemaFor, letterFileFor, refuse, Refusal, candidateDir, listCandidates, PROFILE_DIR } from "./lib.mjs";
import { recompute } from "./verdict.mjs";
import { shippedWithoutEvidence } from "./skills.mjs";
import { introSummary } from "./version.mjs";

const ORDER = ["intake", "triage", "version", "proposal", "verify"];

function profileGate(state, level, out) {
  const profile = readArtifact(path.join(PROFILE_DIR, "profile.md"));
  if (!profile) refuse(state, "no Profile at data/profile/profile.md.", "Run /autotriage:setup first.");
  const errors = validate("profile", profile.frontmatter);
  if (errors.length) refuse(state, `data/profile/profile.md is invalid:\n  ${errors.join("\n  ")}`, "Run /autotriage:setup or fix the file by hand.");
  const { projects } = ledgerGate(state, out);
  if (level < 2) return profile;
  if (!projects.some((p) => !p.errors.length)) refuse(state, "no valid Project under data/projects/.", "Add at least one Project file (frontmatter per scripts/schemas/project.schema.json, Stories under Themes).");
  const voice = readArtifact(path.join(PROFILE_DIR, "voice.md"));
  if (!voice) refuse(state, "no data/profile/voice.md.", "Run /autotriage:setup.");
  const voiceErrors = validateArtifact("voice", voice);
  if (voiceErrors.length) refuse(state, `data/profile/voice.md is invalid:\n  ${voiceErrors.join("\n  ")}`, "Run /autotriage:setup or fix the file by hand.");
  return profile;
}

// The Skill ledger (catalogue/skills.md) is part of the Profile: triage records into it, so it must exist
// and validate. Evidence derives from the Projects' keywords: a term the ledger lacks is a refusal (the
// Project claims a Skill the Profile does not track); a `shipped` row with no Project in Evidence is a warning.
function ledgerGate(state, out = []) {
  const ledger = readLedger();
  if (!ledger) refuse(state, "no Skill ledger at data/profile/skills.md.", "Run /autotriage:setup first.");
  if (ledger.errors.length) refuse(state, `data/profile/skills.md is invalid:\n  ${ledger.errors.join("\n  ")}`, "Run /autotriage:setup or fix the file by hand.");
  const projects = readProjects();
  const { evidence, unknown } = deriveEvidence(ledger.frontmatter, projects);
  if (unknown.length) refuse(state, `keywords the ledger lacks:\n  ${unknown.map((u) => `data/projects/${u.slug}.md: ${u.term}`).join("\n  ")}`, "Add a row to data/profile/skills.md or spell the keyword as its ledger name.");
  const missing = shippedWithoutEvidence(ledger.frontmatter, evidence);
  if (missing.length) out.push(`Warning: shipped with no Project in Evidence (${missing.length}): ${missing.join(", ")}`);
  return { ledger, projects, evidence };
}

function candidateGate(state, candidate) {
  const dir = candidateDir(candidate);
  if (!dir) {
    const known = listCandidates();
    refuse(state, `needs a Candidate folder name as argument${candidate ? ` (got "${candidate}")` : ""}.`,
      known.length ? `Known Candidates:\n  ${known.join("\n  ")}\nUsage: /autotriage:${state} <YYYY-MM-DD-slug>` : "No Candidates yet. Run /autotriage:intake first.");
  }
  if (!fs.existsSync(dir)) refuse(state, `no Candidate folder data/candidates/${candidate}.`, "Run /autotriage:intake first.");
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job) refuse(state, `data/candidates/${candidate}/job.md is missing.`, "Run /autotriage:intake first.");
  const errors = validate("job", job.frontmatter);
  if (errors.length) refuse(state, `data/candidates/${candidate}/job.md is invalid against ${jobSchemaFor(job.frontmatter)}:\n  ${errors.join("\n  ")}`, "Run /autotriage:intake again or fix the file by hand.");
  return { dir, job, route: job.frontmatter.route };
}

export function guard(state, candidate) {
  const out = [];
  switch (state) {
    case "setup":
      break;
    case "intake": {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const known = listCandidates();
      out.push(`Today: ${today}`, known.length ? `Known Candidates:\n  ${known.join("\n  ")}` : "No Candidates yet.");
      break;
    }
    case "skills":
      ledgerGate(state, out);
      break;
    case "route":
      profileGate(state, 2, out);
      out.push("Profile gate passed.");
      break;
    case "triage": {
      profileGate(state, 1, out);
      const { dir, job, route } = candidateGate(state, candidate);
      const letterFile = letterFileFor(route);
      if (fs.existsSync(path.join(dir, letterFile))) refuse(state, `data/candidates/${candidate}/${letterFile} already exists; the Route has passed triage.`, "Run /autotriage:verify " + candidate + " or start a new Candidate.");
      const fm = job.frontmatter;
      out.push(`Candidate: data/candidates/${candidate}`, `Route: ${route}`, `Title: ${fm.title}`);
      if (route === "employment") out.push(`Company: ${fm.company ?? "unknown"}`, `Employment: ${fm.employment}, ${fm.remote}${fm.location ? `, ${fm.location}` : ""}`, `Salary: ${fm.salary ? JSON.stringify(fm.salary) : "not stated"}`, "Family: none on this route; skip the Family step.");
      else out.push(`Budget: ${JSON.stringify(fm.budget)}`);
      out.push(`Timezone: ${fm.timezone}`);
      if (job.frontmatter.verdict) out.push("Note: a verdict block already exists; triage will overwrite it.");
      if (job.frontmatter.recorded_skills?.length) out.push(`Note: the ledger already holds this Candidate for ${job.frontmatter.recorded_skills.join(", ")}; record is a no-op for those rows.`);
      break;
    }
    case "version": {
      const { dir, job, route } = candidateGate(state, candidate);
      if (route !== "employment") refuse(state, `data/candidates/${candidate} is on the ${route} route; the version State runs on employment only.`, `Run /autotriage:proposal ${candidate}.`);
      const decision = job.frontmatter.verdict?.decision;
      if (decision !== "go") refuse(state, decision === "no-go" ? "decision is no-go. Route ended." : "decision is not go.", decision === "no-go" ? null : `Run /autotriage:triage ${candidate} first.`);
      out.push(`Candidate: data/candidates/${candidate}`, `Title: ${job.frontmatter.title}`);
      const current = readArtifact(path.join(dir, "cover-letter.md"))?.frontmatter?.version;
      if (current) out.push(`Note: version is already ${current}; this run rewrites it and leaves the cover-letter.md body alone.`);
      break;
    }
    case "proposal": {
      const profile = profileGate(state, 2, out);
      const { dir, job } = candidateGate(state, candidate);
      const v = job.frontmatter.verdict;
      if (!v) refuse(state, `data/candidates/${candidate}/job.md has no verdict block.`, `Run /autotriage:triage ${candidate} first.`);
      const { mismatch } = recompute(candidate);
      if (mismatch.length) refuse(state, `stored verdict disagrees with the recomputation:\n  ${mismatch.join("\n  ")}`, `Run /autotriage:triage ${candidate} again.`);
      if (v.decision === "no-go") refuse(state, "decision is no-go. Route ended.", null);
      if (v.decision !== "go") refuse(state, "checkpoint pending: decision is not set.", `Answer go or no-go in /autotriage:triage ${candidate}, or set verdict.decision in job.md by hand.`);
      if (job.frontmatter.route === "employment") {
        const cover = readArtifact(path.join(dir, "cover-letter.md"));
        if (!cover) refuse(state, `data/candidates/${candidate}/cover-letter.md is missing.`, `Run /autotriage:version ${candidate} first.`);
        const errors = validateArtifact("cover-letter", cover);
        if (errors.length) refuse(state, `data/candidates/${candidate}/cover-letter.md is invalid:\n  ${errors.join("\n  ")}`, `Run /autotriage:version ${candidate} again.`);
        const version = cover.frontmatter.version;
        if (version === "tailored" && !fs.existsSync(path.join(dir, "version.md"))) refuse(state, `version is tailored but data/candidates/${candidate}/version.md is missing.`, `Run /autotriage:version ${candidate} --tailor, or /autotriage:version ${candidate} to send a stored Version.`);
        const intro = introSummary(profile.frontmatter, dir, version);
        if (!intro.text) refuse(state, `no summary for the intro Slot: ${intro.source} is missing.`, version === "tailored" ? `Put the summary paragraph after the contact line in data/candidates/${candidate}/version.md.` : `Add summaries.${version} to data/profile/profile.md.`);
        out.push(`Version: ${version}`, `Intro summary (${intro.source}): ${intro.text}`);
      }
      out.push(`Candidate: data/candidates/${candidate}`, `Route: ${job.frontmatter.route}`, job.frontmatter.route === "employment" ? "Family: none on this route" : `Family: ${v.family} (runner-up: ${v.family_runner_up ?? "none"})`, `Verdict: ${v.verdict}, Alert Level ${v.alert_level}, flags: ${(v.flags ?? []).join(", ") || "none"}`, `Scores: skill_fit ${v.skill_fit}, interest_fit ${v.interest_fit}, value ${v.value}`);
      break;
    }
    case "verify": {
      profileGate(state, 2, out);
      const { dir, job, route } = candidateGate(state, candidate);
      if (job.frontmatter.verdict?.decision !== "go") refuse(state, "decision is not go.", `Run /autotriage:triage ${candidate} first.`);
      const letterFile = letterFileFor(route);
      const letter = readArtifact(path.join(dir, letterFile));
      if (!letter) refuse(state, `data/candidates/${candidate}/${letterFile} is missing.`, `Run /autotriage:proposal ${candidate} first.`);
      const errors = validateArtifact(letterFile.replace(/\.md$/, ""), letter);
      if (errors.length) refuse(state, `data/candidates/${candidate}/${letterFile} is invalid:\n  ${errors.join("\n  ")}`, `Run /autotriage:proposal ${candidate} again.`);
      out.push(`Candidate: data/candidates/${candidate}`, `Route: ${route}`, `Letter: ${letterFile}`, ...(route === "employment" ? ["Template: letter-employment", `Version: ${letter.frontmatter.version}`] : [`Family: ${letter.frontmatter.family}`]));
      break;
    }
    default:
      refuse(state || "(none)", `unknown State. Known: setup, skills, route, ${ORDER.join(", ")}.`, null);
  }
  return out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [state, candidate] = process.argv.slice(2);
  try {
    const ctx = guard(state, candidate || undefined);
    if (ctx) console.log(ctx);
  } catch (e) {
    if (e instanceof Refusal) { console.error(e.message); process.exit(1); }
    console.error(`autotriage: guard crashed: ${e.stack}`); process.exit(1);
  }
}
