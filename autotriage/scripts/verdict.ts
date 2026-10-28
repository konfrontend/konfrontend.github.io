// Verdict arithmetic and the Checkpoint's write. The model detects Flags and scores; this script computes
// the Alert Level, the hard stops and its recommendation (go, no-go, ask) from arguments alone, reading no
// Candidate file: triage holds the result in the session. Once the human has answered, `write` sets the
// Checkpoint fields in job.md through the Candidate contract, refusing before it writes when the result
// would not validate; the refusal is printed on stdout with exit 0.
// CLI: node scripts/verdict.ts --route <freelance|employment> --skill-fit <1-5> [--flags id,id]
//   prints {"alert_level","hard_stops","verdict"}.
//      node scripts/verdict.ts write <candidate> --verdict <go|no-go> --requirements <item,item> [--flags id,id]
import { flagsFor, Refusal, type Route } from "./lib.ts";
import { writeCheckpoint } from "./candidate.ts";

export interface VerdictInput { route: Route | string; flags?: string[]; skill_fit?: number }
export interface Computed { alert_level: number; hard_stops: string[]; verdict: "go" | "no-go" | "ask" }

export function compute({ route, flags = [], skill_fit }: VerdictInput): Computed {
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
  // of the same id and stays out of the Alert Level. No money stop: a posted rate or budget is a
  // routing signal shown at the Checkpoint.
  const hardStops: string[] = [];
  if (level === 5) hardStops.push("alert-level-5");
  if (risk.some((f) => f.level === 5)) hardStops.push("level-5-flag");
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
  const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (args[0] === "write") {
    const verdict = opt("verdict"), requirements = opt("requirements");
    if (!args[1] || args[1].startsWith("--") || verdict === undefined || requirements === undefined) { console.error("usage: verdict.ts write <candidate> --verdict <go|no-go> --requirements <item,item> [--flags id,id]"); process.exit(2); }
    try {
      console.log(writeCheckpoint(args[1], { verdict, requirements: list(requirements), flags: opt("flags") === undefined ? undefined : list(opt("flags")) }));
    } catch (e) {
      if (e instanceof Refusal) { console.log(e.message); process.exit(0); }
      throw e;
    }
    process.exit(0);
  }
  const route = opt("route"), skill = opt("skill-fit");
  const usage = "usage: verdict.ts --route <freelance|employment> --skill-fit <1-5> [--flags id,id]";
  if (!route || !["freelance", "employment"].includes(route) || !skill || !/^[1-5]$/.test(skill)) { console.error(usage); process.exit(2); }
  const flags = list(opt("flags"));
  console.log(JSON.stringify(compute({ route, flags, skill_fit: Number(skill) })));
}
