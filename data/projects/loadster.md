**Design system and product UX**

- Built 314 of the 332 components in the Vue.js design system on a Tailwind CSS theme, shared by 2 product dashboards and the Hugo marketing site, and made the dashboard mobile-responsive and its auth flow mobile-first.
- Built team switching, member invites, and role-based access control (RBAC) with collaborator and admin roles, limiting billing to admins.
- Built load test report analysis in Vue.js and Spring Boot: URL grouping, trace and URL-pattern filters, configurable columns, and performance stats per virtual user group.
- Took the free website speed test's sign-up funnel from user research to production: a results page built around the site's grade, shareable public reports on rate-limited endpoints, and conversion analytics.

**Scripting and test authoring UX**

- Shipped Playwright scripting for load tests across the Spring Boot API, the runtime, a Monaco Editor with custom IntelliSense, and live traces of a running test.
- Built the HTTP script editor's revision history, undo and redo by mutation replay, and conflict detection from live presence over WebSockets.
- Built script import from OpenAPI specifications and Postman collections for internal use with the Loadster API.
- Built the dataset editor's undo and CSV preview for uploads up to 30 MB, with an inspector for values too long for a cell.

**Backend**

- Built the Loadster MCP server in Spring Boot: 23 tools, each covered by JUnit test cases, that let AI agents use the private Loadster API under role-based access control (RBAC).
- Derived the MCP server's tool schemas and argument validation from one Jackson introspection, so they cannot drift.
- Built an MCP test harness: 16 probe prompts against 7 Node.js fixture servers, 6 with planted faults, recording each tool call and its context-token cost.
- Added automatic recovery from API rate limits: Spring Boot sends Retry-After, and the dashboard backs off and retries.

**Engineering workflow**

- Designed the team's Claude Code workflow as engineering infrastructure: layered instruction files, per-module glossaries, path-scoped conventions, a documentation skill, and build, CI, runtime, and design docs; merged pull requests rose from 22.5 to 31.5 a month (12-month averages).
- Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases on a 2-person team, plus 376 JUnit test cases across the Java backend.
- Designed the dashboard architecture: a cross-product common layer, a composables layer, separate live and report views, Vue Router nested routes with route-level layouts, and npm workspaces with the Node.js runtimes.
- Migrated the Vue.js dashboard from Vue 2 to Vue 3 and from webpack to Vite, cutting builds from minutes to seconds, moved it to the Composition API, and introduced TypeScript incrementally.

**Browser extension**

- Rewrote the Loadster Recorder extension in TypeScript on the WebExtension API and Chrome DevTools Protocol: one codebase generates Playwright Test code live in Chrome and Firefox.
- Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, injected into every frame and kept alive across cross-origin navigation by the background worker (a Service Worker in Chrome).
- Designed the dashboard-to-extension bridge: typed events over a long-lived port, an install and version handshake, and the extension's npm library, published by CI, as a typed dashboard dependency.
- Migrated the extension to Manifest V3 and built its selector generation, wait-time recording, hover detection, and incognito window support.

**Realtime and monitoring**

- Cut WebSocket connections to one per origin by moving the Pusher client into a SharedWorker used by all tabs, and switched presence to Pusher presence channels authenticated in Spring Boot.
- Shipped public status pages with per-monitor summaries and open incidents, built as a separate Vite entry so visitors skip the dashboard bundle.
- Built the in-app notification center in Vue.js and Spring Boot.

**Frontend performance**

- Rendered 100,000-row trace reports by loading them in parallel pages, virtualized editors holding thousands of rows with IntersectionObserver, and built custom HTML5 Canvas charts for real-time metrics.

**Keywords this experience covers:** TypeScript, Vue.js, Vuex, Vite, Tailwind CSS, Node.js, Java, Spring Boot, MariaDB, InfluxDB, Flyway, Playwright, Vitest, JUnit, Hugo, GitHub Actions, REST API, MCP, WebSockets, Web Workers, Service Workers, HTML5 Canvas, WebExtension API, Chrome DevTools Protocol, OpenAPI, Content Security Policy, CI
