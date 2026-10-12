# [Loadster](https://loadster.com)

Full-stack Web Developer | Mar 2019 – Present

Cloud SaaS for load testing and uptime monitoring of websites and APIs.

## Frontend performance

- **A** Kept the dashboard responsive at scale: replaced library charts with custom HTML5 Canvas line and stacked-area charts for real-time load test metrics, with zoom, tail zoom and report overlays, and built a virtualization component on IntersectionObserver that renders only visible rows and defers rendering to idle time, so the script and dataset editors hold thousands of rows. Loaded up to 100,000 trace rows per test report in parallel 10,000-row pages, and moved code formatting into a Web Worker so large code blocks never block the editor.
- **B** Migrated the Vue.js dashboard to the Composition API and from webpack to Vite, and introduced TypeScript progressively. Owned its Vue Router architecture: nested routes for the auth, account, monitoring and project areas with shared navigation guards, a separate build entry so sign-up loads without the app and billing code, and a route-level layout system where each route picks one of four layouts.
- **C** Sped up the home, project and monitor summary pages with paginated REST API endpoints and debounced realtime status events, cut API calls across the dashboard and replaced its icon font with preloaded SVG icons.

## Scripting and test authoring UX

- **A** Shipped Playwright scripting end to end: a script type with Spring Boot API endpoints, a Playwright runtime client, run history, results and a trace viewer, then live traces of a running load test, from entity, service and Flyway migration in the API to the viewer, with an architecture decision record and Vitest tests in the runtime. Built its editor on Monaco Editor with a custom IntelliSense module: the TypeScript language service loads Playwright's type definitions so imports resolve and scripts type-check while typing, and a completion provider serves Loadster's scripting API to the HTTP, browser and Playwright editors.
- **A** Evolved the HTTP script editor over seven years: revision history with rollback, editing-conflict detection with live presence over WebSockets, undo and redo as mutation replay over the Vuex store, drag and drop, a step drawer with search and variable tools, autocomplete, autoformat and protection against losing unsaved changes. Built the browser scripting UI with browser steps, wait-for steps and file uploads for browser bots, and gave the dataset editor snapshot-based undo and redo with bulk row and column selection and JSON copy and paste.
- **B** Built script import from OpenAPI specifications and Postman collections, generating HTTP steps with request bodies from schemas, resolving references and composition, and mapping Postman folders, auth and variables to Loadster steps.
- **C** Made the dataset editor preview CSV uploads up to 30 MB, and added a long-value inspector.

## Browser extension

- **A** Rewrote the Loadster Recorder extension in TypeScript on the WebExtension API and the Chrome DevTools Protocol to record user actions and generate Playwright Test code live, shipping Chrome and Firefox from one codebase, with GitHub Actions CI that also builds it as an npm library the dashboard installs from each tagged release.
- **B** Built the recorder overlay with Vue.js and Vite in a closed shadow root, injected into every frame and kept alive across cross-origin navigation by state held in the background worker; the Playwright recorder drives the page over the Chrome DevTools Protocol with Playwright's own selector engine and code generator.
- **A** Designed the bridge between the extension and the dashboard's recording dialog: a content script relays typed events to a long-lived port where one of three recorders (HTTP, browser, Playwright) streams events back, an install handshake connects open tabs without a reload, a version check added to the existing ping-pong blocks incompatible extensions, and the message types ship in the extension's npm library. The dashboard installs that public library as an external dependency and the source of its TypeScript types.
- **B** Extended recording across the extension, dashboard, API and runtimes with significant-click and hover detection, back and forward navigation, an incognito recording window, and a locator chain model that replaced selector sets in the Java command model and the browser runtime.
- **C** Authored about half of the extension's commits, including cross-browser support, selector generation, wait-time recording and the Manifest V3 migration.

## Realtime and monitoring

