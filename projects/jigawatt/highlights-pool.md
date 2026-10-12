# [Jigawatt Solar](https://jigawatt.solar)

Senior Front-end Developer | Oct 2019 – Jul 2026

Software suite for solar installers: interactive 3D design and energy modeling.

## Roof modeling

- **A** Authored and implemented the original 3D roof modeling engine and workflow: procedural generation of roof volumes from the outline in WebGL with realtime editing in React Three Fiber, built in TypeScript on a DCEL structure, a motorcycle-graph partition into convex cells and a lower envelope of face planes, so concave and fan-shaped roofs reconstruct correctly; covered by 64 Vitest cases.
- **B** Modeled roofs as a persisted topology graph of outline, per-edge offsets, per-face slopes and adjacency, rebuilt deterministically on load, so every roof edit, dormer and panel layout derives from one source of truth.

## Shade simulation

- **A** Made realtime shade simulation possible in the browser with Web Workers: a WebGL shade-loss analysis that reduces time-resolved insolation by real obstruction shading on site into per-roof production losses. Sun-path raycasting, shade accumulation and heatmap texture generation run off the main thread with BVH-accelerated raycasting (three-mesh-bvh) and OffscreenCanvas, so the WebGL editor stays responsive during year-long runs.
- **B** Cut shade simulation work from one run per roof to one site-wide scene per computation type, with results fanned out by receiver and each caster's self-shading excluded.

## Layout tool

- **A** Grew the Wiz drawing engine and geometry library into the main app's PV array layout tool, a Vue.js SVG editor over Google Maps satellite imagery where installers trace roof sections with azimuth, pitch and setback edges, autofill panels in portrait, landscape or stagger mode, and save layouts as images for proposals. Authored 93% of its geometry core, SVG canvas and Vuex store over 231 commits.
- **B** Wrote the layout tool's vector geometry core (vectors, lines, sections, panel arrays and segment intersection tests) that drives edge snapping, overlap avoidance and obstruction polygons inside roof sections that panels must clear.
- **C** Added CAD-style polygon drawing: each segment snaps to 90° or 45° from the previous one, inference lines guide back to the starting point, Shift toggles snapping, the keyboard moves the selected node, and live measurement labels sit on every segment.
- **C** Kept panel autofill from freezing the editor by turning the array scan into an async loop that yields to `requestAnimationFrame`, and moved array translate and rotate to GSAP.

## Solar estimator

- **B** Built the drawing engine of the public solar estimator that installers embed on their websites: homeowners trace roof sections on an SVG canvas over a captured Google satellite image, with multiple sections, pan and zoom synced to the map, touch and spacebar panning, and checkpoint undo and redo.
- **A** Wrote the estimator's geometry library alone, then reused it as the core of the main app's layout tool: convex hull, oriented minimum bounding box, image scale from latitude and zoom on the Web Mercator projection, and roof pitch correction, driving an automatic panel layout that tries 10 grid offsets, keeps the best fit and runs in chunks so the UI stays responsive.
- **C** Built panel editing on the layout: drag with snapping, Alt-drag duplication, multi-select and group rotation with a custom rotary control, and panel clusters computed from the convex hull and bounding box.
- **C** Rendered the system image each lead carries by serializing the SVG and drawing it with canvg into a 1024×1024 JPEG framed to fit the layout.
- **C** Co-built the estimate and pricing step: a production estimate from the NREL PVWatts API, a loan calculator with amortization, paydown rate and period, and the validated lead form that posts to the public API.

## Document signing

- **A** Built the in-browser PDF viewer where installers and customers fill and sign proposals and contracts: PDF.js renders AcroForms as editable fields, Mustache shortcodes prefill them, and manage, read-only and customer modes control who can edit.
- **B** Built the signing pipeline on pdf-lib: lockable fields stored in the document metadata freeze once a party submits, signatures embed as PNG scaled to their fields, and the document flattens with an embedded custom font once every required party has submitted, so the download is the signed file.

## Workflow tools

- **B** Built a visual editor for checklist templates on an SVG canvas: task nodes with input and output ports joined by wires, a custom drag engine on GSAP Draggable that traces several connections at once, auto-placed default connections, a grab zone to break links, rules against upward links and input overload, and links that break when a task moves.
- **C** Extended an open-source calendar, ported into the codebase, into the team's task calendar with a grid-based day view for variable-height events, real task data in month and week views, and filters by assignee and text with date sorting.

## Frontend architecture

- **A** Decided the production frontend stack alone after prototyping the layout designer in Vue.js: React, TypeScript, Vite and React Three Fiber, with a feature-driven structure, a Zustand store layout, lint rules and a plan-to-scene coordinate boundary (Z-up to Y-up) that the whole 3D stack follows.
- **B** Finished the main app's move to Vite and built its PWA update flow: an update prompt instead of a forced reload, update checks on startup and on navigation, and an HTTPS local preview for service-worker debugging.

## Engineering workflow

- **B** Introduced Vitest and wrote all 17 test files of the 3D designer, 140 cases, plus the agent guide, domain glossary, coding standards and 11 architecture decision records that developers and AI agents work from.
- **C** Authored 47% of the 3D designer's commits and 37 of its 84 merged PRs among 8 contributors.

**Skills:** TypeScript, React, Vue.js, three.js, React Three Fiber, drei, Vite, Zustand, Redux, Vuex, Tailwind CSS, shadcn/ui, GSAP, Vitest, Google Maps API, PDF.js, WebGL, GLSL, SVG, CSG, Computational Geometry, Web Workers, OffscreenCanvas, PWA, Service Workers, IndexedDB, Code Quality
