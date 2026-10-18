// Profile helper for the setup skill. Deterministic parts of the wizard: which Profile files exist and
// validate, and a YAML skeleton built from a schema's defaults.
// CLI: node scripts/profile.ts status
//      node scripts/profile.ts skeleton <profile|voice|project|version>
import fs from "node:fs";
import path from "node:path";
import { SCHEMAS_DIR } from "@konfrontend/profile";
import { profile, PROFILE_ROOT } from "./lib.ts";

export function status(): string {
  const p = profile();
  const out: string[] = [`Profile at ${path.relative(process.cwd(), PROFILE_ROOT) || "."}`];
  if (p.errors.length) out.push(...p.errors.map((e) => `  ${e}`));
  else out.push(`  ${p.projects.length} Projects, ${p.projects.reduce((n, x) => n + x.stories.length, 0)} Stories, ${p.answers.length} Answers, every file valid`);
  const profileOk = !p.errors.some((e) => e.startsWith("profile.md"));
  out.push("", `triage gate (profile.md valid): ${profileOk ? "pass" : "fail"}`);
  out.push(`proposal gate (every Profile file valid, one Project at least): ${p.errors.length ? "fail" : "pass"}`);
  return out.join("\n");
}

type Schema = { properties?: Record<string, Schema>; required?: string[]; enum?: unknown[]; items?: Schema; pattern?: string; type?: string; default?: unknown };

// YAML skeleton from a schema: defaults where the schema has them, typed placeholders elsewhere,
// a trailing comment naming required fields and enum choices.
export function skeleton(name: string): string {
  const file = path.join(SCHEMAS_DIR, `${name}.schema.json`);
  if (!fs.existsSync(file)) throw new Error(`no schema ${name}; known: profile, voice, project, version`);
  const schema = JSON.parse(fs.readFileSync(file, "utf8")) as Schema;
  return emit(schema, 0).join("\n");
}

function emit(schema: Schema, depth: number): string[] {
  const pad = "  ".repeat(depth);
  const lines: string[] = [];
  const req = new Set(schema.required ?? []);
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    const note: string[] = [];
    if (req.has(key)) note.push("required");
    if (prop.enum) note.push(`one of: ${prop.enum.join(" | ")}`);
    if (prop.items?.enum) note.push(`items one of: ${prop.items.enum.join(" | ")}`);
    if (prop.pattern) note.push(`pattern ${prop.pattern}`);
    const comment = note.length ? `  # ${note.join("; ")}` : "";
    if (prop.type === "object" && prop.properties) {
      lines.push(`${pad}${key}:${comment}`);
      lines.push(...emit(prop, depth + 1));
    } else if (prop.type === "array" && prop.items?.type === "object" && prop.items.properties) {
      lines.push(`${pad}${key}:${comment}`);
      const inner = emit(prop.items, depth + 2);
      inner[0] = inner[0].replace(/^(\s*)  /, "$1- ");
      lines.push(...inner);
    } else {
      lines.push(`${pad}${key}: ${JSON.stringify(placeholder(prop))}${comment}`);
    }
  }
  return lines;
}

function placeholder(prop: Schema): unknown {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum) return prop.enum[0];
  switch (prop.type) {
    case "array": return [];
    case "number": case "integer": return 0;
    case "object": return {};
    default: return "";
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === "status") console.log(status());
    else if (cmd === "skeleton") console.log(skeleton(arg));
    else { console.error("usage: profile.ts status | skeleton <profile|voice|project|version>"); process.exit(2); }
  } catch (e) {
    console.error(`autotriage: profile.ts failed: ${(e as Error).message}`); process.exit(1);
  }
}
