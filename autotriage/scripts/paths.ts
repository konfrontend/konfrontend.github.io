// Where the plugin and the data live. The data is the project the session runs in: the Profile in
// `profile/`, the Candidates in `private/candidates/`, the Versions in `resume/versions/`.
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJECT_DIR = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
export const PROFILE_ROOT = path.join(PROJECT_DIR, "profile");
export const CANDIDATES_DIR = path.join(PROJECT_DIR, "private", "candidates");
export const VERSIONS_DIR = path.join(PROJECT_DIR, "resume", "versions");
export const GENERAL_VERSION = path.join(VERSIONS_DIR, "general.md");
