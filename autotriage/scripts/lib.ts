// Shared helpers for the triage scripts and the write hook: the Flags, the catalogue, the Profile schema of a
// path. The Profile is read through profile/lib, never parsed here.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readArtifact, readProfile, repoRoot, type Frontmatter, type Profile } from "../../profile/lib/index.ts";

// The catalogue ships with this module; the Profile resolves from the repo root.
const AUTOTRIAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export { readArtifact, keywords } from "../../profile/lib/index.ts";

export type Route = "freelance" | "employment";

// Which Profile schema a path validates against, or null when the path is not one. A Project file has
// none.
export function schemaForPath(file: string): "profile" | null {
  const rel = path.relative(path.join(repoRoot(), "profile"), path.resolve(file)).split(path.sep).join("/");
  return rel === "profile.md" ? "profile" : null;
}

export function loadCatalogue(name: string): Frontmatter {
  const file = path.join(AUTOTRIAGE_ROOT, "catalogue", `${name}.md`);
  const art = readArtifact(file);
  if (!art?.frontmatter) throw new Error(`catalogue/${name}.md is missing or has no frontmatter`);
  return art.frontmatter;
}

export interface Flag { id: string; level?: number; kind?: "risk" | "green" | "stop"; routes?: Route[] }

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
