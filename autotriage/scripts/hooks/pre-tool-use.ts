// PreToolUse hook on the Skill tool: deny an autotriage State whose guard fails.
// The injected guard line in SKILL.md is the first layer; this catches model-initiated calls.
import { guard } from "../guard.ts";
import { Refusal } from "../lib.ts";

const input = JSON.parse(await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const skill: string = input?.tool_input?.skill ?? "";
const m = /^route(?:-([a-z]+))?$/.exec(skill);
if (m) {
  const candidate = String(input.tool_input.args ?? "").trim().split(/\s+/)[0] || undefined;
  const deny = (reason: string) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  try {
    guard(m[1] ?? "route", candidate);
  } catch (e) {
    deny(e instanceof Refusal ? e.message : `autotriage: guard crashed: ${(e as Error).message}`);
  }
}
