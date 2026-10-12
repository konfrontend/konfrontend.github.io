**Product and stack**

- Built the site alone: Nuxt 4 and Vue 3 in TypeScript, Tailwind CSS v4, a Sanity Studio, and a prerendered Cloudflare Worker in two locales.
- Ran a deterministic agentic workflow on a 15-term glossary: 44 commits and 10 pull requests solo.
- Met WCAG AA contrast over photographic backgrounds with a brightness ceiling and a uniform veil; Lighthouse accessibility 100.

**CMS**

- Modeled the content in 14 Sanity schema types: 5 singletons pinned to fixed ids, and a project page builder of slider, gallery and text blocks.
- Localized en and fr document-level for projects and field-level on singletons, resolved in GROQ with an English fallback, every query typed by Sanity TypeGen.

**Deployment**

- Deployed through Workers Builds: a Sanity publish webhook triggers a rebuild, live in about 1 to 3 minutes, with no runtime CMS requests.
- Gated pull requests in GitHub Actions with typecheck and 72 Vitest cases; branch previews set noindex, cased URLs redirect to lowercase.

**Performance optimization**

- Lighthouse 99 performance on desktop and mobile with zero layout shift: inlined critical CSS, immutable cache headers, a 650 KB layered backdrop replaced by one CMS image.
- Built one image component: AVIF and WebP from the Sanity CDN, srcset clamped to native width, LQIP blur-up, and preload with fetchpriority for the LCP image only.
- Cut font-face declarations from about 37 to 13 with explicit families, weights and subsets, preloaded only the heading face; PhotoSwipe and the booking form load on demand.

**SEO**

- Lighthouse SEO 100: hreflang and canonicals per locale, per-locale sitemaps, schema.org Person, share images cropped from Sanity, and no trailing-slash redirect for Googlebot.

**Keywords this experience covers:** TypeScript, Vue.js, Nuxt, Tailwind CSS, Sanity, GROQ, Cloudflare Workers, GitHub Actions, Vitest, SSG, i18n, SEO, Core Web Vitals, Accessibility, Architecture Decision Records, CI
