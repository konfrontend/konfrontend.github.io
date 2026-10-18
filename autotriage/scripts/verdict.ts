// Verdict arithmetic. The model detects Flags, Family (freelance route), and scores; this script
// computes alert_level, hard_stops, and verdict from them plus Profile floors.
// CLI: node scripts/verdict.ts <candidate> [--check]
//   without --check: rewrites the computed fields into job.md and prints them
//   with --check: exits 1 when stored values disagree with the recomputation
import path from "node:path";
import { readArtifact, writeArtifact, flagsFor, candidateDir, profile, type Artifact, type Frontmatter } from "./lib.ts";

export interface VerdictInput { flags?: string[]; skill_fit?: number; family?: string | null; [k: string]: unknown }
export interface Computed { alert_level: number; hard_stops: string[]; verdict: "go" | "no-go" | "ask" }
interface Terms { rate_floor?: number }
interface JobLike { route?: unknown; budget?: { type?: string; min?: unknown; max?: unknown } }

export function compute(verdict: VerdictInput, profileMeta: { terms?: Terms } | null | undefined, job: JobLike | undefined): Computed {
  // Only the Flags of the Candidate's route count; an id from the other route is ignored.
  const byId = new Map(flagsFor(job?.route).map((f) => [f.id, f]));
  const triggered = (verdict.flags ?? []).map((id) => byId.get(id)).filter((f) => f !== undefined);
  const risk = triggered.filter((f) => !f.kind || f.kind === "risk");
  const green = triggered.filter((f) => f.kind === "green");
  const stop = triggered.filter((f) => f.kind === "stop");

  // alert_level_steps from catalogue/flags.md
  let level = risk.length ? Math.max(...risk.map((f) => f.level ?? 1)) : 1;
  const midCount = new Set(risk.filter((f) => (f.level === 2 || f.level === 3) && f.id !== "budget-scope-mismatch").map((f) => f.id)).size;
  if (midCount >= 3) level += 1;
  const ids = new Set(risk.map((f) => f.id));
  if ((ids.has("hostile-tone") || ids.has("burned-before")) && risk.some((f) => (f.level ?? 0) >= 2 && f.id !== "hostile-tone" && f.id !== "burned-before")) level += 1;
  if (green.length) level -= 1;
  level = Math.min(5, Math.max(1, level));

  // hard_stops from catalogue/flags.md. refused-stack and unmet-constraint are stop Flags the model
  // detects against the Profile; each forces the hard stop of the same id and stays out of the Alert Level.
  // rate-below-floor is a freelance stop only: on the employment route pay is unknown until the offer.
  const employment = job?.route === "employment";
  const hardStops: string[] = [];
  if (level === 5) hardStops.push("alert-level-5");
  if (risk.some((f) => f.level === 5)) hardStops.push("level-5-flag");
  const floor = profileMeta?.terms?.rate_floor ?? 0;
  if (!employment && job?.budget?.type === "hourly" && typeof job.budget.max === "number" && floor > 0 && job.budget.max < floor) hardStops.push("rate-below-floor");
  for (const f of stop) hardStops.push(f.id);

  // verdict_mapping, in order
  let result: Computed["verdict"];
  if (hardStops.length) result = "no-go";
  else if (verdict.skill_fit === 1) result = "no-go";
  else if (verdict.skill_fit === 2) result = "ask";
  else if (!employment && !verdict.family) result = "ask";
  else if (level <= 3) result = "go";
  else if (level === 4) result = verdict.skill_fit === 5 ? "go" : "ask";
  else result = "no-go";

  return { alert_level: level, hard_stops: hardStops, verdict: result };
}

export function recompute(candidate: string): { job: Artifact | null; computed: Computed | null; mismatch: string[] } {
  const dir = candidateDir(candidate);
  const job = dir ? readArtifact(path.join(dir, "job.md")) : null;
  const stored = job?.frontmatter?.verdict as (VerdictInput & Partial<Computed>) | undefined;
  if (!job || !stored) return { job, computed: null, mismatch: ["verdict block missing"] };
  const computed = compute(stored, profile().profile as { terms?: Terms } | null, job.frontmatter as JobLike);
  const mismatch: string[] = [];
  if (stored.alert_level !== computed.alert_level) mismatch.push(`alert_level: stored ${stored.alert_level}, computed ${computed.alert_level}`);
  if (stored.verdict !== computed.verdict) mismatch.push(`verdict: stored ${stored.verdict}, computed ${computed.verdict}`);
  const a = JSON.stringify([...(stored.hard_stops ?? [])].sort()), b = JSON.stringify([...computed.hard_stops].sort());
  if (a !== b) mismatch.push(`hard_stops: stored ${a}, computed ${b}`);
  return { job, computed, mismatch };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [candidate, flag] = process.argv.slice(2);
  if (!candidateDir(candidate)) { console.error("usage: verdict.ts <candidate> [--check]"); process.exit(2); }
  const { job, computed, mismatch } = recompute(candidate);
  if (!job || !computed) { console.error(mismatch.join("\n")); process.exit(1); }
  if (flag === "--check") {
    if (mismatch.length) { console.error(`verdict mismatch in ${candidate}/job.md:\n${mismatch.join("\n")}`); process.exit(1); }
    console.log("verdict ok");
  } else {
    const fm = job.frontmatter as Frontmatter;
    const v = Object.assign(fm.verdict as Record<string, unknown>, computed);
    if (!("decision" in v)) v.decision = null;
    writeArtifact(job.file, fm, job.body);
    console.log(JSON.stringify(computed));
  }
}
