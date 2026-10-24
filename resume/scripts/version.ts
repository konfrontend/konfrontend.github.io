// A Version is the Markdown twin of its PDF, generated from the Project files: the name, the title, the
// contact line, the summary, the Skills lines, then one entry per Project with `[slug]` on its heading and
// `[key]` on each Bullet. This module reads one back by position, assembles one from a Plan, and runs the
// checks on the Version's own text. It reads the Profile through profile/lib only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked, type Tokens } from "marked";
import { readArtifact, skills, numbersIn, type Contact, type Employment, type Profile, type Project, type ProjectMeta } from "../../profile/lib/index.ts";

export const RESUME_SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

// The tailoring skill's output: the title, the summary, the Skills lines and one ranked list of Bullets across
// every Project, best first; `text` is set only for a Variant. Passed to generate.ts, never stored.
export interface PlanBullet { project: string; key: string; text?: string }
export interface Plan { title: string; summary: string; skills: string[]; bullets: PlanBullet[] }

export interface VersionBullet { project: string; key: string; text: string; variant: boolean }
export interface Version { file: string; title: string; summary: string; skills: string[]; bullets: VersionBullet[]; errors: string[] }

// `[key] text` on a Bullet, `[slug] heading` on a Project entry: the source pointer the PDF never shows.
export const KEY = /^\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\s+/;
export const stripKey = (s: string): string => s.replace(KEY, "");

// A tailored Version is always a Candidate's version.md; every other Version is a base Version.
export const isBase = (file: string): boolean => path.basename(file) !== "version.md";

export function versionSkillTerms(lines: string[]): string[] {
  return lines.flatMap((l) => l.replace(/^[^:]+: /, "").split(", ").map((t) => t.trim()).filter(Boolean));
}

