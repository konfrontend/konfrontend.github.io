# Konstantin Dolbilov

Gijon, Spain (UTC+2) • [cossamedia@gmail.com](mailto:cossamedia@gmail.com) • [github.com/konfrontend](https://github.com/konfrontend) • [linkedin.com/in/konstantin-dolbilov-94720b361](https://www.linkedin.com/in/konstantin-dolbilov-94720b361)

## Skills

TypeScript, Java, SQL, Object-Oriented Programming (OOP), Vue.js, Vue Router, Vuex, Tailwind CSS, Design Systems, Responsive Design, i18n, Monaco Editor, Hugo, Canvas API, Service Workers, SharedWorker, Web Workers, WebSockets, Shadow DOM, IntersectionObserver, WebExtension API, Manifest V3, Chrome DevTools Protocol, Node.js, Spring Boot, REST API, OpenAPI, Model Context Protocol (MCP), Jackson, Pusher, MariaDB, InfluxDB, Flyway, Vitest, Playwright, JUnit, GitHub Actions, CI/CD, Code Review, Docker, Vite, webpack, npm workspaces, Role-based access control (RBAC), Content Security Policy, Claude Code, Agentic Workflows, AWS (S3), Stripe, Third-party integrations / webhooks, React, three.js, React Three Fiber, drei, Zustand, Redux, shadcn/ui, GSAP, Google Maps API, PDF.js, WebGL, GLSL, SVG, Constructive Solid Geometry (CSG), OffscreenCanvas, PWA, IndexedDB, Code Quality, Jira, Agile/Scrum, pdf-lib, MongoDB, Azure Functions, C++ / WebAssembly, Computational geometry (CGAL, straight skeleton), Nuxt, Sanity, GROQ, Cloudflare Workers, SSG, SEO, Core Web Vitals, Accessibility (WCAG), Architecture Decision Records, Electron, Hono, PostgreSQL, SQLite, Drizzle ORM, Zod, TanStack Query, Testcontainers, Git, Cloudflare Tunnel, Turborepo, IPC, Local-first, Auth, Virtual Private Servers (VPS), JSON Schema, Prompt Engineering, Domain Modeling, Ajv, Next.js, GitHub Container Registry, JavaScript, Express, HTML, CSS, PHP, WordPress, Shopify, Magento

## Professional Experience

### [Loadster](https://loadster.com) | Full Stack Web Developer (Contract) | Mar 2019 – Present

Cloud SaaS for load testing and uptime monitoring of websites and APIs.

**Design system and product UX**

- [design-system] Built 314 of the 332 components in the Vue.js design system on a Tailwind CSS theme, shared by 2 product dashboards and the Hugo marketing site, and made the dashboard mobile-responsive and its auth flow mobile-first.
- [team-rbac] Built team switching, member invites, and role-based access control (RBAC) with collaborator and admin roles, limiting billing to admins.
- [report-analysis] Built load test report analysis in Vue.js and Spring Boot: URL grouping, trace and URL-pattern filters, configurable columns, and performance stats per virtual user group.
- [speed-test-funnel] Took the free website speed test's sign-up funnel from user research to production: a results page built around the site's grade, shareable public reports on rate-limited endpoints, and conversion analytics.

**Scripting and test authoring UX**

- [playwright-scripting] Shipped Playwright scripting for load tests across the Spring Boot API, the runtime, a Monaco Editor with custom IntelliSense, and live traces of a running test.
- [script-editor-history] Built the HTTP script editor's revision history, undo and redo by mutation replay, and conflict detection from live presence over WebSockets.
- [script-import] Built script import from OpenAPI specifications and Postman collections for internal use with the Loadster API.
- [dataset-editor] Built the dataset editor's undo and CSV preview for uploads up to 30 MB, with an inspector for values too long for a cell.

**Backend**

- [mcp-server] Built the Loadster MCP server in Spring Boot: 23 tools, each covered by JUnit test cases, that let AI agents use the private Loadster API under role-based access control (RBAC).
- [mcp-schemas] Derived the MCP server's tool schemas and argument validation from one Jackson introspection, so they cannot drift.
- [mcp-harness] Built an MCP test harness: 16 probe prompts against 7 Node.js fixture servers, 6 with planted faults, recording each tool call and its context-token cost.
- [rate-limit-recovery] Added automatic recovery from API rate limits: Spring Boot sends Retry-After, and the dashboard backs off and retries.

**Engineering workflow**

- [claude-workflow] Designed the team's Claude Code workflow as engineering infrastructure: layered instruction files, per-module glossaries, path-scoped conventions, a documentation skill, and build, CI, runtime, and design docs; merged pull requests rose from 22.5 to 31.5 a month (12-month averages).
- [vitest-intro] Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases on a 2-person team, plus 376 JUnit test cases across the Java backend.
- [dashboard-architecture] Designed the dashboard architecture: a cross-product common layer, a composables layer, separate live and report views, Vue Router nested routes with route-level layouts, and npm workspaces with the Node.js runtimes.
- [vue3-migration] Migrated the Vue.js dashboard from Vue 2 to Vue 3 and from webpack to Vite, cutting builds from minutes to seconds, moved it to the Composition API, and introduced TypeScript incrementally.

**Browser extension**

- [recorder-rewrite] Rewrote the Loadster Recorder extension in TypeScript on the WebExtension API and Chrome DevTools Protocol: one codebase generates Playwright Test code live in Chrome and Firefox.
- [recorder-overlay] Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, injected into every frame and kept alive across cross-origin navigation by the background worker (a Service Worker in Chrome).
- [extension-bridge] Designed the dashboard-to-extension bridge: typed events over a long-lived port, an install and version handshake, and the extension's npm library, published by CI, as a typed dashboard dependency.
- [manifest-v3] Migrated the extension to Manifest V3 and built its selector generation, wait-time recording, hover detection, and incognito window support.

**Realtime and monitoring**

- [shared-worker-pusher] Cut WebSocket connections to one per origin by moving the Pusher client into a SharedWorker used by all tabs, and switched presence to Pusher presence channels authenticated in Spring Boot.
- [status-pages] Shipped public status pages with per-monitor summaries and open incidents, built as a separate Vite entry so visitors skip the dashboard bundle.
- [notification-center] Built the in-app notification center in Vue.js and Spring Boot.

**Frontend performance**

- [trace-reports] Rendered 100,000-row trace reports by loading them in parallel pages, virtualized editors holding thousands of rows with IntersectionObserver, and built custom HTML5 Canvas charts for real-time metrics.

### [Jigawatt Solar](https://jigawatt.solar) | Senior Frontend Developer (Contract) | Oct 2019 – Jul 2026

Software suite for solar installers: interactive 3D design and energy modeling.

**Roof modeling**

- [roof-engine] Authored the 3D roof modeling engine in React Three Fiber, WebGL and GLSL, 120+ modules and 34 components, tested by 64 Vitest cases: procedural roof volumes, reconstruction of roof structures by DCEL convex decomposition, and realtime editing.
- [roof-topology] Persisted each roof as a topology graph and rebuilt its 3D geometry from it deterministically, so every roof edit, dormer, and panel layout derives from one source of truth.

**Shade simulation**

- [shade-simulation] Built the shade simulation in a Web Worker: raycasting toward the sun over a Bounding Volume Hierarchy (BVH) finds each roof surface's shade fraction, and OffscreenCanvas renders shade heatmaps.
- [shade-scale] Scaled the shade simulation from 1 to 2,600 sun positions across a year at 10–50 samples per m², finishing in 40 ms to 15 s without blocking the editor.

**Layout tool**

- [layout-tool] Extended the solar estimator's drawing engine into a Vue.js PV array layout tool: an SVG editor over Google Maps imagery with per-section azimuth and pitch, per-edge setbacks, and panel autofill.
- [layout-geometry] Wrote 93% of the layout tool's vector geometry core over 231 commits, starting from the estimator's library: edge snapping, overlap avoidance, and obstruction polygons that panels must clear.
- [cad-drawing] Added CAD-style polygon drawing with 90° and 45° snapping, inference lines, keyboard nudging, and live measurement labels.
- [panel-autofill] Made panel autofill non-blocking: it tries 76 grid offsets per roof section, one per requestAnimationFrame tick, and keeps the offset that fits the most panels.
- [panel-editing] Built panel editing on GSAP Draggable: drag with snapping, Alt-drag duplication, multi-select, and group rotation with a custom rotary control.

**Solar estimator**

- [estimator-engine] Built the drawing engine of the public solar estimator installers link from their websites: homeowners draw roof sections in SVG over Google Maps imagery, with map-synced pan and zoom and checkpoint undo.
- [estimator-geometry] Wrote the estimator's geometry library alone to drive automatic panel layout: convex hull, minimum bounding box, Web Mercator image scale, and pitch correction.

**Document signing**

- [pdf-viewer] Built the in-browser PDF viewer where homeowners fill and sign proposals and contracts: PDF.js renders AcroForms as editable fields, merge tags prefill them, and installers lock fields and assign signers.
- [e-signing] Built multi-party e-signing on pdf-lib: each submission locks the filled fields for the next signer, drawn signatures are placed as PNG images, and the PDF flattens once every party has signed.

**Workflow tools**

- [checklist-editor] Built a node-based editor for checklist templates in SVG: one GSAP Draggable proxy moves task nodes and wires, and wires only run to later tasks, so templates stay acyclic.
- [task-calendar] Extended vue-simple-calendar into the per-project task calendar: a grid-based day view, month and week views of the project's tasks, and a toggle for completed tasks.

**Frontend architecture**

- [stack-choice] Chose the 3D designer's frontend stack alone: React, TypeScript, Vite, Zustand, and three.js, with a feature-driven structure, lint rules, and a documented Z-up to Y-up coordinate boundary.
- [pwa-update] Built the Vue.js app's PWA auto-update: it checks for a new service worker on startup and every route change, and loads the new version on the next navigation.

**Engineering workflow**

- [vitest-intro] Introduced Vitest to the 3D designer and wrote all 17 of its test files, 140 cases.
- [agent-guide] Wrote the 3D designer's AI coding agent guide, domain glossary, coding standards, and 11 architecture decision records.
- [commit-share] Authored 47% of the 3D designer's commits and 37 of its 84 merged PRs among 8 contributors.

### [Nataliia Musikhina Website](https://nataliiamusikhina.com) | Full Stack Developer (Freelance) | Jun 2026 – Aug 2026

Portfolio website for a tattoo artist.

**Product and stack**

- [site-stack] Built the site in Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4 and a Sanity Studio, prerendered in English and French and served by a Cloudflare Worker.
- [agent-delivery] Delivered the site in 9 weeks with AI coding agents: 42 Linear issues, each triaged for an agent or a human and written against a 16-term glossary and 3 Architecture Decision Records (ADRs), merged in 10 pull requests.

**CMS**

- [cms-schemas] Modeled the content in 14 Sanity schema types: 5 singletons pinned to fixed ids and a page builder for projects with slider, gallery and text blocks, so the artist edits every page and its background without a developer.
- [localization] Localized content in English and French, document-level for projects and field-level for singletons, with an English fallback resolved in GROQ and every query typed by Sanity TypeGen.

**Deployment**

- [prerender] Moved the site from per-request SSR to full prerender, decided in an ADR: a Sanity publish webhook triggers a Cloudflare Workers Builds rebuild, so edits go live in 1 to 3 minutes and no page queries the CMS at request time.
- [pr-gate] Gated pull requests in GitHub Actions on a typecheck and 72 Vitest cases covering the image module, SEO metadata, the prerender route list and URL redirects.

**Accessibility**

- [accessibility] Reached Lighthouse accessibility 100 and WCAG AA 4.5:1 contrast for all text over background photographs: one light text color, a uniform 40% black overlay, and a 74% grey brightness limit on the photographs.

**Performance optimization**

- [lcp] Raised Lighthouse mobile performance on the home page from 85 to 99 and cut its LCP from 3.6 s to 1.1 s with zero layout shift: traced the LCP to the heading, not the background image, then preloaded its font face and inlined the critical CSS.
- [backdrop-image] Replaced a 650 KB layered CSS backdrop with one background image from Sanity, served as a 42 KB AVIF on mobile.
- [image-component] Built one shared image component that cut a project page's 1.1 MB GIF to a 54 KB animated WebP: AVIF and WebP from the Sanity CDN, srcset clamped to native width, low-quality image placeholders (LQIP), and a high-priority preload for the first visible image only.
- [font-faces] Cut the body font's @font-face declarations from 37 to 6 by declaring only the weights, styles and subset the site uses.
- [lazy-scripts] Loaded PhotoSwipe and the 15 KB Tally form script only when a visitor opens them, with the form link still working if the script fails.

**SEO**

- [seo-audit] Closed the gaps a baseline SEO audit found: project pages added to the per-locale sitemaps, hreflang links, per-page meta descriptions, schema.org Person data, and share images cropped from Sanity.
- [canonical-urls] Served one canonical URL per page: fixed project canonicals that returned 404, dropped the trailing-slash redirect hop, redirected mixed-case paths to lowercase, and set noindex on branch previews.

### [About Medicine](https://aboutmedicine.com.au) | Full Stack Developer (Freelance) | Mar 2018 – Jan 2019

Educational website on medical topics.

### Galaxy Labs | Frontend Developer | Feb 2015 – Nov 2018

Web agency building e-commerce and marketing sites.

## Projects

### Roman ABC | Full Stack Developer | Jul 2026 – Present

Personal website of tattoo artist Roman Melnikov.

### [timestop](https://github.com/konfrontend/timestop) | Author & Sole Full Stack Developer | Aug 2026 – Present

Local-first time tracker app with an optional self-hosted sync server.

**Product and stack**

- [product-releases] Took the product from research and a UX prototype of 3 app-shell layouts to 2 public MIT-licensed releases of the Electron app and sync server.
- [stack-adr] Chose the stack in an Architecture Decision Record (ADR) and built a TypeScript Turborepo monorepo where one package of Zod domain entities serves the Electron app and the Hono server.
- [monorepo-tooling] Built the monorepo tooling: a Turborepo task graph with cached outputs, and shared TypeScript and lint config packages.
- [contract-first-api] Designed a contract-first desktop API: one descriptor per method holds its Zod input schema, a mapped type derives the interface, and every layer from IPC handlers to test harness iterates the descriptors, so each call is validated.
- [agent-workflow] Shipped 70 pull requests in 5 weeks solo with AI coding agents, working from a glossary, data rules, and decisions settled before code, under agent rules, skills, and Husky pre-commit hooks.
- [product-name] Centralized the product name ahead of a planned rename: one source that both Electron processes and the end-to-end tests import, and a lint script that fails on the name outside an allowlist.
- [local-first-model] Designed the local-first model: desktop SQLite is the source of truth, each write commits its entity row and an append-only change log entry in one transaction, and the server mirrors the desktop one way.
- [rate-adr] Decided in an ADR that time entries store no rate: amounts come from the project's rate and the workspace's currency when read, and the exported CSV is the frozen copy of what was billed.

**Desktop app**

- [electron-app] Built the Electron app in React, shadcn/ui, TanStack Router, and TanStack Query: one always-on-top window with Tracker, Dashboard, and Settings tabs, shipped as an Apple Silicon macOS disk image and a per-user Windows installer.
- [timer-surfaces] Surfaced the running timer outside the closed window: a system tray icon with live elapsed time, a global hotkey, a macOS Dock badge, and a Windows taskbar overlay.
- [timer-shutdown] Saved the running timer as stopped on quit, logoff, or shutdown, and held a single-instance lock so no second process writes the same SQLite file.
- [renderer-lockdown] Locked down the renderer: the main process owns SQLite and the domain package, and the renderer reaches them only through Zod-validated IPC, with context isolation and the sandbox on.
- [migration-backups] Protected user data across upgrades: migrations run on open after a whole-file backup (newest 3 kept), and a database from a newer app version is refused and left untouched.
- [dashboard-table] Built the Dashboard on TanStack Table with filters, batch selection, inline edits, view state in the URL, live rounding of durations, totals per currency, and a CSV export that Excel reads as UTF-8.
- [toggl-import] Built a Toggl Track CSV import of clients, projects, and time entries that infers each project's hourly rate from the imported project data and re-imports the same file without duplicates.
- [design-tokens] Defined design tokens as CSS variables in the Tailwind CSS theme and added data-slot attributes to the app's own components, so a planned skin engine can restyle them.
- [app-tests] Tested the desktop app at 3 levels: 452 Vitest unit tests with a harness built from the API contract over in-memory SQLite, 11 Playwright end-to-end tests, and a smoke test of the packaged Windows executable.

**Self-hosted server and sync**

- [sync-server] Built the one-way sync server in Hono on Node.js with PostgreSQL: one authenticated REST endpoint stores each change once by id and updates entity tables in one transaction, so replays are no-ops.
- [push-protocol] Designed the push protocol: the desktop sends changes in insertion order after every commit, backing off exponentially from 1 second to 5 minutes and halting on a rejected token, and the server applies last-writer-wins.
- [server-image] Shipped the server as a GitHub Container Registry image with a Docker Compose stack of PostgreSQL and Cloudflare Tunnel that publishes no ports, ran it on a Hetzner VPS, and wrote the self-hosting guide.
- [token-auth] Designed token authentication without accounts or sessions: a CLI mints tokens stored only as SHA-256 hashes, a token's first push binds it to the pushing install under a row lock, and rotation is mint then revoke.
- [server-tests] Tested the server against real PostgreSQL, as a CI service container and with Testcontainers locally, plus an in-process integration test of the desktop push client against the Hono app, neither mocked.

**Database architecture**

- [drizzle-layer] Designed the Drizzle ORM layer for SQLite and PostgreSQL with 2 drift checks: a compile-time assertion that each row type equals its Zod entity, and a test diffing both dialects' drizzle-kit snapshots against a reasoned allowlist.
- [sqlite-over-pglite] Chose SQLite over PGlite for the desktop on measured resident memory, about 52 MB against 576 MB to 1.3 GB, under a 150 MB budget for an all-day tray app, recorded in an ADR.
- [foreign-keys] Enforced foreign keys in SQLite, where writes originate, and left them out of PostgreSQL, where changes arrive in push order, not dependency order, and a rejected batch would retry forever.
- [timestamps] Stored timestamps as fixed-width ISO 8601 UTC text so range queries are string comparisons, and stamped every id as a UUIDv7.

**CI and releases**

- [ci] Built GitHub Actions CI that, beyond formatting, lint, typecheck, and Vitest, checks that migrations match the schema, dry-runs electron-builder, and builds and tests the desktop app on Windows.
- [release-tag] Shipped each release from one git tag: a preflight requiring a commit on master and a higher version, both desktop builds, a multi-arch Docker push, and the GitHub Release only once every artifact exists.
- [e2e-report] Ran Playwright end-to-end tests on pull requests as a non-blocking report, since the UI changed faster than its selectors, and gated each release on the packaged Windows smoke test instead.

### [autotriage](https://github.com/konfrontend/autotriage) | Author & Sole Developer | Sep 2026 – Present

Claude Code plugin that triages a freelance job posting and writes the proposal letter inside hook-enforced rails.

**Agent workflow design**

- [plugin] Built a public Claude Code plugin that triages a freelance job posting and writes a ready-to-paste proposal letter in 1–2 minutes instead of 30–60; 17 postings triaged, 11 letters written.
- [judgment-vs-arithmetic] Split judgment from arithmetic: the model flags risks and scores fit, a Node.js script computes the verdict, and the proposal step refuses a stored verdict the script cannot reproduce.
- [catalogue-rules] Moved the rules out of prompts into catalogue files with YAML frontmatter, one source that scripts and the model both read; skill files only sequence steps.
- [rule-catalogue] Designed the rule catalogue: 23 risk flags on a 5-level scale, 4 engagement types, 13 letter sections with size caps, and 40 checks with 6 fix kinds.

**Deterministic rails**

- [hook-rails] Enforced the workflow with Claude Code hooks: they deny an out-of-order step and tell the model why, and validate every data write against its JSON Schema with Ajv.
- [letter-checker] Built a Node.js letter checker that splits plain text into sections by blank lines and headers and runs 28 scripted checks, with 18 tests on node:test.
- [skills-ledger] Designed a skills ledger that logs each posting's required skills and surfaces a gap once 3 postings ask for it; updates need user confirmation, and an ADR justifies YAML over SQLite.

**Letter generation and verification**

- [fact-tracing] Required the model to trace each letter fact to a past job, profile field, posting line, or calculation; it asks the user about any unsourced fact and saves confirmed ones to the profile.
- [verification-fixes] Built letter verification that applies its own fixes in place: 12 model-judged checks run only after 28 scripted checks pass, and each run ends passed or stopped on one user question.

### Portfolio | Author & Sole Developer | Jun 2026 – Present

Personal Next.js WebGL portfolio with interactive shader demos.

### straight-skeleton | Author & Sole Developer | Jun 2025 – Present

TypeScript library wrapping CGAL's straight skeleton implementation via WebAssembly.
