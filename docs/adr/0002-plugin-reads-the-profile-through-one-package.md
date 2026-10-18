---
status: accepted
---
# The plugin reads the Profile through @konfrontend/profile and vendors nothing

The autotriage plugin, the resume renderer and the Profile tooling share one reader, `profile/lib`, exposed as the workspace package `@konfrontend/profile`; the plugin never parses a Profile file itself and writes only Candidates, under `private/candidates/`. Its runtime dependencies are declared in `package.json`, not bundled: Claude Code installs a plugin's registry dependencies when it caches a marketplace copy, and in this repo the root `npm install` serves it. Scripts are TypeScript run by Node 24 directly. Chosen over a second reader inside the plugin (two readers drifted into five Skill-matching rules and 134 path literals) and over `node:sqlite` as a compiled cache (it solved a dependency problem that no longer exists).

## Consequences

- Porting the plugin out means publishing `@konfrontend/profile` to npm and adding a `package-lock.json` to the plugin; until then the plugin lives here.
- The plugin needs Node 24 or later on the user's PATH; erasable TypeScript syntax only.
- The plugin's data contract is the Profile folder shape and `profile/schemas/`; `setup` writes that shape for a new user.
