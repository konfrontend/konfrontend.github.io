// Shared helpers for guards, hooks, and the verdict script.
// Artifacts are Markdown with YAML frontmatter; schemas live in scripts/schemas.
import fs from "node:fs";
import path from "node:path";
import { YAML, Ajv } from "./vendor/deps.mjs";
import { PLUGIN_ROOT, DATA, PROFILE_DIR, CANDIDATES_DIR } from "./paths.mjs";

export { PLUGIN_ROOT, DATA, PROFILE_DIR, CANDIDATES_DIR };

export class Refusal extends Error {
  constructor(message) {
    super(message);
    this.name = "Refusal";
  }
}

export function refuse(state, reason, next) {
  const lines = [`autotriage: ${state} refused. ${reason}`];
  if (next) lines.push(next);
  throw new Refusal(lines.join("\n"));
}

export function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!m) return { frontmatter: null, body: text, raw: null };
  return { frontmatter: YAML.parse(m[1]) ?? {}, body: m[2], raw: m[1] };
}

export function readArtifact(file) {
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  return { file, ...splitFrontmatter(text) };
}

export function writeArtifact(file, frontmatter, body) {
  const fm = YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\n${fm}\n---\n${body ?? ""}`);
}

const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: false });
const compiled = new Map();

export function schemaFor(name) {
  if (!compiled.has(name)) {
    const file = path.join(PLUGIN_ROOT, "scripts", "schemas", `${name}.schema.json`);
    compiled.set(name, ajv.compile(JSON.parse(fs.readFileSync(file, "utf8"))));
  }
  return compiled.get(name);
}

// Returns [] when valid, else human-readable error lines. "job" resolves to the route's schema.
export function validate(name, data) {
  const check = schemaFor(name === "job" ? jobSchemaFor(data) : name);
  if (check(data)) return [];
  return check.errors.map((e) => `${e.instancePath || "/"} ${e.message}`);
}

export const ROUTES = ["freelance", "employment"];

// A job.md validates against the schema its route names. A missing or unknown route falls to the
// freelance schema, whose required `route: freelance` then reports it.
export function jobSchemaFor(frontmatter) {
  return frontmatter?.route === "employment" ? "job-employment" : "job-freelance";
}

// Route inference for intake, the way it infers the timezone: a paste whose first line is the
// freelancer's parameter line with a money figure is freelance; a posting that reads as a job ad
// (employment type, salary, remote policy, benefits) is employment. Returns the route and whether it
// was inferred, or null when the text decides nothing and intake must ask.
export function inferRoute(text) {
  const t = String(text ?? "");
  const stated = /^\s*route:\s*(freelance|employment)\s*$/im.exec(t);
  if (stated) return { route: stated[1], inferred: false };
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
export function schemaForPath(file) {
  const rel = path.relative(DATA, path.resolve(file)).split(path.sep).join("/");
  if (rel.startsWith("..")) return null;
  if (rel === "profile/profile.md") return "profile";
  if (rel === "profile/voice.md") return "voice";
  if (rel === "profile/skills.md") return "skills";
  if (/^profile\/jobs\/[^/]+\.md$/.test(rel)) return "project";
  if (/^candidates\/[^/]+\/job\.md$/.test(rel)) return "job";
  if (/^candidates\/[^/]+\/letter\.md$/.test(rel)) return "letter";
  if (/^candidates\/[^/]+\/cover-letter\.md$/.test(rel)) return "cover-letter";
  return null;
}

export function loadCatalogue(name) {
  const file = path.join(PLUGIN_ROOT, "catalogue", `${name}.md`);
  return readArtifact(file).frontmatter;
}

export function candidateDir(candidate) {
  if (!candidate || !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(candidate)) return null;
  return path.join(CANDIDATES_DIR, candidate);
}

export function listCandidates() {
  if (!fs.existsSync(CANDIDATES_DIR)) return [];
  return fs.readdirSync(CANDIDATES_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}-/.test(d)).sort();
}

export const LEDGER_FILE = path.join(PROFILE_DIR, "skills.md");

// The Skill ledger (ADR 0003): null when the file is missing, else the artifact plus its schema errors.
export function readLedger(file = LEDGER_FILE) {
  const art = readArtifact(file);
  if (!art) return null;
  const errors = art.frontmatter === null ? ["no YAML frontmatter"] : validate("skills", art.frontmatter);
  return { ...art, errors };
}

export function listProjects() {
  const dir = path.join(PROFILE_DIR, "jobs");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f));
}
