// PostToolUse hook on Write|Edit: validate any artifact written under the Profile against its schema, and
// any Candidate file against the Candidate contract (job.md on both routes; letter.md carries no frontmatter).
// The scripts write job.md through the contract; this is the net for a hand edit. The write has already
// landed; a failing artifact returns the errors to the model so the State fixes it, and the next Guard
// refuses the file until it does.
import { readArtifact, schemaForPath } from "../lib.ts";
import { candidateErrors, candidateSchemaForPath } from "../candidate.ts";
import { validateArtifact } from "../../../profile/lib/index.ts";

const input = JSON.parse(await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s || "{}")); }));
const file: string | undefined = input?.tool_input?.file_path;
const profileSchema = file ? schemaForPath(file) : null;
const candidateKind = file ? candidateSchemaForPath(file) : null;
const schema = profileSchema ?? candidateKind;
if (file && schema) {
  const art = readArtifact(file);
  if (art) {
    const errors = candidateKind ? candidateErrors(candidateKind, art) : validateArtifact(profileSchema!, art);
    if (errors.length) {
      console.log(JSON.stringify({ decision: "block", reason: `autotriage: ${file} does not match ${candidateKind ? "the Candidate contract" : `the ${schema} schema`}:\n  ${errors.join("\n  ")}\nFix the file before continuing.` }));
    }
  }
}
