// Route guard. Runs as the injected command at the top of the Route's SKILL.md files and from the
// PreToolUse hook. The CLI always exits 0 and prints either `Profile gate passed.` or a refusal
// line (`autotriage: <state> refused. ...`), so the model and the human read it either way; the hook turns
// the same Refusal into a deny. A Job lives only in the session, so the one thing a guard checks is the
// Profile.
// CLI: node scripts/guard.ts <state>
import { refuse, Refusal, profile } from "./lib.ts";

// The States that cite the Profile's Projects: the Route itself and the two Letter steps.
export const STATES = ["route", "proposal", "verify"] as const;
export type State = (typeof STATES)[number];

export function isState(s: string): s is State {
  return (STATES as readonly string[]).includes(s);
}

// A Refusal when the Profile has no Project. A Profile error refuses nothing: a script that cannot use
// a Profile file reports its own problem.
export function guard(state: string): string {
  if (!isState(state)) refuse(state || "(none)", `unknown State. Known: ${STATES.join(", ")}.`, null);
  if (!profile().projects.length) refuse(state, "no Project file under profile/projects/.", "Add at least one Project file.");
  return "Profile gate passed.";
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const state = process.argv[2] ?? "";
  try {
    console.log(guard(state));
  } catch (e) {
    console.log(e instanceof Refusal ? e.message : `autotriage: ${state} refused. guard crashed: ${(e as Error).stack}`);
  }
}
