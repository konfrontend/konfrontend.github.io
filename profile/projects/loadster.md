---
name: Loadster
url: https://loadster.com
role: Full Stack Web Developer
employment: contract
start: 2019-03
naming: public
domain: load testing, developer tools
description: Cloud SaaS for load testing and uptime monitoring of websites and APIs.
keywords: [TypeScript, Java, SQL, Object-Oriented Programming (OOP), Vue.js, Vue Router, Vuex, Tailwind CSS, Design Systems, Responsive Design, i18n, Monaco Editor, Hugo, Canvas API, Service Workers, SharedWorker, Web Workers, WebSockets, Shadow DOM, IntersectionObserver, WebExtension API, Manifest V3, Chrome DevTools Protocol, Node.js, Spring Boot, REST API, OpenAPI, Model Context Protocol (MCP), Jackson, Pusher, MariaDB, InfluxDB, Flyway, Vitest, Playwright, JUnit, GitHub Actions, CI/CD, Code Review, Docker, Vite, webpack, npm workspaces, Role-based access control (RBAC), Content Security Policy, Claude Code, Agentic Workflows, AWS (S3), Stripe, Third-party integrations / webhooks]
---
**Design system and product UX**

- [design-system] Built 314 of the 332 components in the Vue.js design system on a Tailwind CSS theme, shared by 2 product dashboards and the Hugo marketing site, and made the dashboard mobile-responsive and its auth flow mobile-first.
  The theme is a Tailwind v4 design-token layer (theme.css): breakpoints, type scale with line-heights, spacing, containers, semantic colour aliases over brand CSS variables, shadows, radii; shared with the marketing site through a written design baseline.
- [team-rbac] Built team switching, member invites, and role-based access control (RBAC) with collaborator and admin roles, limiting billing to admins.
  Reviewed API endpoint permissions and worked within the product's SSO/SAML and TOTP 2FA. Built the Stripe billing UI with reCAPTCHA on billing endpoints and background polling for the billing summary.
- [report-analysis] Built load test report analysis in Vue.js and Spring Boot: URL grouping, trace and URL-pattern filters, configurable columns, and performance stats per virtual user group.
- [speed-test-funnel] Took the free website speed test's sign-up funnel from user research to production: a results page built around the site's grade, shareable public reports on rate-limited endpoints, and conversion analytics.

**Scripting and test authoring UX**

- [playwright-scripting] Shipped Playwright scripting for load tests across the Spring Boot API, the runtime, a Monaco Editor with custom IntelliSense, and live traces of a running test.
  The Node.js runtimes run Browser Bot and Playwright scripts.
- [script-editor-history] Built the HTTP script editor's revision history, undo and redo by mutation replay, and conflict detection from live presence over WebSockets.
- [script-import] Built script import from OpenAPI specifications and Postman collections for internal use with the Loadster API.
- [dataset-editor] Built the dataset editor's undo and CSV preview for uploads up to 30 MB, with an inspector for values too long for a cell.
  The file-upload flow stores to S3.

**Backend**

- [mcp-server] Built the Loadster MCP server in Spring Boot: 23 tools, each covered by JUnit test cases, that let AI agents use the private Loadster API under role-based access control (RBAC).
  The tools cover monitoring, report advice, scenario and script generation, and datasets. The server is embedded in the Spring API over stateless HTTP; one tenancy check reuses the REST customer-owns-project rule, and an exception sanitizer keeps persistence errors and stack detail from reaching the calling assistant. No tool starts a paid operation: a Scenario is saved, never launched, and a Monitor is created disabled. Shipped 2026, the most recent feature.
- [mcp-schemas] Derived the MCP server's tool schemas and argument validation from one Jackson introspection, so they cannot drift.
- [mcp-harness] Built an MCP test harness: 16 probe prompts against 7 Node.js fixture servers, 6 with planted faults, recording each tool call and its context-token cost.
  The harness, mcp-dev, runs scripted prompts headlessly with a real agent against the local MCP server and records every tool call and result as an NDJSON trace; adversarial prompts plant defects, and prompts are re-run before any tool description change ships. Tested on the Claude Platform before the public release.
- [rate-limit-recovery] Added automatic recovery from API rate limits: Spring Boot sends Retry-After, and the dashboard backs off and retries.
  Also in the backend: controller tests that seed a user with permissions on one customer and assert another customer's resources are refused; the MySQL connector swapped for the MariaDB client with the schema untouched, and MariaDB administration; the activity feed (the product's audit log) with its structure and pagination; the Slack integration, the create/update/delete flow for integrations, the webhook controller and notification policies; GitHub Actions CI with npm audit and dependency scanning; internationalization of the dashboard.

**Engineering workflow**

- [claude-workflow] Designed the team's Claude Code workflow as engineering infrastructure: layered instruction files, per-module glossaries, path-scoped conventions, a documentation skill, and build, CI, runtime, and design docs; merged pull requests rose from 22.5 to 31.5 a month (12-month averages).
- [vitest-intro] Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases on a 2-person team, plus 376 JUnit test cases across the Java backend.
- [dashboard-architecture] Designed the dashboard architecture: a cross-product common layer, a composables layer, separate live and report views, Vue Router nested routes with route-level layouts, and npm workspaces with the Node.js runtimes.
  TypeScript strict typecheck across the monorepo.
- [vue3-migration] Migrated the Vue.js dashboard from Vue 2 to Vue 3 and from webpack to Vite, cutting builds from minutes to seconds, moved it to the Composition API, and introduced TypeScript incrementally.
  The Vue 3 migration was done in place, keeping the existing components and Vuex store modules working throughout.

**Browser extension**

- [recorder-rewrite] Rewrote the Loadster Recorder extension in TypeScript on the WebExtension API and Chrome DevTools Protocol: one codebase generates Playwright Test code live in Chrome and Firefox.
  Open source (Apache), shipped on the Chrome Web Store and Firefox Add-ons; uses playwright-core selector generation and webextension-polyfill.
- [recorder-overlay] Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, injected into every frame and kept alive across cross-origin navigation by the background worker (a Service Worker in Chrome).
- [extension-bridge] Designed the dashboard-to-extension bridge: typed events over a long-lived port, an install and version handshake, and the extension's npm library, published by CI, as a typed dashboard dependency.
- [manifest-v3] Migrated the extension to Manifest V3 and built its selector generation, wait-time recording, hover detection, and incognito window support.

**Realtime and monitoring**

- [shared-worker-pusher] Cut WebSocket connections to one per origin by moving the Pusher client into a SharedWorker used by all tabs, and switched presence to Pusher presence channels authenticated in Spring Boot.
- [status-pages] Shipped public status pages with per-monitor summaries and open incidents, built as a separate Vite entry so visitors skip the dashboard bundle.
- [notification-center] Built the in-app notification center in Vue.js and Spring Boot.

**Frontend performance**

- [trace-reports] Rendered 100,000-row trace reports by loading them in parallel pages, virtualized editors holding thousands of rows with IntersectionObserver, and built custom HTML5 Canvas charts for real-time metrics.
