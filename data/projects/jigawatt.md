**Roof modeling**

- Authored the 3D roof modeling engine and workflow: procedural volume generation in WebGL, reconstruction, and realtime editing with React Three Fiber. Used a DCEL and convex decomposition approach for partitioning. Covered by 64 Vitest cases.
- Modeled roofs as a persisted topology graph rebuilt deterministically on load, so every roof edit, dormer, and panel layout derives from one source of truth.

**Shade simulation**

- Built the shade-loss simulation in Web Workers: sun-path raycasting optimized with Bounding Volume Hierarchy (BVH trees). OffscreenCanvas in a Web Worker context measures how much energy each roof loses to shade from nearby obstructions compared to insolation on site, while the editor stays responsive.

**Layout tool**

- Grew the Wiz drawing engine into the main app's PV array layout tool, a Vue.js SVG editor over Google Maps imagery with azimuth, pitch, and setback edges and panel autofill; authored 93% of its geometry core over 231 commits.
- Wrote the layout tool's vector geometry core that drives edge snapping, overlap avoidance, and obstruction polygons panels must clear.
- Added CAD-style polygon drawing with 90° and 45° snapping, inference lines, keyboard nudging, and live measurement labels.
- Kept panel autofill from freezing the editor by turning the array scan into an async loop yielding to requestAnimationFrame, with GSAP for translate and rotate.

**Solar estimator**

- Built the drawing engine of the public solar estimator that installers embed: homeowners trace roof sections on an SVG canvas over a Google satellite image, with pan and zoom synced to the map and checkpoint undo.
- Wrote the estimator's geometry library alone, then reused it as the core of the main app's layout tool: convex hull, minimum bounding box, Web Mercator image scale and pitch correction driving automatic panel layout.
- Built panel editing on the layout: drag with snapping, Alt-drag duplication, multi-select, and group rotation with a custom rotary control.

**Document signing**

- Built the in-browser PDF viewer where installers and customers fill and sign proposals and contracts: PDF.js renders AcroForms as editable fields, Mustache shortcodes prefill them, and three modes control who can edit.
- Built the signing pipeline on pdf-lib: fields lock once a party submits, signatures embed as PNG, and the document flattens with an embedded font once every party has signed, so the download is the signed file.

**Workflow tools**

- Built a visual editor for checklist templates on an SVG canvas: task nodes with ports joined by wires, a custom drag engine on GSAP Draggable, and rules against upward links and input overload.
- Extended an open-source calendar into the team's task calendar with a grid-based day view, real task data in month and week views, and filters by assignee and text.

**Frontend architecture**

- Decided the production frontend stack alone: React, TypeScript, Vite, Vitest, Zustand, and three.js, with a feature-driven structure, lint rules, and a plan-to-scene coordinate boundary the whole 3D stack follows.
- Finished the main app's move to Vite and built its PWA update flow: an update prompt instead of a forced reload, checks on startup and navigation, and an HTTPS local preview for service-worker debugging.

**Engineering workflow**

- Introduced Vitest and wrote all 17 test files of the 3D designer, 140 cases, plus the agent guide, domain glossary, coding standards and 11 architecture decision records.
- Authored 47% of the 3D designer's commits and 37 of its 84 merged PRs among 8 contributors.

**Keywords this experience covers:** TypeScript, React, Vue.js, three.js, React Three Fiber, drei, Vite, Zustand, Redux, Vuex, Tailwind CSS, shadcn/ui, GSAP, Vitest, Google Maps API, PDF.js, WebGL, GLSL, SVG, CSG, Computational Geometry, Web Workers, OffscreenCanvas, PWA, Service Workers, IndexedDB, Code Quality
