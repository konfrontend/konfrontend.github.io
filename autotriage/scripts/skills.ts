// Skill matching for triage: which canonical Skills a Job item names, whole words, case-insensitive.
// The Skills are the Profile's: proved, derived from the Projects' keywords, and claimed, from profile.md
// `skills.claimed`; nothing is stored here.
// CLI: node scripts/skills.ts match <item>...
import { profile, skills, claimedSkills } from "./lib.ts";

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

// The Skills a Job item names: the proved ones, then the claimed ones no proved name already covers
// (`GitHub` inside `GitHub Actions`).
export interface Match { name: string; level: "shipped" | "claimed" }
export function matchItem(proved: string[], claimed: string[], item: string): Match[] {
  const found = skillsIn(proved, item);
  const covered = (n: string) => found.some((s) => termRe(n).test(s));
  return [
    ...found.map((name) => ({ name, level: "shipped" as const })),
    ...skillsIn(claimed, item).filter((n) => !covered(n)).map((name) => ({ name, level: "claimed" as const })),
  ];
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd !== "match" || !args.length) { console.error("usage: skills.ts match <item>..."); process.exit(2); }
  const p = profile();
  const names = skills(p).map((s) => s.name);
  for (const item of args) console.log(`${item}: ${matchItem(names, claimedSkills(p), item).map((m) => (m.level === "claimed" ? `${m.name} (claimed)` : m.name)).join(", ") || "(no Skill)"}`);
}
