// The Profile reader: the one implementation that parses the authored Markdown (profile.md, voice.md,
// answers/, projects/), collects the Keywords from the Projects' Keywords sections, and runs the Profile check
// on profile.md, voice.md and the Answers. A Project file is read as written and never invalid.
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

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

export function splitFrontmatter(text: string): Omit<Artifact, "file"> {
  const m = FRONTMATTER.exec(text);
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

// Schemas: profile and voice live in profile/schemas; a consumer registers its own directory.
export type SchemaName = "profile" | "voice" | (string & {});
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

// A Project file: frontmatter with url, role, employment, start and end, read as written; the name in the
// `# h1`; `## Description` prose; `## Keywords` lines of backtick Keywords, the Project's Keywords, once each
// in file order; each `###` heading one Bullet, addressed by the heading's anchor, its text ending at the
// next heading or `***`; `## Notes` raw lines. Anything else is skipped, nothing is refused.
export const META_KEYS = ["url", "role", "employment", "start", "end"] as const;
export type ProjectMeta = Partial<Record<(typeof META_KEYS)[number], string>>;
export interface Bullet { anchor: string; title: string; text: string }
export interface ProjectBody { name: string; meta: ProjectMeta; description: string; bullets: Bullet[]; keywords: string[]; notes: string[] }

const KEYWORD_LINE = /^`[^`]+`(?:\s*,\s*`[^`]+`)*\s*,?$/;

// The anchor a Markdown renderer gives a heading: lower case, punctuation dropped, spaces as hyphens, a
// repeat suffixed -1, -2.
function anchorOf(title: string, seen: Map<string, number>): string {
  const base = title.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-");
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

// Terms once each, case-insensitive, in the first spelling.
function unique(terms: string[]): string[] {
  const seen = new Set<string>();
  return terms.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

export function parseProject(text: string): ProjectBody {
  const m = FRONTMATTER.exec(text);
  const fm = (m ? YAML.parse(m[1], { schema: "failsafe" }) : null) as Record<string, unknown> | null;
  const meta: ProjectMeta = {};
  for (const k of META_KEYS) if (typeof fm?.[k] === "string") meta[k] = fm[k] as string;
  let name = "";
  const description: string[] = [];
  const bullets: (Bullet & { lines: string[] })[] = [];
  const keywords: string[] = [];
  const notes: string[] = [];
  const anchors = new Map<string, number>();
  // A `##` other than Notes still holds Bullets; only its loose prose is skipped. The Keywords section ends
  // at its first Bullet.
  let section: "description" | "keywords" | "notes" | "other" | null = null;
  let bullet: (Bullet & { lines: string[] }) | null = null;
  for (const raw of (m ? m[2] : text).split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h?.[1] === "#") { if (!name) name = h[2].trim(); continue; }
    if (h?.[1] === "##") {
      const title = h[2].trim();
      section = title === "Description" ? "description" : title === "Keywords" ? "keywords" : title === "Notes" ? "notes" : "other";
      bullet = null; continue;
    }
    if (section === "notes") { if (line) notes.push(raw.trimEnd()); continue; }
    if (h) {
      const title = h[2].trim();
      if (section === "keywords") section = "other";
      bullet = { anchor: anchorOf(title, anchors), title, text: "", lines: [] };
      bullets.push(bullet); continue;
    }
    if (section === "keywords" && KEYWORD_LINE.test(line)) {
      keywords.push(...[...line.matchAll(/`([^`]+)`/g)].map((t) => t[1].trim()).filter(Boolean));
      continue;
    }
    if (line === "***") { bullet = null; continue; }
    if (bullet) bullet.lines.push(line);
    else if (section === "description") description.push(line);
  }
  const prose = (lines: string[]) => lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return {
    name, meta, description: prose(description),
    bullets: bullets.map(({ lines, ...b }) => ({ ...b, text: prose(lines) })),
    keywords: unique(keywords), notes,
  };
}

export interface Project extends ProjectBody { slug: string; file: string }
export interface Answer { file: string; question: string; text: string }
export interface Contact { email: string; github?: string; linkedin?: string }
export interface ProfileMeta {
  identity: { name: string; location?: string; timezone: string; constraints: string[] };
  contact: Contact;
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
  };
}

export function readProject(file: string): Project {
  return { slug: path.basename(file, ".md"), file, ...parseProject(fs.readFileSync(file, "utf8")) };
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
  const answers: Answer[] = fs.existsSync(files.answers)
    ? fs.readdirSync(files.answers).filter((f) => f.endsWith(".md")).sort().map((f) => {
        const art = readArtifact(path.join(files.answers, f))!;
        const question = String(art.frontmatter?.question ?? "");
        if (!question) errors.push(`answers/${f}: no question in the frontmatter`);
        return { file: art.file, question, text: art.body.trim() };
      })
    : [];
  const meta = profileArt?.frontmatter as unknown as ProfileMeta | null;
  return { root, files, profile: meta && !errors.some((e) => e.startsWith("profile.md")) ? meta : null, voice: voiceArt?.frontmatter ?? null, projects, answers, errors };
}

// The Keywords of every Project, once each, spelled as the first Project in filename order
// spells them. A term names a Keyword by exact, case-insensitive equality; nothing else.
export function keywords(profile: Pick<Profile, "projects">): string[] {
  return unique(profile.projects.flatMap((p) => p.keywords));
}
