// The Profile reader: the one implementation that parses the authored Markdown (profile.md, voice.md,
// answers/, projects/), derives the Skills from the Projects' keywords, and runs the Profile check.
// Every consumer (the autotriage scripts, the resume scripts) imports from here and never parses a
// Profile file itself. This module reads the Profile only: never private/, never resume/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { Ajv, type ValidateFunction } from "ajv";

export const LIB_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMAS_DIR = path.resolve(LIB_ROOT, "..", "schemas");

// The one repo root: CLAUDE_PROJECT_DIR when set (the session's project, or a test fixture), else the repo
// this module sits in; read on each call. Data (the Profile, the Candidates, the Versions) resolves from it;
// code and what ships with it (the catalogue, the schemas, the templates, resume.css) from its own module.
export function repoRoot(): string {
  return path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(LIB_ROOT, "..", ".."));
}

export type Frontmatter = Record<string, unknown>;
export interface Artifact { file: string; frontmatter: Frontmatter | null; body: string; raw: string | null }

export function splitFrontmatter(text: string): Omit<Artifact, "file"> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!m) return { frontmatter: null, body: text, raw: null };
  return { frontmatter: (YAML.parse(m[1]) as Frontmatter | null) ?? {}, body: m[2], raw: m[1] };
}

export function readArtifact(file: string): Artifact | null {
  if (!fs.existsSync(file)) return null;
  return { file, ...splitFrontmatter(fs.readFileSync(file, "utf8")) };
}

