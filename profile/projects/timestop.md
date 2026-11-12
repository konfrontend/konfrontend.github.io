---
url: https://github.com/konfrontend/timestop
role: Author & Sole Full Stack Developer
employment: independent
start: Aug 2026
end: Present
---
# timestop

## Description
A local-first time tracker and report generator app for macOS and Windows.

## Keywords
`Electron`, `React`, `TanStack Query`, `TanStack Router`, `Tailwind CSS`, `shadcn/ui`, `Vitest`, `Zod`, `Drizzle ORM`, `SQLite`, `PostgreSQL`, `Playwright`, `Docker`, `Turborepo`, `Cloudflare Tunnel`

*** 

### Replacement
Replaced a paid time-tracker subscription, saving about $200 a year, by building a local-first time tracker and report generator for macOS and Windows in Electron, React, and SQLite.

### Optional Sync Server
Complemented a local-first app with an optional sync server, unlocking a teamwork capability for the product.

*** 

## Notes

[agent-workflow] Shipped 70 pull requests in 5 weeks solo with AI coding agents, working from a glossary, data rules, and decisions settled before code, under agent rules and skills.

[timer-shutdown] Saved the running timer as stopped on quit, logoff, or shutdown, and held a single-instance lock so no second process writes the same SQLite file.

[toggl-import] Built a Toggl Track CSV import of clients, projects, and time entries that infers each project's hourly rate from the imported project data and re-imports the same file without duplicates.

[product-releases] Took the product from research and a UX prototype of 3 app-shell layouts to 2 public MIT-licensed releases of the Electron app and sync server.

[server-image] Shipped the server as a GitHub Container Registry image with a Docker Compose stack of PostgreSQL and Cloudflare Tunnel that publishes no ports, ran it on a Hetzner VPS, and wrote the self-hosting guide.

[token-auth] Designed token authentication without accounts or sessions: a CLI mints tokens stored only as SHA-256 hashes, a token's first push binds it to the pushing install under a row lock, and rotation is mint then revoke.

[foreign-keys] Enforced foreign keys in SQLite, where writes originate, and left them out of PostgreSQL, where changes arrive in push order, not dependency order, and a rejected batch would retry forever.

[timestamps] Stored timestamps as fixed-width ISO 8601 UTC text so range queries are string comparisons, and stamped every id as a UUIDv7.

[why two dialects] Chose SQLite over PGlite for the desktop on measured resident memory, about 52 MB against 576 MB to 1.3 GB, under a 150 MB budget for an all-day tray app.

[push-protocol] Designed the push protocol: the desktop sends changes in insertion order after every commit, backing off exponentially from 1 second to 5 minutes and halting on a rejected token, and the server applies last-writer-wins.

[ci/cd] Built GitHub Actions CI that, beyond formatting, lint, typecheck, and Vitest, checks that migrations match the schema, dry-runs electron-builder, and builds and tests the desktop app on Windows.
Shipped each release from one git tag: a preflight requiring a commit on master and a higher version, both desktop builds, a multi-arch Docker push, and the GitHub Release only once every artifact exists.
Ran Playwright end-to-end tests on pull requests as a non-blocking report, since the UI changed faster than its selectors, and gated each release on the packaged Windows smoke test instead.