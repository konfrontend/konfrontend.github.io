# Konstantin Dolbilov

Senior Frontend Developer

Gijon, Spain (UTC+2) • [cossamedia@gmail.com](mailto:cossamedia@gmail.com) • [github.com/konfrontend](https://github.com/konfrontend) • [linkedin.com/in/konstantin-dolbilov-94720b361](https://www.linkedin.com/in/konstantin-dolbilov-94720b361)

10+ years building web frontends in TypeScript: React and Vue.js apps and design systems, 3D graphics in WebGL, Core Web Vitals and accessibility, plus Node.js REST APIs and workflows for AI coding agents.

## Skills

- Languages: TypeScript, JavaScript, HTML, CSS
- Frontend: React, Vue.js, Nuxt, Zustand, TanStack Query, Tailwind CSS, shadcn/ui, GSAP, Design Systems, Electron
- Web platform: Core Web Vitals, Accessibility (WCAG), SEO, SSG, i18n, PWA, Web Workers, WebSockets
- Graphics: three.js, React Three Fiber, WebGL, GLSL, SVG, Canvas API
- Backend and data: Node.js, REST API, Spring Boot, PostgreSQL, Zod
- Testing, build and DevOps: Vitest, Playwright, Vite, Turborepo, GitHub Actions, CI/CD
- AI tooling: Claude Code, Model Context Protocol (MCP), Agentic Workflows, Prompt Engineering
- Methodologies: Agile/Scrum, Domain Modeling, Architecture Decision Records (ADRs)

## Professional Experience

### [Loadster](https://loadster.com)

Cloud SaaS for load testing and uptime monitoring of websites and APIs.

Full Stack Web Developer (Contract) | Mar 2019 – Present

- Built 314 of the 332 components in the Vue.js design system on a Tailwind CSS theme, shared by 2 product dashboards and the Hugo marketing site, and made the dashboard mobile-responsive.
- Designed the dashboard architecture: a cross-product common layer, a composables layer, separate live and report views, and Vue Router nested routes with route-level layouts.
- Rewrote the recorder extension in TypeScript on the WebExtension API and Chrome DevTools Protocol: one codebase generates Playwright Test code live in Chrome and Firefox.
- Built the recorder overlay in Vue.js inside a closed Shadow DOM root, isolated from the page's CSS and scripts, and kept alive across cross-origin navigation by the background worker.
- Tuned frontend performance: rendered 100,000-row trace reports in parallel pages, virtualized editors of thousands of rows with IntersectionObserver, and built custom Canvas charts for real-time metrics.
- Cut WebSocket connections to one per origin by moving the Pusher client into a SharedWorker used by all tabs, and switched presence to Pusher presence channels.

### [Jigawatt Solar](https://jigawatt.solar)

Software suite for solar installers: interactive 3D design and energy modeling.

Senior Frontend Developer (Contract) | Oct 2019 – Jul 2026

- Authored the 3D designer's roof modeling engine in React Three Fiber, WebGL and GLSL, 34 components tested by 64 Vitest test cases: procedural roof volumes, DCEL convex decomposition, and real-time editing.
- Built the shade simulation in a Web Worker: BVH raycasting computes each roof surface's yearly shade from 2,600 sun positions in under 15 s without blocking the editor, rendered as OffscreenCanvas heatmaps.
- Chose the 3D designer's stack alone (React, TypeScript, Vite, Zustand, three.js); authored 47% of its commits, 37 of 84 merged pull requests among 8 contributors, all 17 test files (140 test cases), and 11 ADRs.
- Extended the solar estimator's drawing engine into a photovoltaic (PV) array layout tool in the Vue.js PWA, an SVG editor over Google Maps imagery, writing 93% of its vector geometry core over 231 commits.

### [Nataliia Musikhina Website](https://nataliiamusikhina.com)

Portfolio website for a tattoo artist.

Freelance Full Stack Developer | Jun 2026 – Aug 2026

- Built the site in Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4 and Sanity CMS, prerendered in English and French and served by a Cloudflare Worker instead of per-request SSR.
- Raised Lighthouse mobile performance from 85 to 99 and cut LCP from 3.6 s to 1.1 s with zero layout shift: traced the LCP to the heading, preloaded its font face and inlined the critical CSS.
- Built one shared image component that cut a 1.1 MB GIF to a 54 KB animated WebP (AVIF and WebP from the Sanity CDN, clamped srcset, LQIP), and reached WCAG AA contrast at Lighthouse accessibility 100.

## Projects

### [timestop](https://github.com/konfrontend/timestop)

Local-first time tracker app with an optional self-hosted sync server.

Author & Sole Full Stack Developer | Aug 2026 – Present

- Built the Electron app in React, TanStack Query and shadcn/ui, a Turborepo monorepo with one shared Zod entity package: 70 pull requests in 5 weeks with AI coding agents, 2 public macOS and Windows releases.
- Tested the app with 452 Vitest unit test cases and 11 Playwright end-to-end test cases in GitHub Actions CI.
