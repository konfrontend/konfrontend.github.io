// The Candidate contract (catalogue/candidate-artifacts.md): the folder layout and listing, the job.md read
// with its schema errors, the Letter rule, the Version a Candidate is sent with, the Candidate paths the
// write hook validates, and the two writes, intake's job.md and the Checkpoint's fields. Every reader and
// writer of a Candidate goes through here; the folder resolves from the repo root.
import fs from "node:fs";
import path from "node:path";
import { readArtifact, writeArtifact, validate, refuse, type Artifact, type Frontmatter, type Route } from "./lib.ts";
import { repoRoot } from "../../profile/lib/index.ts";

const FILES = { job: "job.md", letter: "letter.md", version: "version.md" } as const;
const FOLDER = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;

export const candidatesDir = (): string => path.join(repoRoot(), "private", "candidates");
export const generalVersion = (): string => path.join(repoRoot(), "resume", "versions", "general.md");

export function candidateDir(candidate: string | undefined): string | null {
  if (!candidate || !FOLDER.test(candidate)) return null;
  return path.join(candidatesDir(), candidate);
}

// The dated Candidate folders, sorted; the archive and anything else undated is skipped.
export function listCandidates(dir = candidatesDir()): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
}

export function candidateFiles(dir: string): { job: string; letter: string; version: string } {
  return { job: path.join(dir, FILES.job), letter: path.join(dir, FILES.letter), version: path.join(dir, FILES.version) };
}

export interface JobFields {
  title: string; route: Route; timezone: string; location?: string; company?: string; employment?: string;
  verdict?: "go" | "no-go"; requirements?: string[]; flags?: string[]; outcome?: string;
}
export interface Job extends Artifact { frontmatter: (JobFields & Frontmatter) | null; errors: string[] }

export function jobErrors(art: Pick<Artifact, "frontmatter">): string[] {
  return art.frontmatter === null ? ["no YAML frontmatter"] : validate("job", art.frontmatter);
}

// A Candidate's job.md with its schema errors, or null when the file is missing.
export function readJob(dir: string): Job | null {
  const art = readArtifact(candidateFiles(dir).job);
  return art && { ...art, frontmatter: art.frontmatter as Job["frontmatter"], errors: jobErrors(art) };
}

// The Letter rule: a Letter is body only, on both routes; an empty body is a resume-only application.
export function letterErrors(art: Pick<Artifact, "frontmatter">): string[] {
  return art.frontmatter === null ? [] : ["letter.md carries frontmatter; a Letter is body only"];
}

export function readLetter(dir: string): (Artifact & { errors: string[] }) | null {
  const art = readArtifact(candidateFiles(dir).letter);
  return art && { ...art, errors: letterErrors(art) };
}

// The Version a Candidate is sent with: its own version.md when one was tailored, else the general Version.
export function versionName(dir: string): "tailored" | "general" {
  return fs.existsSync(candidateFiles(dir).version) ? "tailored" : "general";
}
export function versionFile(dir: string): string {
  return versionName(dir) === "tailored" ? candidateFiles(dir).version : generalVersion();
}

// Which Candidate file a path is, for the write hook, or null when the path is not one.
export function candidateSchemaForPath(file: string): "job" | "letter" | null {
  const rel = path.relative(candidatesDir(), path.resolve(file)).split(path.sep).join("/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (/^[^/]+\/job\.md$/.test(rel)) return "job";
  if (/^[^/]+\/letter\.md$/.test(rel)) return "letter";
  return null;
}

export function candidateErrors(kind: "job" | "letter", art: Pick<Artifact, "frontmatter">): string[] {
  return kind === "job" ? jobErrors(art) : letterErrors(art);
}

const shown = (dir: string) => path.relative(repoRoot(), dir).split(path.sep).join("/");

function requireDir(state: string, candidate: string | undefined): string {
  const dir = candidateDir(candidate);
  if (!dir) refuse(state, `needs a Candidate folder name YYYY-MM-DD-<slug>${candidate ? ` (got "${candidate}")` : ""}.`, null);
  return dir;
}

function writeJob(state: string, dir: string, fields: Frontmatter, body: string): void {
  const errors = validate("job", fields);
  if (errors.length) refuse(state, `job.md would be invalid:\n  ${errors.join("\n  ")}`, "Nothing was written.");
  writeArtifact(candidateFiles(dir).job, fields, body);
}

// Intake's write: a new Candidate folder with the identity fields and the paste verbatim as the body.
export function writeIntake(candidate: string | undefined, fields: Frontmatter, paste: string): string {
  const dir = requireDir("intake", candidate);
  if (fs.existsSync(dir)) refuse("intake", `${shown(dir)} already exists; an existing Candidate is never overwritten.`, "Add a distinguishing word to the slug.");
  writeJob("intake", dir, fields, paste);
  return `Wrote ${shown(candidateFiles(dir).job)}`;
}

export interface Checkpoint { verdict: string; requirements: string[]; flags?: string[] }

// The Checkpoint's write: verdict, requirements and, on the freelance route, flags, replacing earlier ones.
// A freelance Checkpoint names its flags, none included, so a forgotten argument never drops the Flags.
export function writeCheckpoint(candidate: string | undefined, { verdict, requirements, flags }: Checkpoint): string {
  const dir = requireDir("triage", candidate);
  const job = readJob(dir);
  if (!job) refuse("triage", `${shown(candidateFiles(dir).job)} is missing.`, "Run /route-intake first.");
  if (job.frontmatter === null) refuse("triage", `${shown(candidateFiles(dir).job)} has no frontmatter.`, "Run /route-intake again or fix the file by hand.");
  const { flags: _, ...rest } = job.frontmatter;
  if (rest.route === "freelance" && flags === undefined) refuse("triage", "a freelance Checkpoint names its flags.", "Pass --flags with every triggered id, or --flags \"\" when none triggered.");
  const fields: Frontmatter = { ...rest, verdict, requirements, ...(flags === undefined ? {} : { flags }) };
  writeJob("triage", dir, fields, job.body);
  return `Wrote the Checkpoint into ${shown(candidateFiles(dir).job)}: verdict ${verdict}`;
}
