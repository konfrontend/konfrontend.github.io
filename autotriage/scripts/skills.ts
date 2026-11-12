// Keyword matching for triage: which Keywords a Job item names, whole words, case-insensitive.
// The Keywords are the Projects', read through profile/lib; nothing is stored here.
// CLI: node scripts/skills.ts match <item>...
import { profile, keywords } from "./lib.ts";

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

// The Skills a Job item names, less a name another found name already holds (`GitHub` inside `GitHub Actions`).
export function matchItem(names: string[], item: string): string[] {
  const found = skillsIn(names, item);
  return found.filter((n) => !found.some((s) => s !== n && termRe(n).test(s)));
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd !== "match" || !args.length) { console.error("usage: skills.ts match <item>..."); process.exit(2); }
  const names = keywords(profile());
  for (const item of args) console.log(`${item}: ${matchItem(names, item).join(", ") || "(no Keyword)"}`);
}
