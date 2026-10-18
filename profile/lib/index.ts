// The Profile reader: the one implementation that parses the authored Markdown (profile.md, voice.md,
// answers/, projects/), derives the Skills from the Projects' keywords, and builds the Master and the
// Skill ledger as pure functions. Every consumer (the autotriage plugin, the resume renderer) imports
// from here and never parses a Profile file itself.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { Ajv, type ValidateFunction } from "ajv";

export const LIB_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = path.resolve(LIB_ROOT, "..");
export const SCHEMAS_DIR = path.join(DEFAULT_ROOT, "schemas");

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

// Schemas: profile, project, voice, version live in profile/schemas; a consumer may register its own.
export type SchemaName = "profile" | "project" | "voice" | "version" | (string & {});
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

// Stories: `**Theme**` lines group them; each Story is `- [key] Bullet`, its Facts the indented lines beneath.
export interface Story { key: string; theme: string | null; lead: string; context: string | null }
export interface Theme { name: string | null; stories: Story[] }
const KEY = /^\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\s+(.*)$/s;

export function parseStories(body: string): { themes: Theme[]; errors: string[] } {
  const themes: Theme[] = [];
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const block of (body ?? "").trim().split(/\n\s*\n+/)) {
    const m = /^\*\*([^*]+)\*\*$/.exec(block.trim());
    if (m) { themes.push({ name: m[1], stories: [] }); continue; }
    if (!/^- /.test(block)) continue;
    if (!themes.length) themes.push({ name: null, stories: [] });
    const theme = themes[themes.length - 1];
    for (const item of block.split(/\n(?=- )/)) {
      const [first, ...rest] = item.replace(/^- /, "").split(/\n\s+/);
      const km = KEY.exec(first.trim());
      if (!km) { errors.push(`Story without a key: "${first.trim().slice(0, 60)}"`); continue; }
      if (keys.has(km[1])) errors.push(`duplicate Story key [${km[1]}]`);
      keys.add(km[1]);
      theme.stories.push({ key: km[1], theme: theme.name, lead: km[2].trim(), context: rest.map((l) => l.trim()).join(" ") || null });
    }
  }
  return { themes, errors };
}

export type Employment = "full-time" | "part-time" | "contract" | "freelance" | "independent";
export interface ProjectMeta {
  name: string; url?: string; role: string; employment: Employment; start: string; end?: string;
  naming: "public" | "first-name-only" | "nda"; domain?: string; description: string; keywords: string[];
}
export interface Project { slug: string; file: string; meta: ProjectMeta; themes: Theme[]; stories: Story[]; errors: string[] }
export interface Answer { file: string; question: string; text: string }
export interface Contact { location: string; email: string; github?: string; linkedin?: string }
export interface ProfileMeta {
  identity: { name: string; location?: string; timezone: string; constraints: string[] };
  contact: Contact;
  resume_order: string[];
  refused_stacks: string[]; niche?: string[]; interests?: string[]; avoid?: string[];
  family_precedence: string[]; word_cap: number;
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
}

export function profilePaths(root: string) {
  return {
    root,
    profile: path.join(root, "profile.md"),
    voice: path.join(root, "voice.md"),
    answers: path.join(root, "answers"),
    projects: path.join(root, "projects"),
    master: path.join(root, "master.md"),
    ledger: path.join(root, "skills.md"),
  };
}

export function readProject(file: string): Project {
  const slug = path.basename(file, ".md");
  const art = readArtifact(file);
  const errors: string[] = [];
  if (!art) return { slug, file, meta: null as unknown as ProjectMeta, themes: [], stories: [], errors: [`${file}: missing`] };
  if (art.frontmatter === null) errors.push("no YAML frontmatter");
  else errors.push(...validate("project", art.frontmatter));
  const { themes, errors: storyErrors } = errors.length ? { themes: [], errors: [] } : parseStories(art.body);
  errors.push(...storyErrors);
  return { slug, file, meta: (art.frontmatter ?? {}) as unknown as ProjectMeta, themes, stories: themes.flatMap((t) => t.stories), errors: errors.map((e) => `projects/${slug}.md: ${e}`) };
}

export function readProfile(root = DEFAULT_ROOT): Profile {
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
  return { root, files, profile: meta && !errors.some((e) => e.startsWith("profile.md")) ? meta : null, voice: voiceArt?.frontmatter ?? null, projects: ordered, answers, errors };
}

// Skills derive from the Projects' keywords: the canonical name is the keyword as the first Project in
// resume order spells it. A term names a Skill by exact, case-insensitive equality; nothing else.
export interface Skill { name: string; level: "shipped" | "gap"; evidence: string[]; seen: number }