- **B** Fixed runaway WebSocket subscriptions by moving the Pusher client into a SharedWorker that holds one socket per origin and rebroadcasts channel events to every tab, and moved presence to Pusher presence channels with channel authentication in Spring Boot.
- **A** Built monitoring features full stack with Flyway migrations and unit tests: notification policies with delay and repeat, notification windows across timezones, tag filtering, period graphs, and monitor state pushed as realtime events that trigger a refetch. Moved monitoring from Speedway into Loadster.
- **B** Shipped public monitoring status pages on unauthenticated endpoints, with per-monitor summaries over a date range, open incidents, more than one page per customer and a separate dashboard build entry.
- **C** Built the in-app notification center, then in-app notifications with their API side, the first feature built on both halves of the stack.

## Backend and security

- **A** Built out the Loadster MCP server in Spring Boot from a prototype: 23 new tools for step detail, scenarios, engines, load test reports and monitoring, the prototype's script, dataset and authoring tools rewritten into feature packages, and 376 of the package's 419 JUnit test cases.
- **A** Hardened the MCP server for AI agents: tool schemas and validation derived from one Jackson introspection, argument errors that name the parameter and the expected shape, one digested log line per call, and the product manual served as a tool from the Hugo build.
- **A** Built an MCP development harness that runs sixteen realistic and adversarial probe prompts against seven Node.js fixture servers, six of them with planted faults, with no human in the loop, and records every tool call and how much of the agent's context each response spends.
- **C** Handled API rate limits end to end: a Retry-After header on the server, back-off and automatic retry in the dashboard, and recovery of large reports from HTTP 429.
- **C** Fixed InfluxDB time-series queries and Jackson serialization failures on scripts with large JSON payloads, and authored 26 Flyway migrations on MariaDB.
- **B** Removed unsafe-inline and unsafe-eval from the Content Security Policy across nginx and the Vue.js build.
- **B** Built report analysis tools full stack: URL grouping, customizable report and trace columns, trace and URL-pattern filters, and per-population performance stats.

## Design system and product UX

- **A** Built a Vue.js and Tailwind CSS component library with a written UX baseline (viewport, four route layouts, type scale, spacing) shared by the dashboard and the Hugo marketing site, both modules of the Loadster monorepo, so new screens no longer need a design round trip.
- **B** Split the UI into a common component layer shared by two products, Loadster and Speedway, then built the Speedway dashboard and made it responsive.
- **C** Made the dashboard and the registration flow work on mobile.
- **C** Built team permissions in the frontend: team switching, cross-app sign-in between Loadster and Speedway, and read-only viewers.
- **A** Designed and built the sign-up funnel for the free website speed test from research to production: a results page with a sticky email-only sign-up and a pitch driven by the grade, a shareable public report on unauthenticated rate-limited endpoints, and an analytics table that measures conversion, tested with Spring Boot and Vitest.
- **C** Built printable and public test reports.

## Engineering workflow

- **A** Rebuilt the team's engineering environment for AI agents: thin instruction layers that point to on-demand docs, a shared vocabulary with per-module glossaries, path-scoped Java and documentation conventions, a documentation skill that keeps the manual and editor autocomplete in sync with the code, and ADR and Linear ticket conventions. Team merged pull requests nearly doubled after the rewrite, from about 30 to about 55 a month.
- **B** Introduced Vitest to the dashboard and both Node.js runtimes and helped grow the Java suite: team test cases went from about 500 to about 1,900, Java cases more than tripled, and JavaScript cases went from 0 to about 200.
- **C** Wrote the docs that agents and developers navigate by: build and CI reference, runtime container docs, playback notes, the design baseline and the agent-facing manual build.
- **B** Shaped the dashboard's architecture: the common and product split, the composables layer, the test view split into live and report views, and npm workspaces for the dashboard and the Node.js runtimes.
- **C** Kept the build healthy: a Vite upgrade for a vulnerability, a Tailwind CSS migration with CSS validation, Sass warning cleanup and a production build for staging.

**Skills:** TypeScript, Vue.js, Vuex, Vite, Tailwind CSS, Node.js, Java, Spring Boot, MariaDB, InfluxDB, Flyway, Playwright, Vitest, JUnit, Hugo, GitHub Actions, REST API, MCP, WebSockets, Web Workers, HTML5 Canvas, WebExtension API, Chrome DevTools Protocol, OpenAPI, Content Security Policy, CI
