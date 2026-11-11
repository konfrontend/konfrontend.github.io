---
url: https://jigawatt.solar
role: Senior Frontend Developer
employment: contract
start: 2019-10
end: 2026-07
---
# Jigawatt Solar

## Description
SaaS for solar dealers and installers: from interactive 2D/3D design and energy modeling to CRM.

### CAD Engine
Engineered the user-facing 3D CAD-style modeling system in React Three Fiber, Zustand, and shadcn/ui. Shipped 80+ features, including procedural 3D mesh generation, real-time 3D topology editing, REST API and Google Maps API integrations.

`TypeScript`, `React 19`, `React Three Fiber`, `three.js`, `shadcn/ui`, `Tailwind CSS`, `Zustand`, `WebAssembly (WASM)`, `Azure Functions`, `Google Maps API`, `Computational Geometry`, `Computer-Aided Design (CAD)`

***

### Shade Simulation
Authored the time-based shade simulation on WebGL in a Web Worker: an async algorithm for converting more than 2,600 sun positions into a precise energy-loss data model for a given solar array installation. Featuring the GPU-based image generation pipeline for instant visual representation of raw data as high-resolution heat map textures.

`TypeScript`, `Web Workers API`, `WebGL`, `GLSL`, `three.js`, `Azure Blob Storage`, `Bounding Volume Hierarchy (BVH)`

***

### Public Wiz
<https://site.wiz.solar>
Built a public web experience for potential clients to plan a solar installation themselves: a 2D SVG drawing engine, a custom packing algorithm with O(n) complexity, draggable controls, Google Maps API integration, and a solar energy production calculator.

`Vue.js`, `Vuex`, `GSAP`, `SVG`, `Google Maps API`, `Microsoft SQL Server`

***

### AI and Contribution
Owned 47% of total commits among nine contributors. Introduced coding standards, developed a domain glossary, architecture decision records, and agentic skills using a vendor-neutral format.

`Claude Code`, `Test-driven Development (TDD)`, `Specification-driven Development (SDD)`, `Feature-driven Development (FDD)`, `Domain-driven Design (DDD)`, `Architecture Decision Records (ADR)`

***

### PWA Update
Built the PWA auto-update feature, preventing version skew and data loss.

`Progressive Web Application (PWA)`, `Service Worker API`, `Vue.js`

***

### PDF Sign
Developed a role-based PDF viewer with multi-party e-signing support and integrated it into the existing lead processing workflow.

`pdf-lib`, `PDF.js`, `AcroForms`, `PDF DOM Parsing`, `PDF Incremental Updates`

***

### Task Planning
Built the task planning board for CRM: reusable checklist templates in a node-based interactive editor with calendar integration.

`SVG`, `Vue.js`, `GSAP`

***

## Notes

- Scaled the shade simulation from 1 to 2,600 sun positions across a year at 10–50 samples per m², finishing in 40 ms to 15 s without blocking the editor.
- Wrote 93% of the layout tool's vector geometry core over 231 commits.

