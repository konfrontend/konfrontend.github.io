// Shared helpers for the Guard, the hooks and the State scripts: refusals, the Routes, route inference,
// the Flags and the catalogue. The Profile is read through profile/lib, never parsed here; the Candidates
// through candidate.ts.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerSchemaDir, readArtifact, readProfile, repoRoot, validate as validateSchema, type Frontmatter, type Profile } from "../../profile/lib/index.ts";

// The catalogue and the schemas ship with this module; the data resolves from the repo root.
export const AUTOTRIAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

// The Letter template a route fills.
export function templateFor(route: unknown): "letter-freelance" | "letter-employment" {
  return route === "employment" ? "letter-employment" : "letter-freelance";
}

// Returns [] when valid, else human-readable error lines.
export function validate(name: string, data: unknown): string[] {
  return validateSchema(name, data);
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

// Which Profile schema a path validates against, or null when the path is not a Profile file. The
// Candidate half is candidateSchemaForPath in candidate.ts.
export function schemaForPath(file: string): "profile" | "voice" | "project" | null {
  const rel = path.relative(path.join(repoRoot(), "profile"), path.resolve(file)).split(path.sep).join("/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (rel === "profile.md") return "profile";
  if (rel === "voice.md") return "voice";
  if (/^projects\/[^/]+\.md$/.test(rel)) return "project";
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

let cached: Profile | null = null;
// The Profile of the project, read once per process.
export function profile(): Profile {
  return (cached ??= readProfile());
}
