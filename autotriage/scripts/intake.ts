// The intake State's scripts. `route` reads the paste on stdin and prints the route the cues pick
// (`freelance`, `employment`) or `undecided`; the model's own reading of the text wins over it. `write`
// writes job.md through the Candidate contract: the identity fields from the options, the paste on stdin
// verbatim as the body; it refuses an invalid job.md, a bad folder name and an existing Candidate before
// writing anything, and prints the refusal on stdout with exit 0.
// CLI: node scripts/intake.ts route < paste.txt
//      node scripts/intake.ts write <YYYY-MM-DD-slug> --title <t> --route <r> --timezone <tz> [--location <l>] [--company <c>] [--employment <e>] < paste.txt
import { inferRoute, Refusal } from "./lib.ts";
import { writeIntake } from "./candidate.ts";

const FIELDS = ["title", "route", "timezone", "location", "company", "employment"] as const;

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [command, ...args] = process.argv.slice(2);
  if (command !== "route" && command !== "write") { console.error("usage: intake.ts route < paste | intake.ts write <candidate> --title <t> --route <r> --timezone <tz> [--location <l>] [--company <c>] [--employment <e>] < paste"); process.exit(2); }
  const text = await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s)); });
  if (command === "route") {
    const result = inferRoute(text);
    console.log(result ? `${result.route}${result.inferred ? ", inferred" : ""}` : "undecided");
  } else {
    const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
    const fields = Object.fromEntries(FIELDS.map((f) => [f, opt(f)]).filter(([, v]) => v !== undefined));
    try {
      console.log(writeIntake(args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--")), fields, text));
    } catch (e) {
      if (e instanceof Refusal) { console.log(e.message); process.exit(0); }
      throw e;
    }
  }
}
