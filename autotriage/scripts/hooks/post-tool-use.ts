// PostToolUse hook on Write|Edit: validate profile.md against its schema (a Project file has none). The write has already landed; a failing file returns the errors to the model so it fixes them.
import { readArtifact, schemaForPath } from "../lib.ts";
import { validateArtifact } from "../../../profile/lib/index.ts";

const input = JSON.parse(await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const file: string | undefined = input?.tool_input?.file_path;
const schema = file ? schemaForPath(file) : null;
if (file && schema) {
  const art = readArtifact(file);
  if (art) {
    const errors = validateArtifact(schema, art);
    if (errors.length) {
      console.log(JSON.stringify({ decision: "block", reason: `autotriage: ${file} does not match the ${schema} schema:\n  ${errors.join("\n  ")}\nFix the file before continuing.` }));
    }
  }
}
