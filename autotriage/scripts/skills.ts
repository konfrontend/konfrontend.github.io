// Skill matching for triage: which canonical Skills a Job item names, whole words, case-insensitive.
// The Skills are the Profile's, derived from the Projects' keywords; nothing is stored here.
// CLI: node scripts/skills.ts match <item>...
import { profile, skills } from "./lib.ts";

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
export function termRe(term: string): RegExp {
  const a = /^\w/.test(term) ? "\\b" : "", z = /\w$/.test(term) ? "\\b" : "";
  return new RegExp(`${a}${escapeRe(term)}${z}`, "i");
}

// The canonical Skill names a text names, any number per item.
export function skillsIn(names: string[], text: string): string[] {
  const t = String(text);
  return names.filter((n) => termRe(n).test(t));
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd !== "match" || !args.length) { console.error("usage: skills.ts match <item>..."); process.exit(2); }
  const names = skills(profile()).map((s) => s.name);
  for (const item of args) console.log(`${item}: ${skillsIn(names, item).join(", ") || "(no Skill)"}`);
}
