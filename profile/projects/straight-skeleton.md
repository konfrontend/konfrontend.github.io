---
name: straight-skeleton
role: Author & Sole Developer
employment: independent
start: 2025-05
naming: public
description: TypeScript library wrapping CGAL's weighted straight skeleton implementation via WebAssembly.
keywords: [TypeScript, C++ / WebAssembly, CGAL, Emscripten, CMake, Boost, RapidJSON, Vite, Vue.js, three.js, Research and Development (R&D)]
---
## Overview

## Bullets
- [weighted-wasm] Built a weighted straight skeleton for TypeScript, where none existed, by compiling CGAL's C++ implementation to WebAssembly and wrapping it in a typed API; the upstream package offered only the unweighted algorithm.
- [roof-prototype] Built an R&D prototype of Jigawatt's roof engine on a weighted straight skeleton computed in under 100 ms in the browser, proving the concept and pointing the team's roof work in the right direction.
- [extrusion] Wrote two WebAssembly entry points over CGAL: one extrudes a polygon with holes into a 3D roof mesh from per-edge weights and a maximum height, the other returns the 2D skeleton.

## Notes