// Entry heading rules (docs/format-rules.md): the role suffix by employment, the period as
// `Mon YYYY – Mon YYYY`, `Present` when the Project has no end.
export const SUFFIX: Record<Employment, string> = { "full-time": "", "part-time": "", contract: " (Contract)", freelance: " (Freelance)", independent: "" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const month = (ym: string): string => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const period = (meta: Pick<ProjectMeta, "start" | "end">): string => `${month(String(meta.start))} – ${meta.end ? month(String(meta.end)) : "Present"}`;
export const roleLine = (meta: ProjectMeta): string => `${meta.role}${SUFFIX[meta.employment] ?? ""}`;
export const projectName = (meta: ProjectMeta): string => (meta.naming === "nda" ? "NDA client" : meta.naming === "public" && meta.url ? `[${meta.name}](${meta.url})` : meta.name);
export const isExperience = (meta: ProjectMeta): boolean => meta.employment !== "independent";
export const contactLine = (c: Contact): string => [c.location, `[${c.email}](mailto:${c.email})`, c.github && `[${c.github.replace(/^https?:\/\//, "")}](${c.github})`, c.linkedin && `[${c.linkedin.replace(/^https?:\/\/(www\.)?/, "")}](${c.linkedin})`].filter(Boolean).join(" • ");
export const heading = (p: Project): string => `[${p.slug}] ${projectName(p.meta)} – ${p.meta.description}`;
export const roleRow = (p: Project): string => `${roleLine(p.meta)} | ${period(p.meta)}`;

export const projectOf = (profile: Profile, slug: string): Project | undefined => profile.projects.find((p) => p.slug === slug);
export const canonical = (p: Project, key: string): string | undefined => p.bullets.find((b) => b.key === key)?.text;

// Projects in resume order; inside a Project, Bullets in Plan rank. A Plan that names a Project or a Bullet the
// Profile lacks throws: generate.ts validates the Plan first.
export function assemble(plan: Plan, profile: Profile): string {
  const meta = profile.profile!;
  const md = [`# ${meta.identity.name}`, plan.title, contactLine(meta.contact), plan.summary, "## Skills", plan.skills.map((l) => `- ${l}`).join("\n")];
  for (const [title, test] of [["Professional Experience", isExperience], ["Projects", (m: ProjectMeta) => !isExperience(m)]] as const) {
    const entries = profile.projects.filter((p) => test(p.meta) && plan.bullets.some((b) => b.project === p.slug));
    if (!entries.length) continue;
    md.push(`## ${title}`);
    for (const p of entries) {
      const lines = plan.bullets.filter((b) => b.project === p.slug).map((b) => {
        const text = b.text ?? canonical(p, b.key);
        if (text === undefined) throw new Error(`${p.slug} has no Bullet [${b.key}]`);
        return `- [${b.key}] ${text}`;
      });
      md.push(`### ${heading(p)}`, roleRow(p), lines.join("\n"));
    }
  }
  return md.join("\n\n") + "\n";
}

// The Plan a Version carries: title, summary, Skills lines and every Bullet with its Project slug.
export function planOf(version: Pick<Version, "title" | "summary" | "skills" | "bullets">): Plan {
  return { title: version.title, summary: version.summary, skills: [...version.skills], bullets: version.bullets.map((b) => ({ project: b.project, key: b.key, ...(b.variant ? { text: b.text } : {}) })) };
}

// Reads a Version by position: h1 name, then three paragraphs (title, contact line, summary), `## Skills`, then
// the entries. Errors name what the Guards refuse on: a Project or a Bullet the Profile lacks, a Skills term
// that is no Keyword, the old frontmatter shape.
export function readVersion(file: string, profile: Profile): Version {
  const rel = path.basename(file);
  const v: Version = { file, title: "", summary: "", skills: [], bullets: [], errors: [] };
  if (!fs.existsSync(file)) return { ...v, errors: [`${rel}: missing`] };
  const md = fs.readFileSync(file, "utf8");
  if (/^---\r?\n/.test(md)) return { ...v, errors: [`${rel}: has frontmatter; a Version is the resume's Markdown, generated by resume-version`] };
  let para = 0, section = "", slug: string | null = null, h1 = false;
  for (const t of marked.lexer(md)) {
    if (t.type === "heading") {
      const h = t as Tokens.Heading;
      if (h.depth === 1) h1 = true;
      else if (h.depth === 2) section = h.text;
      else if (h.depth === 3) {
        slug = h.text.match(KEY)?.[1] ?? null;
        if (!slug) v.errors.push(`${rel}: entry heading without a [slug]: "${h.text.slice(0, 40)}"`);
        else if (!projectOf(profile, slug)) v.errors.push(`${rel}: no Project file for ${slug}`);
      }
    } else if (t.type === "paragraph" && !section) {
      const text = (t as Tokens.Paragraph).text;
      if (para === 0) v.title = text;
      if (para === 2) v.summary = text;
      para++;
    } else if (t.type === "list") {
      for (const i of (t as Tokens.List).items) {
        if (section === "Skills") { v.skills.push(i.text); continue; }
        const key = i.text.match(KEY)?.[1];
        if (!key) { v.errors.push(`${rel}: Bullet without a [key]: "${i.text.slice(0, 40)}"`); continue; }
        const p = slug ? projectOf(profile, slug) : undefined;
        const text = stripKey(i.text);
        if (slug && p && canonical(p, key) === undefined) v.errors.push(`${rel}: ${slug} has no Bullet [${key}]`);
        v.bullets.push({ project: slug ?? "?", key, text, variant: !!p && canonical(p, key) !== text });
      }
    }
  }
  if (!h1 || para < 3) v.errors.push(`${rel}: not a Version: expects the name, the title, the contact line and the summary before the Skills`);
  const known = skills(profile).map((s) => s.name.toLowerCase());
  for (const term of versionSkillTerms(v.skills)) if (!known.includes(term.toLowerCase())) v.errors.push(`${rel}: Skills term is not a Project keyword: ${term}`);
  return v;
}

// The checks on a Version's own text. FAIL blocks the render; WARN is printed. Source holds every generated line
// to its source; a Variant is held to its Story, or to its canonical Bullet when the Bullet has no Story yet;
// the Skills lines follow V5 and V6; the summary follows V1 and V2 of the resumeskills audit. The canonical
// Bullet rules run in the Profile check, not here; the rendered Bullet length is measured by render.ts.
export interface Result { level: "PASS" | "WARN" | "FAIL"; name: string; detail: string }

const LABELS = /\b(Expert|Advanced|Proficient|Intermediate|Familiar|Beginner|Basic)\b/;
const SOFT = /\b(communication|teamwork|leadership|problem[- ]solving|team player)\b/i;
const OBJECTIVE = /\b(seeking|looking for|hard-working|results-oriented|results-driven|team player|detail-oriented)\b/i;

// The shared banned list of autotriage/catalogue/voice.md, with the Profile's own additions and permissions.
export function bannedPhrases(profile: Profile): string[] {
  const shared = (readArtifact(path.resolve(RESUME_SCRIPTS, "..", "..", "autotriage", "catalogue", "voice.md"))?.frontmatter?.banned as string[] | undefined) ?? [];
  const extra = (profile.voice?.banned_extra as string[] | undefined) ?? [];
  const allowed = new Set(((profile.voice?.allowed_extra as string[] | undefined) ?? []).map((s) => s.toLowerCase()));
  return [...new Set([...shared, ...extra])].filter((b) => !allowed.has(b.toLowerCase()));
}

const has = (text: string, term: string): boolean => text.toLowerCase().includes(term.toLowerCase());

export function checkVersion(version: Version, md: string, profile: Profile): Result[] {
  const out: Result[] = [];
  const add = (level: Result["level"], name: string, bad: string[], ok: string) => out.push(bad.length ? { level, name, detail: bad.join("; ") } : { level: "PASS", name, detail: ok });

  if (version.errors.length) { out.push({ level: "FAIL", name: "keys", detail: version.errors.join("; ") }); return out; }
  add("FAIL", "keys", [], "every [slug] and [key] names a Project and its Bullet");

  // Source: the Markdown equals what the generator writes for its Plan, Variants included.
  const expected = assemble(planOf(version), profile).split("\n");
  const diff = md.split("\n").map((l, i) => [l, expected[i] ?? ""] as const).filter(([a, b]) => a !== b).map(([a, b]) => `"${a.slice(0, 60)}" should be "${b.slice(0, 60)}"`);
  add("FAIL", "source", diff.slice(0, 3), "name, contact, headings, role rows and canonical Bullets match the Profile");

  const variants = version.bullets.filter((b) => b.variant);
  if (isBase(version.file)) add("FAIL", "variants", variants.map((b) => `${b.project}/${b.key}`), "a base Version holds canonical Bullets only");
  else {
    const pool = (b: VersionBullet): { text: string; keywords: string[] } => {
      const p = projectOf(profile, b.project)!;
      const story = p.stories.find((s) => s.bullets.some((x) => x.key === b.key));
      const text = story ? [story.text, ...story.bullets.map((x) => x.text)].join("\n") : canonical(p, b.key)!;
      return { text, keywords: p.meta.keywords ?? [] };
    };
    const looseNumbers = variants.filter((b) => { const n = new Set(numbersIn(pool(b).text)); return numbersIn(b.text).some((x) => !n.has(x)); });
    add("FAIL", "variant numbers", looseNumbers.map((b) => `${b.project}/${b.key}`), `${variants.length} Variant(s), every number from its Story or its canonical Bullet`);
    const looseKeywords = variants.filter((b) => { const { text, keywords } = pool(b); return keywords.some((k) => has(b.text, k) && !has(text, k)); });
    add("FAIL", "variant keywords", looseKeywords.map((b) => `${b.project}/${b.key}`), "every Keyword a Variant names is in its Story or its canonical Bullet");
    if (variants.length) out.push({ level: "WARN", name: "variant claims", detail: `review each Variant against its Story by profile/bullet-rules.md: ${variants.map((b) => b.key).join(", ")}` });
  }

  const known = skills(profile).map((s) => s.name.toLowerCase());
  const terms = versionSkillTerms(version.skills);
  add("FAIL", "skills terms", terms.filter((t) => !known.includes(t.toLowerCase())), "every term is a Keyword");
  add("FAIL", "skills duplicates", terms.filter((t, i) => terms.findIndex((u) => u.toLowerCase() === t.toLowerCase()) !== i), "no Skill twice");
  add("FAIL", "skills labels", version.skills.filter((l) => LABELS.test(l) || SOFT.test(l)), "no proficiency label, no soft skill");

  const noun = version.title.trim().split(" ").at(-1)!.toLowerCase();
  add("WARN", "summary role noun", has(version.summary, noun) ? [] : [`"${noun}" absent from the summary`], `the summary names "${noun}" (V1)`);
  add("WARN", "summary voice", [...bannedPhrases(profile).filter((b) => has(version.summary, b)).map((b) => `banned "${b}"`), ...(OBJECTIVE.test(version.summary) ? ["objective or trait filler"] : []), ...(/\b(he|his|Konstantin)\b/.test(version.summary) ? ["third person"] : [])], "no banned phrase, no objective, no third person (V2)");
  return out;
}
