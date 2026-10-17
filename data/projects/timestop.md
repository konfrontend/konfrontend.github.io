---
name: timestop
url: https://github.com/konfrontend/timestop
role: Author & Sole Full Stack Developer
employment: independent
start: 2026-08
naming: public
domain: time tracking, desktop app
description: Local-first time tracker app with an optional self-hosted sync server.
keywords: [TypeScript, React, Electron, Node.js, Hono, PostgreSQL, SQLite, Drizzle ORM, Zod, Tailwind CSS, shadcn/ui, TanStack Query, Playwright, Vitest, Testcontainers, Docker, GitHub Actions, Cloudflare Tunnel, Turborepo, REST API, IPC, Local-first, CI/CD]
---
**Product and stack**

- Took the product from research and a UX prototype of 3 app-shell layouts to 2 public MIT-licensed releases of the Electron app and sync server.
  Scope planned from a written analysis of Toggl Track: the product is a Toggl Track clone with tracker, dashboard and reports. The Tracker and Dashboard were redesigned from v1 to v2: v1 was a generic form (Workspace and Project selects, timer readout, name field, Start button) with the Dashboard as a flat list under a filter row; before rebuilding, a throwaway HTML prototype held three shell variants (two windows, one window with routes, tray-first), one was picked and composed into a single-window design, then built.
- Chose the stack in an Architecture Decision Record (ADR) and built a TypeScript Turborepo monorepo where one package of Zod domain entities serves the Electron app and the Hono server.
- Built the monorepo tooling: a Turborepo task graph with cached outputs, and shared TypeScript and lint config packages.
  npm workspaces under Turborepo.
- Designed a contract-first desktop API: one descriptor per method holds its Zod input schema, a mapped type derives the interface, and every layer from IPC handlers to test harness iterates the descriptors, so each call is validated.
- Shipped 70 pull requests in 5 weeks solo with AI coding agents, working from a glossary, data rules, and decisions settled before code, under agent rules, skills, and Husky pre-commit hooks.
  Built with Claude Code as the daily workflow, on Matt Pocock's skills: domain modeling into a CONTEXT.md glossary, grilling a plan before code, ADRs, code review, test-first domain logic. Work runs as Linear tickets through the Linear MCP server, one pull request per ticket. The stack was locked in an ADR before the first line of code; agent rule files (code style, comments, renderer tests, e2e tests) scope what the agent writes; public marketplace skills (electron-development, shadcn) are pinned in a skills lock file.
- Centralized the product name ahead of a planned rename: one source that both Electron processes and the end-to-end tests import, and a lint script that fails on the name outside an allowlist.
- Designed the local-first model: desktop SQLite is the source of truth, each write commits its entity row and an append-only change log entry in one transaction, and the server mirrors the desktop one way.
- Decided in an ADR that time entries store no rate: amounts come from the project's rate and the workspace's currency when read, and the exported CSV is the frozen copy of what was billed.

**Desktop app**

- Built the Electron app in React, shadcn/ui, TanStack Router, and TanStack Query: one always-on-top window with Tracker, Dashboard, and Settings tabs, shipped as an Apple Silicon macOS disk image and a per-user Windows installer.
  The v2 Tracker is a dial: the timer is the object, the Project sits on the ring as a radial control, the Record name is typed on the dial face as an inline autocomplete, the running state inverts the dial color and the window title shows the elapsed time; Workspace switching is a colored avatar in the header.
- Surfaced the running timer outside the closed window: a system tray icon with live elapsed time, a global hotkey, a macOS Dock badge, and a Windows taskbar overlay.
- Saved the running timer as stopped on quit, logoff, or shutdown, and held a single-instance lock so no second process writes the same SQLite file.
- Locked down the renderer: the main process owns SQLite and the domain package, and the renderer reaches them only through Zod-validated IPC, with context isolation and the sandbox on.
- Protected user data across upgrades: migrations run on open after a whole-file backup (newest 3 kept), and a database from a newer app version is refused and left untouched.
- Built the Dashboard on TanStack Table with filters, batch selection, inline edits, view state in the URL, live rounding of durations, totals per currency, and a CSV export that Excel reads as UTF-8.
  The v2 Dashboard is a data table with day groups and totals, batch select with Move to and Delete, inline editing of names and start and stop clocks, hover-revealed row actions, and a toolbar grouped by what it acts on.
- Built a Toggl Track CSV import of clients, projects, and time entries that infers each project's hourly rate from the imported project data and re-imports the same file without duplicates.
- Defined design tokens as CSS variables in the Tailwind CSS theme and added data-slot attributes to the app's own components, so a planned skin engine can restyle them.
  The rules behind v2 are written in docs/design-system.md: shadow says elevation only, no borders on editable elements, auto-apply editors, hover-reveal actions, one icon palette; every later screen follows them.
- Tested the desktop app at 3 levels: 452 Vitest unit tests with a harness built from the API contract over in-memory SQLite, 11 Playwright end-to-end tests, and a smoke test of the packaged Windows executable.

**Self-hosted server and sync**

- Built the one-way sync server in Hono on Node.js with PostgreSQL: one authenticated REST endpoint stores each change once by id and updates entity tables in one transaction, so replays are no-ops.
- Designed the push protocol: the desktop sends changes in insertion order after every commit, backing off exponentially from 1 second to 5 minutes and halting on a rejected token, and the server applies last-writer-wins.
- Shipped the server as a GitHub Container Registry image with a Docker Compose stack of PostgreSQL and Cloudflare Tunnel that publishes no ports, ran it on a Hetzner VPS, and wrote the self-hosting guide.
- Designed token authentication without accounts or sessions: a CLI mints tokens stored only as SHA-256 hashes, a token's first push binds it to the pushing install under a row lock, and rotation is mint then revoke.
  Bearer-token auth with revocation; Zod validation on every request.
- Tested the server against real PostgreSQL, as a CI service container and with Testcontainers locally, plus an in-process integration test of the desktop push client against the Hono app, neither mocked.

**Database architecture**

- Designed the Drizzle ORM layer for SQLite and PostgreSQL with 2 drift checks: a compile-time assertion that each row type equals its Zod entity, and a test diffing both dialects' drizzle-kit snapshots against a reasoned allowlist.
- Chose SQLite over PGlite for the desktop on measured resident memory, about 52 MB against 576 MB to 1.3 GB, under a 150 MB budget for an all-day tray app, recorded in an ADR.
- Enforced foreign keys in SQLite, where writes originate, and left them out of PostgreSQL, where changes arrive in push order, not dependency order, and a rejected batch would retry forever.
- Stored timestamps as fixed-width ISO 8601 UTC text so range queries are string comparisons, and stamped every id as a UUIDv7.

**CI and releases**

- Built GitHub Actions CI that, beyond formatting, lint, typecheck, and Vitest, checks that migrations match the schema, dry-runs electron-builder, and builds and tests the desktop app on Windows.
- Shipped each release from one git tag: a preflight requiring a commit on master and a higher version, both desktop builds, a multi-arch Docker push, and the GitHub Release only once every artifact exists.
  Releases ship as a dmg via GitHub Releases with an in-app update check.
- Ran Playwright end-to-end tests on pull requests as a non-blocking report, since the UI changed faster than its selectors, and gated each release on the packaged Windows smoke test instead.
