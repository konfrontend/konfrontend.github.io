---
name: Jigawatt Solar
url: https://jigawatt.solar
role: Senior Frontend Developer
employment: contract
start: 2019-10
end: 2026-07
naming: public
domain: solar industry, PV system design
description: "Software suite for solar installers: interactive 3D design and energy modeling."
keywords: [TypeScript, React, Vue.js, three.js, React Three Fiber, drei, Vite, Zustand, Redux, Vuex, Tailwind CSS, shadcn/ui, GSAP, Vitest, Google Maps API, PDF.js, WebGL, GLSL, SVG, Constructive Solid Geometry (CSG), Web Workers, OffscreenCanvas, PWA, Service Workers, IndexedDB, Code Quality, Code Review, Jira, pdf-lib, MongoDB, Azure Functions, C++ / WebAssembly, "Computational geometry (CGAL, straight skeleton)"]
---
**Roof modeling**

- Authored the 3D roof modeling engine in React Three Fiber, WebGL and GLSL, 120+ modules and 34 components, tested by 64 Vitest cases: procedural roof volumes, reconstruction of roof structures by DCEL convex decomposition, and realtime editing.
  The editor reconstructs existing sites from LIDAR or builds new 3D roof models, then lays out PV arrays on the surfaces. C++ computational geometry (CGAL) is compiled to WebAssembly for the design engine.
- Persisted each roof as a topology graph and rebuilt its 3D geometry from it deterministically, so every roof edit, dormer, and panel layout derives from one source of truth.
  Users draw footprints and extrude them into volumes; dormer surfaces are derived live.

**Shade simulation**

- Built the shade simulation in a Web Worker: raycasting toward the sun over a Bounding Volume Hierarchy (BVH) finds each roof surface's shade fraction, and OffscreenCanvas renders shade heatmaps.
  The simulation follows the sun path over time to compute irradiance, shading and per-minute production, modeled against time-of-use rates.
- Scaled the shade simulation from 1 to 2,600 sun positions across a year at 10–50 samples per m², finishing in 40 ms to 15 s without blocking the editor.

**Layout tool**

- Extended the solar estimator's drawing engine into a Vue.js PV array layout tool: an SVG editor over Google Maps imagery with per-section azimuth and pitch, per-edge setbacks, and panel autofill.
- Wrote 93% of the layout tool's vector geometry core over 231 commits, starting from the estimator's library: edge snapping, overlap avoidance, and obstruction polygons that panels must clear.
- Added CAD-style polygon drawing with 90° and 45° snapping, inference lines, keyboard nudging, and live measurement labels.
- Made panel autofill non-blocking: it tries 76 grid offsets per roof section, one per requestAnimationFrame tick, and keeps the offset that fits the most panels.
- Built panel editing on GSAP Draggable: drag with snapping, Alt-drag duplication, multi-select, and group rotation with a custom rotary control.

**Solar estimator**

- Built the drawing engine of the public solar estimator installers link from their websites: homeowners draw roof sections in SVG over Google Maps imagery, with map-synced pan and zoom and checkpoint undo.
- Wrote the estimator's geometry library alone to drive automatic panel layout: convex hull, minimum bounding box, Web Mercator image scale, and pitch correction.

**Document signing**

- Built the in-browser PDF viewer where homeowners fill and sign proposals and contracts: PDF.js renders AcroForms as editable fields, merge tags prefill them, and installers lock fields and assign signers.
- Built multi-party e-signing on pdf-lib: each submission locks the filled fields for the next signer, drawn signatures are placed as PNG images, and the PDF flattens once every party has signed.

**Workflow tools**

- Built a node-based editor for checklist templates in SVG: one GSAP Draggable proxy moves task nodes and wires, and wires only run to later tasks, so templates stay acyclic.
- Extended vue-simple-calendar into the per-project task calendar: a grid-based day view, month and week views of the project's tasks, and a toggle for completed tasks.

**Frontend architecture**

- Chose the 3D designer's frontend stack alone: React, TypeScript, Vite, Zustand, and three.js, with a feature-driven structure, lint rules, and a documented Z-up to Y-up coordinate boundary.
  Jigawatt Solar is a CRM platform for solar professionals; the 2D/3D design editor is one module inside it, greenfield within an existing product ecosystem. Designed how the module fits the rest of the CRM: module dependencies, dependency injection, and API integration with the other parts of the system. Backend integration via Azure Functions and MongoDB; multi-environment builds on Azure.
- Built the Vue.js app's PWA auto-update: it checks for a new service worker on startup and every route change, and loads the new version on the next navigation.

**Engineering workflow**

- Introduced Vitest to the 3D designer and wrote all 17 of its test files, 140 cases.
- Wrote the 3D designer's AI coding agent guide, domain glossary, coding standards, and 11 architecture decision records.
  Authored the team's coding standards, ADRs and architecture docs; the repo carries ADRs, architecture docs and a domain glossary, and a zero-warning ESLint and typecheck gate every change.
- Authored 47% of the 3D designer's commits and 37 of its 84 merged PRs among 8 contributors.
