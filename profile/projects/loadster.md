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

## Keywords
`TypeScript`, `JavaScript`, `Java`, `Vue`, `Vuex`, `Tailwind CSS`, `Canvas API`, `Stripe`, `Spring Boot`, `Spring AI`, `MariaDB`, `WebSockets`, `Playwright`, `Docker`, `WebExtension API`, `Chrome DevTools Protocol (CDP)`, `Manifest V3`, `Shadow DOM`, `i18n`

***

### Frontend Architecture
Shipped 300+ Vue 3 components, shared by 3 user-facing products and following the brand design system.

### Agentic Workflow
Authored an AI-assisted engineering workflow, increasing the monthly average of pull requests by 11.9 times.

### Free Speed Test Funnel
Optimized UI/UX in a free-trial flow, increasing sign-up conversion by 20%.

### MCP Server
Built an MCP server with role-based access control (RBAC) that limits what an AI agent can do, from read-only access up to launching cloud load tests that spend the customer's money.

### MCP Testing
Introduced a deterministic approach to MCP development, reducing the time to release new versions from weeks to days.

### Load Test Scripting
Built the script editor's GUI with revision history and an undo/redo stack.

### Pusher Worker
Resolved conflicting edits and out-of-sync tabs in the web dashboard by moving the Pusher client into a SharedWorker, so every tab shares one WebSocket.

### Vue 3 Migration
Performed the progressive migration from JS/Webpack/Vue 2 to TS/Vite/Vue 3, introducing unit testing and reducing build time to seconds.

### Data Visualization
Built interactive Canvas charts that render load test metrics in real time, with filters, zoom, and aggregation, plus CSV and PDF export and sharing by public URL.

### Browser Extension
Co-authored the public browser extension, used by 4,000 users and rated 4.9/5.0 in the Chrome Web Store.

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