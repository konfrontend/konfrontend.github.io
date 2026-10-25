// Route guard: the transition table. Runs as the injected command at the top of each State's SKILL.md
// and from the PreToolUse hook. The CLI always exits 0 and prints either the context the State starts
// from or a refusal line (`autotriage: <state> refused. ...`), so the model and the human read it either
// way; the hook turns the same Refusal into a deny.
// CLI: node scripts/guard.ts <state> [candidate]
import fs from "node:fs";
import { refuse, Refusal, profile, type Profile, type Artifact } from "./lib.ts";
import { candidateDir, candidateFiles, listCandidates, readJob, readLetter, versionName, type Job } from "./candidate.ts";
import { introSummary } from "./version.ts";

export const STATES = ["route", "intake", "triage", "version", "proposal", "verify"] as const;
export type State = (typeof STATES)[number];
export const ORDER: State[] = ["intake", "triage", "version", "proposal", "verify"];

interface Ctx { state: State; candidate?: string; out: string[] }
type Guard = (ctx: Ctx) => void;

// Level 1: profile.md valid (triage reads it). Level 2: every Profile file valid and one Project at
// least (the Letter States cite the Overviews, the Bullets and the voice).
function profileGate(state: State, level: 1 | 2): Profile {
  const p = profile();
  const errors = level === 1 ? p.errors.filter((e) => e.startsWith("profile.md")) : p.errors;
  if (errors.length) refuse(state, `the Profile has ${errors.length} error${errors.length === 1 ? "" : "s"}:\n  ${errors.join("\n  ")}`, "Fix the file by hand.");
  if (level === 2 && !p.projects.length) refuse(state, "no Project file under profile/projects/.", "Add at least one Project file (profile/schemas/project.schema.json, Bullets with keys).");
  return p;
}

interface Gate { dir: string; files: ReturnType<typeof candidateFiles>; job: Job; route: string; fm: Record<string, any> }

function candidateGate(state: State, candidate?: string): Gate {
  const dir = candidateDir(candidate);
  if (!dir) {
    const known = listCandidates();
    refuse(state, `needs a Candidate folder name as argument${candidate ? ` (got "${candidate}")` : ""}.`,
      known.length ? `Known Candidates:\n  ${known.join("\n  ")}\nUsage: /route-${state} <YYYY-MM-DD-slug>` : "No Candidates yet. Run /route-intake first.");
  }
  if (!fs.existsSync(dir)) refuse(state, `no Candidate folder private/candidates/${candidate}.`, "Run /route-intake first.");
  const job = readJob(dir);
  if (!job) refuse(state, `private/candidates/${candidate}/job.md is missing.`, "Run /route-intake first.");
  if (job.errors.length) refuse(state, `private/candidates/${candidate}/job.md is invalid:\n  ${job.errors.join("\n  ")}`, "Run /route-intake again or fix the file by hand.");
  const fm = job.frontmatter as Record<string, any>;
  return { dir, files: candidateFiles(dir), job, route: String(fm.route), fm };
}

// The Verdict the human confirmed at the Checkpoint. Nothing is recomputed: the scores and the
// recommendation were session output.
function verdictGate(state: State, candidate: string, fm: Record<string, any>): void {
  if (fm.verdict === "go") return;
  if (fm.verdict === "no-go") refuse(state, "the Verdict is no-go. Route ended.", null);
  refuse(state, "no Verdict yet.", `Run /route-triage ${candidate} and answer go or no-go at the Checkpoint.`);
}

function letterGate(state: State, candidate: string, dir: string, next: string): Artifact {
  const letter = readLetter(dir);
  if (!letter) refuse(state, `private/candidates/${candidate}/letter.md is missing.`, next);
  if (letter.errors.length) refuse(state, `private/candidates/${candidate}/letter.md is invalid:\n  ${letter.errors.join("\n  ")}`, "Drop the frontmatter.");
  return letter;
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
    const { files, route, fm } = candidateGate(state, candidate);
    if (fs.existsSync(files.letter)) refuse(state, `private/candidates/${candidate}/letter.md already exists; the Route has passed triage.`, `Run /route-verify ${candidate} or start a new Candidate.`);
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, `Title: ${fm.title}`);
    if (route === "employment") out.push(`Company: ${fm.company}`, `Employment: ${fm.employment}`);
    out.push(`Timezone: ${fm.timezone}`);
    if (fm.location) out.push(`Location: ${fm.location}`);
    if (fm.verdict) out.push(`Note: the Verdict is already ${fm.verdict}; the Checkpoint rewrites it.`);
    if (fm.requirements?.length) out.push(`Note: requirements already recorded (${fm.requirements.length}); the Checkpoint rewrites them.`);
  },
  version: ({ state, candidate, out }) => {
    const { dir, files, route, fm } = candidateGate(state, candidate);
    if (route !== "employment") refuse(state, `private/candidates/${candidate} is on the ${route} route; the version State runs on employment only.`, `Run /route-proposal ${candidate}.`);
    verdictGate(state, candidate!, fm);
    out.push(`Candidate: private/candidates/${candidate}`, `Title: ${fm.title}`, `Requirements: ${(fm.requirements ?? []).join(", ") || "none recorded"}`);
    if (versionName(dir) === "tailored") out.push("Note: version.md exists; the Candidate is sent with its tailored Version.");
    const letter = readLetter(dir);
    if (letter?.body.trim()) out.push("Note: letter.md already holds a Letter; this run leaves it alone.");
  },
  proposal: ({ state, candidate, out }) => {
    const p = profileGate(state, 2);
    const { dir, files, route, fm } = candidateGate(state, candidate);
    verdictGate(state, candidate!, fm);
    if (route === "employment") {
      letterGate(state, candidate!, dir, `Run /route-version ${candidate} first.`);
      const intro = introSummary(dir, p);
      if (intro.text === null) refuse(state, `the Version sent does not read: ${intro.errors.join("; ")}`, versionName(dir) === "tailored" ? `Run resume-version ${candidate} again.` : "Run resume-version to regenerate resume/versions/general.md.");
      out.push(`Version: ${versionName(dir)}`, `Intro summary (${intro.source}): ${intro.text}`);
    } else if (fs.existsSync(files.letter)) out.push("Note: letter.md exists; this run rewrites it.");
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, `Title: ${fm.title}`, `Requirements: ${(fm.requirements ?? []).join(", ") || "none recorded"}`);
    if (route === "freelance") out.push(`Flags: ${(fm.flags ?? []).join(", ") || "none"}`);
  },
  verify: ({ state, candidate, out }) => {
    profileGate(state, 2);
    const { dir, route, fm } = candidateGate(state, candidate);
    verdictGate(state, candidate!, fm);
    letterGate(state, candidate!, dir, `Run /route-proposal ${candidate} first.`);
    out.push(`Candidate: private/candidates/${candidate}`, `Route: ${route}`, `Letter: letter.md`, `Template: ${route === "employment" ? "letter-employment" : "letter-freelance"}`);
    if (route === "employment") out.push(`Version: ${versionName(dir)}`);
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
