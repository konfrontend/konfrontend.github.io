// Where the plugin and the data live. The data is `data/` of the project the session runs in (ADR 0004).
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
export const DATA = path.join(PROJECT_DIR, "data");
export const PROFILE_DIR = path.join(DATA, "profile");
export const PROJECTS_DIR = path.join(DATA, "projects");
export const CANDIDATES_DIR = path.join(DATA, "candidates");
// The general and frontend Versions (`versions/<name>.md`) sit beside `data/`, at the project root.
export const VERSIONS_DIR = path.join(PROJECT_DIR, "versions");
