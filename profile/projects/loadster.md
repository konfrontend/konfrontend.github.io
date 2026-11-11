---
name: Loadster
url: https://loadster.com
role: Full Stack Developer
employment: contract
start: Mar 2019
end: Present
keywords: [TypeScript, Java, SQL, Object-oriented Programming (OOP), Vue.js, Vue Router, Vuex, Tailwind CSS, Design Systems, Responsive Design, i18n, Monaco Editor, Hugo, Canvas API, Service Workers, SharedWorker, Web Workers, WebSockets, Shadow DOM, IntersectionObserver, WebExtension API, Manifest V3, Chrome DevTools Protocol, Node.js, Spring Boot, REST API, OpenAPI, Model Context Protocol (MCP), Jackson, Pusher, MariaDB, InfluxDB, Flyway, Vitest, Playwright, JUnit, GitHub Actions, CI/CD, Code Review, Docker, Vite, webpack, npm workspaces, Role-based access control (RBAC), Content Security Policy, Claude Code, Agentic Workflows, AWS (S3), Stripe, Third-party integrations / webhooks]
---
# Loadster

## Description
Cloud SaaS for load testing and uptime monitoring of websites and APIs.

### Agentic Workflow
Authored a Human-in-the-Loop AI-assisted engineering workflow, increasing the monthly average pull requests number by 11.9 times. Shipping features from triage to code review within hours instead of days.

`Claude Code`, `AI Skills`, `Prompt Engineering`, `Token Optimization`, `Domain-driven Design (DDD)`, `Architecture Decision Records (ADR)`, `Test-driven Development (TDD)`, `Specification-driven Development (SDD)`

***

### [free-speed-test-funnel]
Optimized UI/UX in a free trial flow, increasing sign-up conversion by 20%.

***

### [mcp-server]
Built the MCP server in a Spring AI framework with role-based access control (RBAC) levels, from read-only to executing. MCP client got approved by public marketplaces and is supported in Claude Code, Codex, ChatGPT, and Cursor. 

[mcp-testing] Introduced a deterministic approach to MCP development, reducing the time to release new versions from weeks to days.

***

### [frontend-architecture]
Shipped 300+ Vue 3 components, shared by 3 user-facing products and following the brand design system.

[load-test-scripting] Built script editor's GUI with revision history, undo/redo stack.

[pusher-worker] Moved the Pusher client into a SharedWorker, so all tabs in a browser share one WebSocket and get the same events from the backend. This brings conflict resolution, notification system, and updates delivery to the user-facing product.

[vue3-migration] Performed the progressive migration from JavaScript/Webpack/Vue2 to TypeScript/Vite/Vitest/Vue3, introducing type safety, unit testing, and reducing build time to seconds.

`Vue 3`, `Composition API`, `Tailwind CSS 4`, `npm workspaces`

***

### [data-visualization]
Built interactive 2D data-visualization components for real-time metrics rendering, featuring live-update, filters, zoom, aggregation, and public sharing (CSV, PDF, public URL) for business purposes.

`IntersectionObserver`, `RequestAnimationFrame (RAF)`, `HTML5 Canvas`, `SVG`

***

### Browser Extension
<https://chromewebstore.google.com/detail/bkhfnmahbfjemfpgehoolkhhdhbidaan>
Co-authored the public Loadster Recorder Extension, used by 4000 users and rated of 4.9/5.0 stars in Chrome Web Store. Complimenting the load-testing product with live browser recording (HTTP or Playwright).

`TypeScript`, `WebExtension API`, `Service Workers API`, `Shadow DOM`, `Chrome DevTools Protocol (CDP)`, `Playwright`, `ARIA`, `Vue 3`, `Manifest V3`

## Miscellaneous

[status-pages] Shipped public status pages with per-monitor summaries and open incidents, built as a separate Vite entry so visitors skip the dashboard bundle.
[CI/CD] GitHub Actions CI with npm audit and dependency scanning.
[frontend-integrations] Integrated OpenAPI, Postman, Slack, and Webhooks into the Loadster dashboard.
[playwright-monaco] Integrated Playwright framework scripting API with brand UI components and customized Monaco Editor with custom IntelliSense.
[s3] The file-upload flow stores to S3.
[SSO/SAML] Reviewed API endpoint permissions and worked within the product's SSO/SAML and TOTP 2FA. Built the Stripe billing UI with reCAPTCHA on billing endpoints and background polling for the billing summary.
[memory-leak] The activity feed (the product's audit log) with its structure and pagination.
[rate-limit-recovery] Added automatic recovery from API rate limits: Spring Boot sends Retry-After, and the dashboard backs off and retries.
[vitest-intro] Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases, plus 376 JUnit test cases across the Java backend.
[dataset-editor] Built the dataset editor's undo and CSV preview for uploads up to 30 MB, with an inspector for values too long for a cell.
[recorder-overlay] Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, injected into every frame, and kept alive across cross-origin navigation by the background worker (a Service Worker in Chrome).
[manifest-v3] Migrated the extension to Manifest V3 and built its selector generation, wait-time recording, hover detection, and incognito window support.