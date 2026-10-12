# Konstantin Dolbilov

Web Developer

Gijon, Spain (UTC+2) • [cossamedia@gmail.com](mailto:cossamedia@gmail.com) • [github.com/konfrontend](https://github.com/konfrontend) • [linkedin.com/in/konstantin-dolbilov-94720b361](https://www.linkedin.com/in/konstantin-dolbilov-94720b361)

Working on web software design, product UX, frontend and backend. Interested in interactive computer graphics. Open to contract or permanent roles.

## Professional Experience

### [Loadster](https://loadster.com)

Cloud SaaS for load testing and uptime monitoring of websites and APIs.

Full-stack Web Developer | Mar 2019 – Present

- Built a Vue.js and Tailwind CSS component library with a UX baseline for the dashboard and Hugo marketing site modules of the Loadster monorepo.
- Rewrote the Loadster Recorder extension in TypeScript on the WebExtension API, letting users record actions as test code live in Chrome and Firefox.
- Designed the bridge from the dashboard's recording dialog to the extension, with its public library as a fully typed dependency.
- Shipped Playwright scripting end to end, from the API and runtime to live traces of a running load test and a Monaco Editor with custom IntelliSense.
- Built the Loadster MCP server in Spring Boot with 23 new tools that let AI agents drive the whole product, tested with JUnit.
- Rebuilt the engineering environment for AI agents; merged pull requests rose from about 30 to about 55 a month.

### [Jigawatt Solar](https://jigawatt.solar)

Software suite for solar installers: interactive 3D design and energy modeling.

Senior Front-end Developer | Oct 2019 – Jul 2026

- Authored the 3D roof modeling engine and workflow: procedural volume generation in WebGL, reconstruction and realtime editing with React Three Fiber.
- Built the shade-loss simulation in Web Workers that measures how much energy each roof loses to shade from nearby obstructions compared to insolation on site.
- Decided the production frontend stack alone: React, TypeScript, Vite, Vitest, Zustand and three.js. Introduced ADRs and a feature-driven structure.
- Built in-browser proposal and contract signing on PDF.js, where each party's fields lock on submit and the download is the signed file.

## Projects

### [autotriage](https://github.com/konfrontend/autotriage)

Claude Code plugin that triages a freelance job posting and writes the proposal letter inside hook-enforced rails.

Author & Sole Developer | Sep 2026 – Present

- Authored a public Claude Code plugin, alone, that takes a freelance job posting through an agentic workflow to a proposal letter ready to paste.
- Enforced the workflow with hooks that deny an out-of-order step and tell the model why, and validate every data write against its JSON Schema.

### [Time Stop](https://github.com/konfrontend/timestop)

Local-first time tracker app with an optional self-hosted sync server.

Author & Sole Full-stack Developer | Aug 2026 – Present

- Authored the desktop app in Electron with React, TanStack Query, shadcn/ui and Turborepo, shipped for macOS and Windows on GitHub Releases.
- Designed the local-first model, SQLite as the source of truth, and built the self-hosted sync server that mirrors it in Hono on Node.js with PostgreSQL.
- Designed the two-dialect database layer in Drizzle ORM and Zod, and decided on the desktop database at about 52 MB of memory over one at about 1.3 GB.
- Built a deterministic agentic workflow on a glossary, rules and decisions settled before code: 70 pull requests in five weeks solo with AI agents.
