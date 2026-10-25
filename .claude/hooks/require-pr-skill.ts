// PreToolUse hook on Bash: deny `gh pr create` until the session has invoked the pr skill, since a PR body
// written by hand in its place was rejected. Silent when no installed plugin ships a pr skill, so a renamed
// or dropped skill turns the hook off instead of pointing at a name that no longer exists.
import { globSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const input = JSON.parse(await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const command: string = input?.tool_input?.command ?? "";
// At a command position only, so a commit message or an echo that names the command passes.
if (/(?:^|[;&|(\n])\s*gh\s+pr\s+create\b/.test(command)) {
  // cache/<marketplace>/<plugin>/<version>/skills/.../pr/SKILL.md
  const found = globSync(path.join(homedir(), ".claude/plugins/cache/*/*/*/skills/**/pr/SKILL.md"))[0]?.split(path.sep);
  const plugin = found?.[found.indexOf("cache") + 2];
  let transcript = "";
  try { transcript = readFileSync(input.transcript_path ?? "", "utf8"); } catch { /* no transcript: allow */ }
  // A Skill tool call ("skill":"<plugin>:pr") or a typed slash command (<command-name>/<plugin>:pr</command-name>).
  const invoked = /"skill":"(?:[\w-]+:)?pr"|<command-name>\/?(?:[\w-]+:)?pr<\/command-name>/.test(transcript);
  if (plugin && transcript && !invoked) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: `Invoke the ${plugin}:pr skill with the Skill tool and write the PR body by it, then run gh pr create again.` } }));
  }
}