export function skills(profile: Profile): Skill[] {
  const byKey = new Map<string, Skill>();
  for (const p of profile.projects) {
    if (p.errors.length) continue;
    for (const term of p.meta.keywords ?? []) {
      const k = term.toLowerCase();
      const row = byKey.get(k) ?? { name: term, level: "shipped" as const, evidence: [], seen: 0 };
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

export interface Requirement { candidate: string; requirements: string[] }

// Seen counts Candidates, not mentions; a requirement no Project proves is a Gap, spelled as first seen.
export function ledger(profile: Profile, reqs: Requirement[]): Skill[] {
  const rows = skills(profile);
  const byKey = new Map(rows.map((r) => [r.name.toLowerCase(), r]));
  for (const { requirements } of reqs) {
    const once = new Set<string>();
    for (const term of requirements ?? []) {
      const k = String(term).trim().toLowerCase();
      if (!k || once.has(k)) continue;
      once.add(k);
      let row = byKey.get(k);
      if (!row) { row = { name: String(term).trim(), level: "gap", evidence: [], seen: 0 }; byKey.set(k, row); rows.push(row); }
      row.seen += 1;
    }
  }
  const order = (a: Skill, b: Skill) => (a.level === b.level ? 0 : a.level === "gap" ? -1 : 1) || b.seen - a.seen || a.name.localeCompare(b.name);
  return rows.sort(order);
}

export function renderLedger(rows: Skill[]): string {
  const gaps = rows.filter((r) => r.level === "gap");
  const shipped = rows.filter((r) => r.level === "shipped");
  const out = ["# Skill ledger", "", "Generated by `npm run build -w profile` from the Projects' `keywords` and the Candidates' `requirements`. Do not edit; nothing reads this file.", ""];
  out.push(`## Gaps (${gaps.length})`, "", "Required by a Candidate, proved by no Project.", "", "| skill | seen |", "| --- | --- |");
  for (const r of gaps) out.push(`| ${r.name} | ${r.seen} |`);
  out.push("", `## Shipped (${shipped.length})`, "", "| skill | seen | evidence |", "| --- | --- | --- |");
  for (const r of shipped) out.push(`| ${r.name} | ${r.seen} | ${r.evidence.join(", ")} |`);
  return out.join("\n") + "\n";
}

// Candidate requirements, read from every dated Candidate folder's job.md; the plugin owns the schema,
// this reads one field.
export function readCandidateRequirements(candidatesRoot: string): { requirements: Requirement[]; warnings: string[] } {
  const requirements: Requirement[] = [];
  const warnings: string[] = [];
  if (!fs.existsSync(candidatesRoot)) return { requirements, warnings };
  for (const candidate of fs.readdirSync(candidatesRoot).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort()) {
    const job = readArtifact(path.join(candidatesRoot, candidate, "job.md"));
    if (!job || job.frontmatter === null) { warnings.push(`${candidate}: job.md is missing or has no frontmatter`); continue; }
    const req = job.frontmatter.requirements;
    requirements.push({ candidate, requirements: Array.isArray(req) ? req.map(String) : [] });
  }
  return { requirements, warnings };
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

// The Master: every Story of every Project in resume order, the contact line and every Skill. Generated;
// a Version selects from it by Story key.
export function master(profile: Profile): string {
  const meta = profile.profile;
  if (!meta) throw new Error(`profile.md is missing or invalid:\n  ${profile.errors.join("\n  ")}`);
  const out = [`# ${meta.identity.name}`, "", contactLine(meta.contact), "", "## Skills", "", skills(profile).map((s) => s.name).join(", "), ""];
  const section = (title: string, projects: Project[]) => {
    if (!projects.length) return;
    out.push(`## ${title}`, "");
    for (const p of projects) {
      out.push(`### ${projectName(p.meta)} | ${roleLine(p.meta)} | ${period(p.meta)}`, "", p.meta.description, "");
      for (const t of p.themes) {
        if (t.name) out.push(`**${t.name}**`, "");
        for (const s of t.stories) out.push(`- [${s.key}] ${s.lead}`);
        if (t.stories.length) out.push("");
      }
    }
  };
  const valid = profile.projects.filter((p) => !p.errors.length);
  section("Professional Experience", valid.filter((p) => isExperience(p.meta)));
  section("Projects", valid.filter((p) => !isExperience(p.meta)));
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// A Version: a selection over the Profile, validated against it.
export interface Version { file: string; title: string; summary: string; skills: string[]; projects: Record<string, string[]>; errors: string[] }

export function versionSkillTerms(lines: string[]): string[] {
  return lines.flatMap((l) => l.replace(/^[^:]+: /, "").split(", ").map((t) => t.trim()).filter(Boolean));
}

export function readVersion(file: string, profile: Profile): Version {
  const art = readArtifact(file);
  const errors: string[] = [];
  const rel = path.basename(file);
  if (!art) return { file, title: "", summary: "", skills: [], projects: {}, errors: [`${rel}: missing`] };
  errors.push(...validateArtifact("version", art).map((e) => `${rel}: ${e}`));
  const fm = (art.frontmatter ?? {}) as Partial<Version>;
  const projects = (fm.projects ?? {}) as Record<string, string[]>;
  if (!errors.length) {
    const known = skills(profile).map((s) => s.name.toLowerCase());
    for (const term of versionSkillTerms(fm.skills ?? [])) if (!known.includes(term.toLowerCase())) errors.push(`${rel}: Skills term is not a Project keyword: ${term}`);
    for (const [slug, keys] of Object.entries(projects)) {
      const p = profile.projects.find((x) => x.slug === slug);
      if (!p) { errors.push(`${rel}: no Project file for ${slug}`); continue; }
      for (const k of keys) if (!p.stories.some((s) => s.key === k)) errors.push(`${rel}: ${slug} has no Story [${k}]`);
    }
  }
  return { file, title: String(fm.title ?? ""), summary: String(fm.summary ?? "").trim(), skills: fm.skills ?? [], projects, errors };
}

// The selected Stories of a Version, in resume order, each Project with its meta.
export function selection(version: Version, profile: Profile): { project: Project; stories: Story[] }[] {
  return profile.projects.filter((p) => version.projects[p.slug]).map((project) => ({
    project,
    stories: version.projects[project.slug].map((k) => project.stories.find((s) => s.key === k)!).filter(Boolean),
  }));
}
