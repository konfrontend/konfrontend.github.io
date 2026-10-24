# Konstantin Dolbilov

Full Stack Developer

Gijon, Spain (UTC+2) • [cossamedia@gmail.com](mailto:cossamedia@gmail.com) • [github.com/konfrontend](https://github.com/konfrontend) • [linkedin.com/in/konstantin-dolbilov-94720b361](https://www.linkedin.com/in/konstantin-dolbilov-94720b361)

Full stack developer with 10+ years shipping web products end to end in TypeScript and Java: React and Vue.js frontends, 3D graphics in WebGL, Node.js and Spring Boot REST APIs, Electron apps, and workflows for AI coding agents.

## Skills

- Languages: TypeScript, JavaScript, Java, SQL, HTML, CSS
- Frontend: React, Vue.js, Nuxt, Zustand, TanStack Query, Tailwind CSS, shadcn/ui, GSAP, Electron
- Web platform: Core Web Vitals, Accessibility (WCAG), SEO, SSG, i18n, PWA, Web Workers, WebSockets
- Graphics: three.js, React Three Fiber, WebGL, GLSL, SVG, Canvas API
- Backend and data: Node.js, Hono, Spring Boot, REST API, Role-based access control (RBAC), PostgreSQL, SQLite, Drizzle ORM, Zod
- Testing, build and DevOps: Vitest, Playwright, JUnit, Vite, Turborepo, GitHub Actions, CI/CD, Docker
- AI tooling: Claude Code, Model Context Protocol (MCP), Agentic Workflows, Prompt Engineering
- Methodologies: Agile/Scrum, Object-Oriented Programming (OOP), Domain Modeling, Architecture Decision Records

## Professional Experience

### [loadster] [Loadster](https://loadster.com) – Cloud SaaS for load testing and uptime monitoring of websites and APIs.

Full Stack Web Developer (Contract) | Mar 2019 – Present

- [design-system] Built 314 of the 332 components in the Vue.js design system on a Tailwind CSS theme, shared by 2 product dashboards and the Hugo marketing site, and made the dashboard mobile-responsive and its auth flow mobile-first.
- [playwright-scripting] Shipped Playwright scripting for load tests across the Spring Boot API, the runtime, a Monaco Editor with custom IntelliSense, and live traces of a running test.
- [mcp-server] Built the Loadster MCP server in Spring Boot: 23 tools, each covered by JUnit test cases, that let AI agents use the private Loadster API under role-based access control (RBAC).
- [claude-workflow] Designed the team's Claude Code workflow as engineering infrastructure: layered instruction files, per-module glossaries, path-scoped conventions, a documentation skill, and build, CI, runtime, and design docs; merged pull requests rose from 22.5 to 31.5 a month (12-month averages).
- [vitest-intro] Introduced Vitest to the dashboard and Node.js runtimes and wrote 101 of its 207 test cases, plus 376 JUnit test cases across the Java backend.

### [jigawatt] [Jigawatt Solar](https://jigawatt.solar) – Software suite for solar installers: interactive 3D design and energy modeling.

Senior Frontend Developer (Contract) | Oct 2019 – Jul 2026

- [roof-engine] Authored the 3D roof modeling engine in React Three Fiber, WebGL and GLSL, 120+ modules and 34 components, tested by 64 Vitest cases: procedural roof volumes, reconstruction of roof structures by DCEL convex decomposition, and realtime editing.
- [shade-simulation] Built the shade simulation in a Web Worker: raycasting toward the sun over a Bounding Volume Hierarchy (BVH) finds each roof surface's shade fraction, and OffscreenCanvas renders shade heatmaps.

### [nataliiamusikhina] [Nataliia Musikhina Website](https://nataliiamusikhina.com) – Portfolio website for a tattoo artist.

Full Stack Developer (Freelance) | Jun 2026 – Aug 2026

- [site-stack] Built the site in Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4 and a Sanity Studio, prerendered in English and French and served by a Cloudflare Worker.

## Projects

### [timestop] [timestop](https://github.com/konfrontend/timestop) – Local-first time tracker app with an optional self-hosted sync server.

Author & Sole Full Stack Developer | Aug 2026 – Present

- [agent-workflow] Shipped 70 pull requests in 5 weeks solo with AI coding agents, working from a glossary, data rules, and decisions settled before code, under agent rules, skills, and Husky pre-commit hooks.
- [local-first-model] Designed the local-first model: desktop SQLite is the source of truth, each write commits its entity row and an append-only change log entry in one transaction, and the server mirrors the desktop one way.
- [sync-server] Built the one-way sync server in Hono on Node.js with PostgreSQL: one authenticated REST endpoint stores each change once by id and updates entity tables in one transaction, so replays are no-ops.
- [app-tests] Tested the desktop app at 3 levels: 452 Vitest unit tests with a harness built from the API contract over in-memory SQLite, 11 Playwright end-to-end tests, and a smoke test of the packaged Windows executable.
