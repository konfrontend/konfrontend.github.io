// Route guard: the transition table. Runs as the injected command at the top of each State's SKILL.md
// and from the PreToolUse hook. The CLI always exits 0 and prints either the context the State starts
// from or a refusal line (`autotriage: <state> refused. ...`), so the model and the human read it either
// way; the hook turns the same Refusal into a deny.
// CLI: node scripts/guard.ts <state> [candidate]
import fs from "node:fs";
import path from "node:path";
import { readArtifact, validate, validateArtifact, jobSchemaFor, letterFileFor, refuse, Refusal, candidateDir, listCandidates, profile, type Profile, type Artifact } from "./lib.ts";
import { recompute } from "./verdict.ts";
import { introSummary } from "./version.ts";

export const STATES = ["route", "intake", "triage", "version", "proposal", "verify"] as const;
export type State = (typeof STATES)[number];
export const ORDER: State[] = ["intake", "triage", "version", "proposal", "verify"];

interface Ctx { state: State; candidate?: string; out: string[] }
type Guard = (ctx: Ctx) => void;

// Level 1: profile.md valid (triage reads it). Level 2: every Profile file valid and one Project at
// least (the Letter States cite Stories and the voice).
function profileGate(state: State, level: 1 | 2): Profile {
  const p = profile();
  const errors = level === 1 ? p.errors.filter((e) => e.startsWith("profile.md")) : p.errors;
  if (errors.length) refuse(state, `the Profile has ${errors.length} error${errors.length === 1 ? "" : "s"}:\n  ${errors.join("\n  ")}`, "Fix the file by hand.");
  if (level === 2 && !p.projects.length) refuse(state, "no Project file under profile/projects/.", "Add at least one Project file (profile/schemas/project.schema.json, Stories with keys).");
  return p;
}

interface Gate { dir: string; job: Artifact; route: string; fm: Record<string, any> }

function candidateGate(state: State, candidate?: string): Gate {
  const dir = candidateDir(candidate);
  if (!dir) {
    const known = listCandidates();
    refuse(state, `needs a Candidate folder name as argument${candidate ? ` (got "${candidate}")` : ""}.`,
      known.length ? `Known Candidates:\n  ${known.join("\n  ")}\nUsage: /route-${state} <YYYY-MM-DD-slug>` : "No Candidates yet. Run /route-intake first.");
  }
  if (!fs.existsSync(dir)) refuse(state, `no Candidate folder private/candidates/${candidate}.`, "Run /route-intake first.");
  const job = readArtifact(path.join(dir, "job.md"));
  if (!job) refuse(state, `private/candidates/${candidate}/job.md is missing.`, "Run /route-intake first.");
  const errors = validate("job", job.frontmatter);
  if (errors.length) refuse(state, `private/candidates/${candidate}/job.md is invalid against ${jobSchemaFor(job.frontmatter)}:\n  ${errors.join("\n  ")}`, "Run /route-intake again or fix the file by hand.");
  const fm = job.frontmatter as Record<string, any>;
  return { dir, job, route: String(fm.route), fm };
}

function decisionGate(state: State, candidate: string, fm: Record<string, any>): void {
  const decision = fm.verdict?.decision;
  if (decision === "go") return;
  if (decision === "no-go") refuse(state, "decision is no-go. Route ended.", null);
  refuse(state, fm.verdict ? "checkpoint pending: decision is not set." : "decision is not go.", fm.verdict ? `Answer go or no-go in /route-triage ${candidate}, or set verdict.decision in job.md by hand.` : `Run /route-triage ${candidate} first.`);
}

