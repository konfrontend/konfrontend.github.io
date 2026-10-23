// PostToolUse hook on Write|Edit: validate any artifact written under the Profile or the Candidates
// against its schema (job.md on both routes; letter.md must carry no frontmatter).
// The write has already landed; a failing artifact returns the errors to the model so the State fixes
// it, and the next Guard refuses the file until it does.
import { readArtifact, validateArtifact, schemaForPath } from "../lib.ts";

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
