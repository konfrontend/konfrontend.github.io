// Verdict arithmetic. The model detects Flags and scores; this script computes the Alert Level, the hard
// stops and its recommendation (go, no-go, ask) from arguments alone. It reads no Candidate file: triage
// holds the result in the session and writes job.md only at the Checkpoint, once the human has answered.
// CLI: node scripts/verdict.ts --route <freelance|employment> --skill-fit <1-5> [--flags id,id] [--budget-max <n>] [--rate-floor <n>]
//   prints {"alert_level","hard_stops","verdict"}; --rate-floor defaults to the Profile's terms.rate_floor.
import { flagsFor, profile, type Route } from "./lib.ts";

export interface VerdictInput { route: Route | string; flags?: string[]; skill_fit?: number; budget_max?: number | null; rate_floor?: number | null }
export interface Computed { alert_level: number; hard_stops: string[]; verdict: "go" | "no-go" | "ask" }

export function compute({ route, flags = [], skill_fit, budget_max = null, rate_floor = null }: VerdictInput): Computed {
  // Only the Flags of the Candidate's route count; an id from the other route is ignored.
  const byId = new Map(flagsFor(route).map((f) => [f.id, f]));
  const triggered = flags.map((id) => byId.get(id)).filter((f) => f !== undefined);
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

  // hard_stops from catalogue/flags.md. unmet-constraint is the one stop Flag; it forces the hard stop
  // of the same id and stays out of the Alert Level. rate-below-floor is freelance only: on the
  // employment route pay is unknown until the offer.
  const employment = route === "employment";
  const hardStops: string[] = [];
  if (level === 5) hardStops.push("alert-level-5");
  if (risk.some((f) => f.level === 5)) hardStops.push("level-5-flag");
  if (!employment && typeof budget_max === "number" && typeof rate_floor === "number" && rate_floor > 0 && budget_max < rate_floor) hardStops.push("rate-below-floor");
  for (const f of stop) hardStops.push(f.id);

  // verdict_mapping, in order
  let result: Computed["verdict"];
  if (hardStops.length) result = "no-go";
  else if (skill_fit === 1) result = "no-go";
  else if (skill_fit === 2) result = "ask";
  else if (level <= 3) result = "go";
  else if (level === 4) result = skill_fit === 5 ? "go" : "ask";
  else result = "no-go";

  return { alert_level: level, hard_stops: hardStops, verdict: result };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const route = opt("route"), skill = opt("skill-fit");
  const usage = "usage: verdict.ts --route <freelance|employment> --skill-fit <1-5> [--flags id,id] [--budget-max <n>] [--rate-floor <n>]";
  if (!route || !["freelance", "employment"].includes(route) || !skill || !/^[1-5]$/.test(skill)) { console.error(usage); process.exit(2); }
  const num = (v: string | undefined) => (v === undefined ? null : Number(v));
  const floor = opt("rate-floor") !== undefined ? num(opt("rate-floor")) : ((profile().profile as { terms?: { rate_floor?: number } } | null)?.terms?.rate_floor ?? null);
  const flags = (opt("flags") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  console.log(JSON.stringify(compute({ route, flags, skill_fit: Number(skill), budget_max: num(opt("budget-max")), rate_floor: floor })));
}