const GUARDS: Record<State, Guard> = {
  intake: ({ out }) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const known = listCandidates();
    out.push(`Today: ${today}`, known.length ? `Known Candidates:\n  ${known.join("\n  ")}` : "No Candidates yet.");
  },
  route: ({ state, out }) => {
    profileGate(state, 2);
    out.push("Profile gate passed.");
  },
  triage: ({ state, candidate, out }) => {
    profileGate(state, 1);
    const { dir, route, fm } = candidateGate(state, candidate);
    const letterFile = letterFileFor(route);
    if (fs.existsSync(path.join(dir, letterFile))) refuse(state, `private/candidates/${candidate}/${letterFile} already exists; the Route has passed triage.`, `Run /route-verify ${candidate} or start a new Candidate.`);
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, `Title: ${fm.title}`);
    if (route === "employment") out.push(`Company: ${fm.company ?? "unknown"}`, `Employment: ${fm.employment}, ${fm.remote}${fm.location ? `, ${fm.location}` : ""}`, `Salary: ${fm.salary ? JSON.stringify(fm.salary) : "not stated"}`, "Family: none on this route; skip the Family step.");
    else out.push(`Budget: ${JSON.stringify(fm.budget)}`);
    out.push(`Timezone: ${fm.timezone}`);
    if (fm.verdict) out.push("Note: a verdict block already exists; triage will overwrite it.");
    if (fm.requirements?.length) out.push(`Note: requirements already recorded (${fm.requirements.length}); triage rewrites them.`);
  },
  version: ({ state, candidate, out }) => {
    const { dir, route, fm } = candidateGate(state, candidate);
    if (route !== "employment") refuse(state, `private/candidates/${candidate} is on the ${route} route; the version State runs on employment only.`, `Run /route-proposal ${candidate}.`);
    decisionGate(state, candidate!, fm);
    out.push(`Candidate: private/candidates/${candidate}`, `Title: ${fm.title}`);
    const current = readArtifact(path.join(dir, "cover-letter.md"))?.frontmatter?.version;
    if (current) out.push(`Note: version is already ${current}; this run rewrites it and leaves the cover-letter.md body alone.`);
  },
  proposal: ({ state, candidate, out }) => {
    const p = profileGate(state, 2);
    const { dir, route, fm } = candidateGate(state, candidate);
    const v = fm.verdict;
    if (!v) refuse(state, `private/candidates/${candidate}/job.md has no verdict block.`, `Run /route-triage ${candidate} first.`);
    const { mismatch } = recompute(candidate!);
    if (mismatch.length) refuse(state, `stored verdict disagrees with the recomputation:\n  ${mismatch.join("\n  ")}`, `Run /route-triage ${candidate} again.`);
    decisionGate(state, candidate!, fm);
    if (route === "employment") {
      const cover = readArtifact(path.join(dir, "cover-letter.md"));
      if (!cover) refuse(state, `private/candidates/${candidate}/cover-letter.md is missing.`, `Run /route-version ${candidate} first.`);
      const errors = validateArtifact("cover-letter", cover);
      if (errors.length) refuse(state, `private/candidates/${candidate}/cover-letter.md is invalid:\n  ${errors.join("\n  ")}`, `Run /route-version ${candidate} again.`);
      const version = cover.frontmatter!.version;
      if (version === "tailored" && !fs.existsSync(path.join(dir, "version.md"))) refuse(state, `version is tailored but private/candidates/${candidate}/version.md is missing.`, `Run /route-version ${candidate} --tailor, or /route-version ${candidate} to send the general Version.`);
      const intro = introSummary(dir, version, p);
      if (intro.text === null) refuse(state, `the Version sent does not read: ${intro.errors.join("; ")}`, version === "tailored" ? `Fix private/candidates/${candidate}/version.md.` : "Fix resume/versions/general.md.");
      out.push(`Version: ${version}`, `Intro summary (${intro.source}): ${intro.text}`);
    }
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, route === "employment" ? "Family: none on this route" : `Family: ${v.family} (runner-up: ${v.family_runner_up ?? "none"})`, `Verdict: ${v.verdict}, Alert Level ${v.alert_level}, flags: ${(v.flags ?? []).join(", ") || "none"}`, `Scores: skill_fit ${v.skill_fit}, interest_fit ${v.interest_fit}, value ${v.value}`);
  },
  verify: ({ state, candidate, out }) => {
    profileGate(state, 2);
    const { dir, route, fm } = candidateGate(state, candidate);
    if (fm.verdict?.decision !== "go") refuse(state, "decision is not go.", `Run /route-triage ${candidate} first.`);
    const letterFile = letterFileFor(route);
    const letter = readArtifact(path.join(dir, letterFile));
    if (!letter) refuse(state, `private/candidates/${candidate}/${letterFile} is missing.`, `Run /route-proposal ${candidate} first.`);
    const errors = validateArtifact(letterFile.replace(/\.md$/, ""), letter);
    if (errors.length) refuse(state, `private/candidates/${candidate}/${letterFile} is invalid:\n  ${errors.join("\n  ")}`, `Run /route-proposal ${candidate} again.`);
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, `Letter: ${letterFile}`, ...(route === "employment" ? ["Template: letter-employment", `Version: ${letter.frontmatter!.version}`] : [`Family: ${letter.frontmatter!.family}`]));
  },
};

export function isState(s: string): s is State {
  return (STATES as readonly string[]).includes(s);
}

// The context a State starts from, or a Refusal.
export function guard(state: string, candidate?: string): string {
  if (!isState(state)) refuse(state || "(none)", `unknown State. Known: ${STATES.join(", ")}.`, null);
  const ctx: Ctx = { state, candidate, out: [] };
  GUARDS[state](ctx);
  return ctx.out.join("\n");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [state, candidate] = process.argv.slice(2);
  try {
    const ctx = guard(state ?? "", candidate || undefined);
    if (ctx) console.log(ctx);
  } catch (e) {
    console.log(e instanceof Refusal ? e.message : `autotriage: ${state} refused. guard crashed: ${(e as Error).stack}`);
  }
}