export function writeArtifact(file: string, frontmatter: Frontmatter, body = ""): void {
  const fm = YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\n${fm}\n---\n${body}`);
}

// Schemas: profile, project and voice live in profile/schemas; a consumer registers its own directory.
export type SchemaName = "profile" | "project" | "voice" | (string & {});
const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: false });
const compiled = new Map<string, ValidateFunction & { body: string | null }>();
const schemaDirs = [SCHEMAS_DIR];

export function registerSchemaDir(dir: string): void {
  if (!schemaDirs.includes(dir)) schemaDirs.unshift(dir);
}

export function schemaFor(name: SchemaName): ValidateFunction & { body: string | null } {
  let check = compiled.get(name);
  if (!check) {
    const dir = schemaDirs.find((d) => fs.existsSync(path.join(d, `${name}.schema.json`)));
    if (!dir) throw new Error(`no schema ${name} in ${schemaDirs.join(", ")}`);
    const json = JSON.parse(fs.readFileSync(path.join(dir, `${name}.schema.json`), "utf8"));
    check = Object.assign(ajv.compile(json), { body: (json["x-body"] as string | undefined) ?? null });
    compiled.set(name, check);
  }
  return check;
}

export function validate(name: SchemaName, data: unknown): string[] {
  const check = schemaFor(name);
  if (check(data)) return [];
  return (check.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
}

export function validateArtifact(name: SchemaName, art: Pick<Artifact, "frontmatter" | "body">): string[] {
  if (art.frontmatter === null) return ["no YAML frontmatter"];
  const errors = validate(name, art.frontmatter);
  if (schemaFor(name).body === "empty" && art.body.trim()) errors.push("body must be empty");
  return errors;
}

// An indented line beneath a list item continues it. Any section may be empty or absent.
export interface Bullet { key: string; text: string }
export interface ProjectBody { overview: string; bullets: Bullet[]; notes: string[]; errors: string[] }
const KEY = /^\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\s+(.*)$/s;
const SECTIONS = ["Overview", "Bullets", "Notes"] as const;
type Section = (typeof SECTIONS)[number];

function items(block: string): string[] {
  return block.split(/\n(?=- )/).map((item) => item.replace(/^- /, "").split(/\n\s+/).map((l) => l.trim()).join(" "));
}

export function parseProject(body: string): ProjectBody {
  const overview: string[] = [];
  const bullets: Bullet[] = [];
  const notes: string[] = [];
  const errors: string[] = [];
  const keys = new Set<string>();
  let section: Section | null = null;
  const bullet = (item: string) => {
    const km = KEY.exec(item);
    if (!km) { errors.push(`Bullet without a key: "${item.slice(0, 60)}"`); return; }
    if (keys.has(km[1])) errors.push(`duplicate Bullet key [${km[1]}]`);
    keys.add(km[1]);
    bullets.push({ key: km[1], text: km[2].trim() });
  };
  for (const block of (body ?? "").trim().split(/\n\s*\n+/)) {
    const text = block.trim();
    if (!text) continue;
    const h2 = /^## (.+)$/.exec(text);
    if (h2) {
      const name = h2[1].trim() as Section;
      if (!SECTIONS.includes(name)) { errors.push(`unknown section "## ${h2[1].trim()}"`); section = null; continue; }
      section = name; continue;
    }
    if (/^###/m.test(text)) { errors.push(`a "###" line: "${text.slice(0, 60)}"`); continue; }
    if (section === null) { errors.push(`text outside the sections: "${text.slice(0, 60)}"`); continue; }
    const list = /^- /.test(text);
    if (section === "Overview") overview.push(text);
    else if (section === "Notes") { if (list) notes.push(...items(block)); else errors.push(`Notes holds a line that is not a list item: "${text.slice(0, 60)}"`); }
    else if (list) for (const item of items(block)) bullet(item);
    else errors.push(`Bullets holds a line that is not a Bullet: "${text.slice(0, 60)}"`);
  }
  return { overview: overview.join("\n\n"), bullets, notes, errors };
}

// The Profile check on a Bullet (.claude/skills/pp-bullets/refs/bullet-rules.md): the opener fails, the
// number count and the tense warn. A number is a digit run standing alone (100,000; 3.6; 10+; 2-person; a range 10–50 once), not 3D or i18n.
export const DUTY_OPENERS = ["responsible", "helped", "assisted", "participated", "worked", "involved", "tasked", "duties"];
export const MAX_NUMBERS = 3;
const NUMBER = /(?<![\w.])\d[\d,.]*(?:\+|%)?(?:[–-]\d[\d,.]*(?:\+|%)?)?(?![\w])/g;
export const numbersIn = (text: string): string[] => text.match(NUMBER) ?? [];
const PAST_IRREGULAR = ["built", "rebuilt", "wrote", "rewrote", "took", "cut", "ran", "chose", "made", "led", "set", "split", "drove", "kept", "read", "sent", "found", "held", "won", "grew", "brought", "gave", "got", "put", "sold", "taught", "thought", "spent", "met", "left", "lent", "laid", "began", "drew", "redrew", "ran", "shrank", "sped", "bound", "fed", "hid", "hit", "let", "lit", "shut", "slid", "stood", "struck", "swept", "threw", "undid", "wound", "sat", "overcame", "became", "came", "rose", "fell", "saw", "went", "did", "had", "paid", "said", "told", "understood", "withdrew", "broke", "froze", "ground", "clung", "flew", "forgave", "forbade", "hung", "knew", "lost", "shook", "shot", "sought", "sang", "stuck", "strove", "swung", "trod", "woke", "wove", "tore", "bore", "spun", "sprang", "stole"];
export function checkBullet(b: Bullet): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const first = (b.text.match(/^[A-Za-z]+/)?.[0] ?? "").toLowerCase();
  if (DUTY_OPENERS.includes(first)) errors.push(`[${b.key}] opens with a duty, not an active verb: "${b.text.slice(0, 40)}"`);
  const numbers = numbersIn(b.text);
  if (numbers.length > MAX_NUMBERS) warnings.push(`[${b.key}] has ${numbers.length} numbers (at most ${MAX_NUMBERS}): ${numbers.join(", ")}`);
  if (first && !first.endsWith("ed") && !PAST_IRREGULAR.includes(first)) warnings.push(`[${b.key}] may not open in the past tense: "${first}"`);
  return { errors, warnings };
}

export type Employment = "full-time" | "part-time" | "contract" | "freelance" | "independent";
export interface ProjectMeta {
  name: string; url?: string; role: string; employment: Employment; start: string; end?: string;
  naming: "public" | "first-name-only" | "nda"; description: string; keywords: string[];
}
export interface Project extends ProjectBody { slug: string; file: string; meta: ProjectMeta; warnings: string[] }
export interface Answer { file: string; question: string; text: string }
export interface Contact { location: string; email: string; github?: string; linkedin?: string }
export interface ProfileMeta {
  identity: { name: string; location?: string; timezone: string; constraints: string[] };
  contact: Contact;
  resume_order: string[];
  terms: Record<string, unknown>;
}
export interface Profile {
  root: string;
  files: ReturnType<typeof profilePaths>;
  profile: ProfileMeta | null;
  voice: Frontmatter | null;
  projects: Project[];
  answers: Answer[];
  errors: string[];
  warnings: string[];
}

export function profilePaths(root: string) {
  return {
    root,
    profile: path.join(root, "profile.md"),
    voice: path.join(root, "voice.md"),
    answers: path.join(root, "answers"),
    projects: path.join(root, "projects"),
    skills: path.join(root, "skills.md"),
  };
}

export function readProject(file: string): Project {
  const slug = path.basename(file, ".md");
  const empty = { overview: "", bullets: [], notes: [], warnings: [] };
  const art = readArtifact(file);
  if (!art) return { slug, file, meta: null as unknown as ProjectMeta, ...empty, errors: [`${file}: missing`] };
  const errors: string[] = art.frontmatter === null ? ["no YAML frontmatter"] : validate("project", art.frontmatter);
  const body = errors.length ? { ...empty, errors: [] } : parseProject(art.body);
  const warnings: string[] = [];
  for (const b of body.bullets) { const c = checkBullet(b); body.errors.push(...c.errors); warnings.push(...c.warnings); }
  const tag = (e: string) => `projects/${slug}.md: ${e}`;
  return { slug, file, meta: (art.frontmatter ?? {}) as unknown as ProjectMeta, ...body, errors: [...errors, ...body.errors].map(tag), warnings: warnings.map(tag) };
}

export function readProfile(root = path.join(repoRoot(), "profile")): Profile {
  const files = profilePaths(root);
  const errors: string[] = [];
  const profileArt = readArtifact(files.profile);
  if (!profileArt) errors.push("profile.md: missing");
  else errors.push(...validateArtifact("profile", profileArt).map((e) => `profile.md: ${e}`));
  const voiceArt = readArtifact(files.voice);
  if (!voiceArt) errors.push("voice.md: missing");
  else errors.push(...validateArtifact("voice", voiceArt).map((e) => `voice.md: ${e}`));
  const projectFiles = fs.existsSync(files.projects) ? fs.readdirSync(files.projects).filter((f) => f.endsWith(".md")).sort().map((f) => path.join(files.projects, f)) : [];
  const projects = projectFiles.map(readProject);
  for (const p of projects) errors.push(...p.errors);
  if (!projects.length) errors.push("projects/: no Project files");
  const answers: Answer[] = fs.existsSync(files.answers)
    ? fs.readdirSync(files.answers).filter((f) => f.endsWith(".md")).sort().map((f) => {
        const art = readArtifact(path.join(files.answers, f))!;
        const question = String(art.frontmatter?.question ?? "");
        if (!question) errors.push(`answers/${f}: no question in the frontmatter`);
        return { file: art.file, question, text: art.body.trim() };
      })
    : [];
  const meta = profileArt?.frontmatter as unknown as ProfileMeta | null;
  if (meta && !errors.some((e) => e.startsWith("profile.md"))) {
    const slugs = new Set(projects.map((p) => p.slug));
    for (const s of meta.resume_order) if (!slugs.has(s)) errors.push(`profile.md: resume_order names no Project file: ${s}`);
    for (const p of projects) if (!meta.resume_order.includes(p.slug)) errors.push(`profile.md: resume_order lacks the Project ${p.slug}`);
  }
  const ordered = meta?.resume_order ? [...projects].sort((a, b) => meta.resume_order.indexOf(a.slug) - meta.resume_order.indexOf(b.slug)) : projects;
  return { root, files, profile: meta && !errors.some((e) => e.startsWith("profile.md")) ? meta : null, voice: voiceArt?.frontmatter ?? null, projects: ordered, answers, errors, warnings: projects.flatMap((p) => p.warnings) };
}

// Skills derive from the Projects' keywords: the canonical name is the keyword as the first Project in
// resume order spells it. A term names a Skill by exact, case-insensitive equality; nothing else.
export interface Skill { name: string; evidence: string[] }

export function skills(profile: Profile): Skill[] {
  const byKey = new Map<string, Skill>();
  for (const p of profile.projects) {
    if (p.errors.length) continue;
    for (const term of p.meta.keywords ?? []) {
      const k = term.toLowerCase();
      const row = byKey.get(k) ?? { name: term, evidence: [] };
      if (!row.evidence.includes(p.slug)) row.evidence.push(p.slug);
      byKey.set(k, row);
    }
  }
  return [...byKey.values()];
}

export function skillFor(profile: Profile, term: string): Skill | null {
  const k = String(term).trim().toLowerCase();
  return skills(profile).find((s) => s.name.toLowerCase() === k) ?? null;
}

// skills.md: every Skill with the Projects that prove it, by name. Generated; nothing reads it.
export function renderSkills(profile: Profile): string {
  const rows = skills(profile).sort((a, b) => a.name.localeCompare(b.name));
  const out = ["# Skills", "", "Generated by `npm run build` from the Projects' `keywords`. Do not edit; nothing reads this file.", "", `${rows.length} Skills.`, "", "| skill | evidence |", "| --- | --- |"];
  for (const r of rows) out.push(`| ${r.name} | ${r.evidence.join(", ")} |`);
  return out.join("\n") + "\n";
}
