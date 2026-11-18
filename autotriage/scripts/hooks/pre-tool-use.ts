// PreToolUse hook on the Skill tool: deny a guarded State whose guard fails.
// The injected guard line in SKILL.md is the first layer; this catches model-initiated calls.
import { guard, isState } from "../guard.ts";
import { Refusal } from "../lib.ts";

const input = JSON.parse(await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const skill: string = input?.tool_input?.skill ?? "";
const m = /^route(?:-([a-z]+))?$/.exec(skill);
const state = m ? (m[1] ?? "route") : "";
if (isState(state)) {
  try {
    guard(state);
  } catch (e) {
    const reason = e instanceof Refusal ? e.message : `autotriage: guard crashed: ${(e as Error).message}`;
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  }
}
