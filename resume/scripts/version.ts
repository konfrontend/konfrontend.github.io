// A Version as stored today: a selection over the Profile by Bullet key, validated against it, plus
// the entry heading formatters a render uses. Reads the Profile through profile/lib only.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readArtifact, registerSchemaDir, validateArtifact, skills, type Bullet, type Contact, type Employment, type Profile, type Project, type ProjectMeta } from "../../profile/lib/index.ts";

export const RESUME_SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
registerSchemaDir(RESUME_SCRIPTS);

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
      for (const k of keys) if (!p.bullets.some((b) => b.key === k)) errors.push(`${rel}: ${slug} has no Bullet [${k}]`);
    }
  }
  return { file, title: String(fm.title ?? ""), summary: String(fm.summary ?? "").trim(), skills: fm.skills ?? [], projects, errors };
}

// The selected Bullets of a Version, in resume order, each Project with its meta.
export function selection(version: Version, profile: Profile): { project: Project; bullets: Bullet[] }[] {
  return profile.projects.filter((p) => version.projects[p.slug]).map((project) => ({
    project,
    bullets: version.projects[project.slug].map((k) => project.bullets.find((b) => b.key === k)!).filter(Boolean),
  }));
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
