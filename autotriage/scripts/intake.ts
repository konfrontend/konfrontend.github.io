// Route inference for intake. Reads the paste on stdin and prints the route the cues pick
// (`freelance`, `employment`) or `undecided`; the model's own reading of the text wins over it.
// CLI: node scripts/intake.ts route < paste.txt
import { inferRoute } from "./lib.ts";

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [command] = process.argv.slice(2);
  if (command !== "route") { console.error("usage: intake.ts route < paste"); process.exit(2); }
  const text = await new Promise<string>((r) => { let s = ""; process.stdin.on("data", (c) => (s += c)); process.stdin.on("end", () => r(s)); });
  const result = inferRoute(text);
  console.log(result ? `${result.route}${result.inferred ? ", inferred" : ""}` : "undecided");
}
