// Shared helpers for the Guard, the hooks and the State scripts. The Profile is read through
// profile/lib, never parsed here; this file owns the Candidate artifacts and the catalogue.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerSchemaDir, readArtifact, readProfile, validate as validateSchema, type Artifact, type Frontmatter, type Profile } from "../../profile/lib/index.ts";

// Where the catalogue and the schemas live, and where the data lives: the project the session runs in,
// with the Profile in `profile/`, the Candidates in `private/candidates/`, the Versions in `resume/versions/`.
export const AUTOTRIAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
export const PROFILE_ROOT = path.join(PROJECT_DIR, "profile");
export const CANDIDATES_DIR = path.join(PROJECT_DIR, "private", "candidates");
export const VERSIONS_DIR = path.join(PROJECT_DIR, "resume", "versions");
export const GENERAL_VERSION = path.join(VERSIONS_DIR, "general.md");

registerSchemaDir(path.join(AUTOTRIAGE_ROOT, "schemas"));

export { readArtifact, writeArtifact, splitFrontmatter, readProfile, skills, skillFor } from "../../profile/lib/index.ts";
export type { Artifact, Frontmatter, Profile, Project, Story, Bullet, Skill } from "../../profile/lib/index.ts";
export { readVersion, versionSkillTerms, type Version } from "../../resume/scripts/version.ts";

export class Refusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Refusal";
  }
}

export function refuse(state: string, reason: string, next?: string | null): never {
  const lines = [`autotriage: ${state} refused. ${reason}`];
  if (next) lines.push(next);
  throw new Refusal(lines.join("\n"));
}

export type Route = "freelance" | "employment";
export const ROUTES: Route[] = ["freelance", "employment"];

// The Candidate's files (catalogue/candidate-artifacts.md): job.md, letter.md on both routes, version.md when tailored.
export const JOB_FILE = "job.md";
export const LETTER_FILE = "letter.md";
export const VERSION_FILE = "version.md";

// The Letter template a route fills.
export function templateFor(route: unknown): "letter-freelance" | "letter-employment" {
  return route === "employment" ? "letter-employment" : "letter-freelance";
}

// Returns [] when valid, else human-readable error lines.
export function validate(name: string, data: unknown): string[] {
  return validateSchema(name, data);
}

// A Letter is body only: its "frontmatter" validates as null against letter.schema.json, so a Letter that
// carries frontmatter fails there. Every other artifact needs frontmatter.
export function validateArtifact(name: string, art: Pick<Artifact, "frontmatter" | "body">): string[] {
  if (name === "letter") return art.frontmatter === null ? [] : ["letter.md carries frontmatter; a Letter is body only"];
  if (art.frontmatter === null) return ["no YAML frontmatter"];
  return validateSchema(name, art.frontmatter);
}

// Route inference for intake, the way it infers the timezone: a paste whose first line is the
// freelancer's parameter line with a money figure is freelance; a posting that reads as a job ad
// (employment type, salary, remote policy, benefits) is employment. Returns the route and whether it
// was inferred, or null when the text decides nothing and intake must ask.
export function inferRoute(text: string): { route: Route; inferred: boolean } | null {
  const t = String(text ?? "");
  const stated = /^\s*route:\s*(freelance|employment)\s*$/im.exec(t);
  if (stated) return { route: stated[1] as Route, inferred: false };
  const firstLine = t.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const parameterLine = /^[^\n]{0,80}$/.test(firstLine) && /(?:^|[,\s])(?:\$|USD\s?)\d/i.test(firstLine) && /,/.test(firstLine);
  if (parameterLine) return { route: "freelance", inferred: true };
  const freelanceCues = /\b(upwork|hourly rate|fixed[- ]price|proposal|bid|freelancer|per hour|\/h(?:r|our)?\b)/i;
  const employmentCues = /\b(full[- ]time|part[- ]time|permanent|salary|compensation|benefits|b2b|remote-first|on-site|hybrid|paid vacation|vacation days|health insurance|probation|requirements:?|we offer|what we offer|about the role|about the position|apply)\b/i;
  const f = (t.match(new RegExp(freelanceCues.source, "gi")) ?? []).length;
  const e = (t.match(new RegExp(employmentCues.source, "gi")) ?? []).length;
  if (e > f) return { route: "employment", inferred: true };
  if (f > e) return { route: "freelance", inferred: true };
  return null;
}

// Which schema an artifact path validates against, or null when the path is not an artifact.
export function schemaForPath(file: string): string | null {
  const abs = path.resolve(file);
  const under = (root: string) => { const rel = path.relative(root, abs).split(path.sep).join("/"); return rel.startsWith("..") || path.isAbsolute(rel) ? null : rel; };
  const p = under(PROFILE_ROOT);
  if (p !== null) {
    if (p === "profile.md") return "profile";
    if (p === "voice.md") return "voice";
    if (/^projects\/[^/]+\.md$/.test(p)) return "project";
    return null;
  }
  const c = under(CANDIDATES_DIR);
  if (c !== null) {
    if (/^[^/]+\/job\.md$/.test(c)) return "job";
    if (/^[^/]+\/letter\.md$/.test(c)) return "letter";
    return null;
  }
  return null;
}

export function loadCatalogue(name: string): Frontmatter {
  const file = path.join(AUTOTRIAGE_ROOT, "catalogue", `${name}.md`);
  const art = readArtifact(file);
  if (!art?.frontmatter) throw new Error(`catalogue/${name}.md is missing or has no frontmatter`);
  return art.frontmatter;
}

export interface Flag { id: string; level?: number; kind?: "risk" | "green" | "stop"; routes?: Route[]; slot?: string; safeguard?: string }

// The Flags of one route (catalogue/flags.md `routes`). A missing or unknown route reads as freelance.
export function flagsFor(route: unknown): Flag[] {
  const r: Route = route === "employment" ? "employment" : "freelance";
  return (loadCatalogue("flags").flags as Flag[]).filter((f) => (f.routes ?? []).includes(r));
}

export function candidateDir(candidate: string | undefined): string | null {
  if (!candidate || !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(candidate)) return null;
  return path.join(CANDIDATES_DIR, candidate);
}

export function listCandidates(dir = CANDIDATES_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
}

let cached: Profile | null = null;
// The Profile of the project, read once per process.
export function profile(): Profile {
  return (cached ??= readProfile(PROFILE_ROOT));
}

// The Version a Candidate is sent with: its own version.md when one was tailored, else the general Version.
export function versionFile(dir: string): string {
  const own = path.join(dir, VERSION_FILE);
  return fs.existsSync(own) ? own : GENERAL_VERSION;
}
export function versionName(dir: string): "tailored" | "general" {
  return fs.existsSync(path.join(dir, VERSION_FILE)) ? "tailored" : "general";
}
