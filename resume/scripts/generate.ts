// Writes a Version from a Plan and the Project files, then drops the lowest-ranked Bullet until the page holds.
// The judgment (which Bullets, in what rank, the title, the summary, the Skills lines, any Variant) is the
// resume-version skill's and arrives as the Plan; this script only assembles and cuts.
// Run: node resume/scripts/generate.ts <plan.json> <version.md>
//      node resume/scripts/generate.ts --refresh <version.md>   (base Versions only)
// Refresh rewrites every sourced line (name, contact line, headings, role rows, Bullets) and keeps the
// selection, its order, the title, the summary and the Skills lines; a hand edit to a Bullet is overwritten
// and reported. Paths are relative to the repo root, which follows CLAUDE_PROJECT_DIR.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readProfile, repoRoot } from "../../profile/lib/index.ts";
import { assemble, planOf, projectOf, canonical, isBase, readVersion, type Plan } from "./version.ts";
import { pages } from "./render.ts";

const resolve = (p: string) => path.resolve(repoRoot(), p);
const rel = (p: string) => path.relative(repoRoot(), resolve(p));

export function planErrors(plan: Plan, profile: ReturnType<typeof readProfile>): string[] {
  const errors: string[] = [];
  for (const field of ["title", "summary"] as const) if (!plan[field]?.trim()) errors.push(`the Plan has no ${field}`);
  if (!plan.skills?.length) errors.push("the Plan has no Skills lines");
  if (!plan.bullets?.length) errors.push("the Plan has no Bullets");
  for (const b of plan.bullets ?? []) {
    const p = projectOf(profile, b.project);
    if (!p) errors.push(`no Project file for ${b.project}`);
    else if (canonical(p, b.key) === undefined) errors.push(`${b.project} has no Bullet [${b.key}]`);
  }
  return errors;
}

// Assembles the Plan and drops its last Bullet until one page holds. Returns the Markdown and what was cut.
export function cut(plan: Plan, profile: ReturnType<typeof readProfile>): { md: string; pages: number; dropped: string[] } {
  const dropped: string[] = [];
  let md = assemble(plan, profile), n = pages(md);
  while (n > 1 && plan.bullets.length) {
    const b = plan.bullets.pop()!;
    dropped.push(`${b.project}/${b.key}`);
    md = assemble(plan, profile);
    n = pages(md);
  }
  return { md, pages: n, dropped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const profile = readProfile();
  if (profile.errors.length) { console.log(`FAIL  source: ${profile.errors.join("; ")}`); process.exit(1); }
  const args = process.argv.slice(2);
  if (args[0] === "--refresh") {
    const file = resolve(args[1] ?? "resume/versions/general.md");
    if (!isBase(file)) { console.log(`refused: ${rel(file)} is a tailored Version; a tailored Version is generated once and never refreshed`); process.exit(1); }
    const version = readVersion(file, profile);
    if (version.errors.length) { console.log(`FAIL  keys: ${version.errors.join("; ")}`); process.exit(1); }
    for (const b of version.bullets.filter((b) => b.variant)) console.log(`overwritten: [${b.project}/${b.key}] hand edit "${b.text.slice(0, 60)}"`);
    const plan = planOf({ ...version, bullets: version.bullets.map((b) => ({ ...b, variant: false })) });
    const md = assemble(plan, profile);
    fs.writeFileSync(file, md);
    console.log(`Wrote ${rel(file)}: ${pages(md)} page(s), ${plan.bullets.length} Bullets`);
  } else {
    const [planPath, outPath] = args;
    if (!planPath || !outPath) { console.log("usage: node resume/scripts/generate.ts <plan.json> <version.md> | --refresh <version.md>"); process.exit(1); }
    const plan: Plan = JSON.parse(fs.readFileSync(resolve(planPath), "utf8"));
    const errors = planErrors(plan, profile);
    if (errors.length) { console.log(`FAIL  plan: ${errors.join("; ")}`); process.exit(1); }
    if (isBase(resolve(outPath))) {
      const variants = plan.bullets.filter((b) => b.text);
      if (variants.length) { console.log(`FAIL  variants: a base Version holds canonical Bullets only: ${variants.map((b) => `${b.project}/${b.key}`).join(", ")}`); process.exit(1); }
    }
    const { md, pages: n, dropped } = cut(plan, profile);
    fs.mkdirSync(path.dirname(resolve(outPath)), { recursive: true });
    fs.writeFileSync(resolve(outPath), md);
    console.log(`Wrote ${rel(outPath)}: ${n} page(s), ${plan.bullets.length} Bullets kept`);
    if (dropped.length) console.log(`Cut, lowest rank first: ${dropped.join(", ")}`);
  }
}
