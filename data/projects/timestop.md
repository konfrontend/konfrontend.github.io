**Product and stack**

- Owned the product end to end as sole author: research, a glossary and data rules before code, a UX prototype of three shell layouts, then the shipped Electron app, sync server, and release pipeline, through two tagged public releases under MIT.
- Decided the stack in an ADR and built it: TypeScript throughout, React with shadcn/ui in Electron, one domain package of Zod entities shared by desktop and server, Drizzle ORM over SQLite and PostgreSQL, Hono on Node.js, in a Turborepo monorepo.
- Designed a contract-first API: each method is a descriptor with its Zod input schema and output type, and one mapped type derives the interface, so IPC handlers, preload bridge, SQLite implementation, and test harness all walk the same object.
- Built a deterministic agentic workflow on a glossary, rules and decisions settled before code: 70 pull requests in five weeks solo with AI agents.
- Decoupled the brand from the implementation: the product name lives in one source the main process, renderer and end-to-end tests import, with a lint script that fails on the name anywhere outside an allowlist that doubles as the rename checklist.
- Designed the local-first model: SQLite on the desktop is the source of truth, every write stores its entity row and an append-only change log entry in one transaction, and the server mirrors one way.
- Decided that money is derived, in an ADR: a record stores no rate, so rate and amount come from its project and workspace on read, and the exported CSV stays the frozen record of what was billed.
- Built a Toggl Track CSV import that maps clients, projects, and entries onto the app's entities, infers the hourly rate, and imports the same file twice without duplicates.
- Kept design tokens as CSS variables with data-slot hooks on the app's own components, for a later skin engine.

**Desktop app**

- Built the cross-platform Electron desktop app in React with TanStack Router and TanStack Query, shipping a macOS Apple Silicon disk image and a Windows per-user installer, with an always-on-top Tracker, Dashboard, and Settings in one window.
- Built the shell integration that keeps the timer reachable with the window closed: a system tray with live elapsed time, a global hotkey, a Dock badge and taskbar overlay, a single-instance lock, and a stop written on quit, logoff, or shutdown.
- Isolated the renderer from the shell: the main process owns SQLite and the domain and exposes it over Zod-validated IPC with context isolation and the sandbox on.
- Made upgrades safe for the user's data: migrations on open, a newer-version database refused and left untouched, a whole-file backup before any migration with the three newest kept, and an update check against GitHub Releases on launch.
- Built the Dashboard on TanStack Table: filters, batch selection, inline edits, live rounding, view state in the URL, totals per currency, and a CSV export with a byte order mark and CRLF so Excel on Windows reads it.
- Tested the desktop app at its seams: Vitest over a harness built from the API contract with a real in-memory SQLite, Playwright driving Electron end to end in a headless mode, and a smoke test of the packaged Windows executable.

**Self-hosted server and sync**

- Built the optional self-hosted sync server in Hono on Node.js with PostgreSQL: one authenticated REST endpoint ingests change log batches, stores each once by id, and materializes entities in the same transaction, so a replay changes nothing.
- Designed the push protocol on both ends: batches in insertion order after every commit, exponential backoff from one second to five minutes on network errors, and a halt on a rejected token while changes keep queueing locally.
- Shipped the server as a multi-arch Docker image on GitHub Container Registry with a Compose stack of PostgreSQL and a Cloudflare Tunnel so the VPS publishes no ports, ran it on Hetzner, and wrote the self-hosting guide.
- Designed token authentication without accounts or sessions: a CLI mints a token stored only as its SHA-256 hash, the first push binds it to that install under a row lock, and rotation is a mint and a revoke.
- Tested the server against a real PostgreSQL in CI and Testcontainers locally, including an integration test that drives the real desktop pusher against the real Hono app in-process.

**Database architecture**

- Designed the two-dialect database layer in Drizzle ORM and Zod with two drift catchers: each table's row type asserted equal to its Zod entity at compile time, and a test that diffs the two dialects' drizzle-kit snapshots against a reasoned allowlist.
- Decided on the desktop database at about 52 MB of memory over PGlite at about 1.3 GB, under a 150 MB budget for an app that sits in the tray all day, with every option recorded in an ADR.
- Stored timestamps as fixed-width ISO 8601 UTC text so range queries stay string comparisons, left foreign keys out of PostgreSQL because the server materializes a replay log, and stamped change ids as UUIDv7.

**CI and releases**

- Built the GitHub Actions CI: formatting, lint, typecheck, and Vitest across the monorepo with a PostgreSQL service container, a migrations-match-schema check, an electron-builder dry run, and a Windows job that builds and tests the desktop app.
- Shipped releases from one git tag: a preflight on version shape and reachability, macOS arm64 and Windows x64 builds with a Playwright smoke launch, a multi-arch Docker push, and the GitHub Release only once every artifact exists.
- Ran Playwright end-to-end tests of the Electron app on pull requests under xvfb on Linux and on Windows, reporting without blocking, while the packaged smoke test gates the tag.
- Wired the developer loop: a Turborepo task graph with cached outputs, shared TypeScript and lint config packages, a pre-commit hook that formats staged files, and the brand-name lint.

**Keywords this experience covers:** TypeScript, React, Electron, Node.js, Hono, PostgreSQL, SQLite, Drizzle ORM, Zod, Tailwind CSS, shadcn/ui, TanStack Query, Playwright, Vitest, Docker, GitHub Actions, Cloudflare Tunnel, Turborepo, REST API, IPC, Local-first, CI
