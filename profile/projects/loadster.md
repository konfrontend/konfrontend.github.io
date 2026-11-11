---
url: https://loadster.com
role: Full Stack Developer
employment: contract
start: Mar 2019
end: Present
---
# Loadster

## Description
Cloud SaaS for load testing and uptime monitoring of websites and APIs.

### Agentic Workflow
Authored a Human-in-the-Loop AI-assisted engineering workflow, increasing the monthly average number of pull requests by 11.9 times. Shipping features from triage to code review within hours instead of days.

`Claude Code`, `AI Skills`, `Prompt Engineering`, `Token Optimization`, `Domain-driven Design (DDD)`, `Architecture Decision Records (ADR)`, `Test-driven Development (TDD)`, `Specification-driven Development (SDD)`

***

### Free Speed Test Funnel
Optimized UI/UX in a free-trial flow, increasing sign-up conversion by 20%.

***

### MCP Server
Built the MCP server in the Spring AI framework with role-based access control (RBAC) levels, from read-only to executing. The MCP client got approved by public marketplaces and is supported in Claude Code, Codex, ChatGPT, and Cursor.

### MCP Testing
Introduced a deterministic approach to MCP development, reducing the time to release new versions from weeks to days.

***

### Frontend Architecture
Shipped 300+ Vue 3 components, shared by 3 user-facing products and following the brand design system.

### Load Test Scripting
Built the script editor's GUI with revision history and an undo/redo stack.

### Pusher Worker
Moved the Pusher client into a SharedWorker, so all tabs in a browser share one WebSocket and get the same events from the backend. This brings conflict resolution, a notification system, and update delivery to the user-facing product.

### Vue 3 Migration
Performed the progressive migration from JavaScript/Webpack/Vue 2 to TypeScript/Vite/Vitest/Vue 3, introducing type safety and unit testing, and reducing build time to seconds.

`Vue 3`, `Composition API`, `Tailwind CSS 4`, `npm workspaces`

***

### Data Visualization
Built interactive 2D data-visualization components for real-time metrics rendering, featuring live updates, filters, zoom, aggregation, and public sharing (CSV, PDF, public URL) for business purposes.

`IntersectionObserver`, `requestAnimationFrame (rAF)`, `Canvas API`, `SVG`

***

### Browser Extension
<https://chromewebstore.google.com/detail/bkhfnmahbfjemfpgehoolkhhdhbidaan>
Co-authored the public Loadster Recorder Extension, used by 4,000 users and rated 4.9/5.0 stars in the Chrome Web Store. Complementing the load-testing product with live browser recording (HTTP or Playwright).

`TypeScript`, `WebExtension API`, `Service Worker API`, `Shadow DOM`, `Chrome DevTools Protocol (CDP)`, `Playwright`, `ARIA`, `Vue 3`, `Manifest V3`

***

## Notes

[status-pages] Shipped public status pages with per-monitor summaries and open incidents, built as a separate Vite entry so visitors skip the dashboard bundle.
[CI/CD] GitHub Actions CI with npm audit and dependency scanning.
[frontend-integrations] Integrated OpenAPI, Postman, Slack, and Webhooks into the Loadster dashboard.
[playwright-monaco] Integrated the Playwright framework scripting API with brand UI components and a customized Monaco Editor with custom IntelliSense.
[s3] The file-upload flow stores to S3.
[SSO/SAML] Reviewed API endpoint permissions and worked within the product's SSO/SAML and TOTP 2FA. Built the Stripe billing UI with reCAPTCHA on billing endpoints and background polling for the billing summary.
[rate-limit-recovery] Added automatic recovery from API rate limits: Spring Boot sends Retry-After, and the dashboard backs off and retries.
[vitest-intro] Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases, plus 376 JUnit test cases across the Java backend.
[dataset-editor] Built the dataset editor's undo and CSV preview for uploads up to 30 MB, with an inspector for values too long for a cell.
[recorder-overlay] Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, injected into every frame, and kept alive across cross-origin navigation by the background worker (a Service Worker in Chrome).
[manifest-v3] Migrated the extension to Manifest V3 and built its selector generation, wait-time recording, hover detection, and incognito window support.