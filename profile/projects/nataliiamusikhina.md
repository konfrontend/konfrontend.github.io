---
name: Nataliia Musikhina Website
url: https://nataliiamusikhina.com
role: Full Stack Developer
employment: freelance
start: 2026-06
end: 2026-08
naming: public
description: Portfolio website for a tattoo artist.
keywords: [TypeScript, Vue.js, Nuxt, Tailwind CSS, Sanity, GROQ, Cloudflare Workers, GitHub Actions, Vitest, SSG, i18n, SEO, Core Web Vitals, Accessibility (WCAG), Architecture Decision Records, CI/CD]
---
## Overview

## Bullets

- [site-stack] Built the site in Nuxt 4, Vue 3, TypeScript, Tailwind CSS v4 and a Sanity Studio, prerendered in English and French and served by a Cloudflare Worker.
- [agent-delivery] Delivered the site in 9 weeks with AI coding agents: 42 Linear issues, each triaged for an agent or a human and written against a shared glossary and Architecture Decision Records (ADRs), merged in 10 pull requests.
- [cms-schemas] Modeled the content in 14 Sanity schema types: 5 singletons pinned to fixed ids and a page builder for projects with slider, gallery and text blocks, so the artist edits every page and its background without a developer.
- [localization] Localized content in English and French, document-level for projects and field-level for singletons, with an English fallback resolved in GROQ and every query typed by Sanity TypeGen.
- [prerender] Moved the site from per-request SSR to full prerender, decided in an ADR: a Sanity publish webhook triggers a Cloudflare Workers Builds rebuild, so edits go live in 1 to 3 minutes and no page queries the CMS at request time.
- [pr-gate] Gated pull requests in GitHub Actions on a typecheck and 72 Vitest cases covering the image module, SEO metadata, the prerender route list and URL redirects.
- [accessibility] Reached Lighthouse accessibility 100 and WCAG AA 4.5:1 contrast for all text over background photographs: one light text color, a uniform black overlay, and a grey brightness limit on the photographs.
- [lcp] Raised Lighthouse mobile performance on the home page from 85 to 99 and cut its LCP from 3.6 s to 1.1 s with zero layout shift: traced the LCP to the heading, not the background image, then preloaded its font face and inlined the critical CSS.
- [backdrop-image] Replaced a 650 KB layered CSS backdrop with one background image from Sanity, served as a 42 KB AVIF on mobile.
- [image-component] Built one shared image component that cut a project page's 1.1 MB GIF to a 54 KB animated WebP: AVIF and WebP from the Sanity CDN, srcset clamped to native width, low-quality image placeholders (LQIP), and a high-priority preload for the first visible image only.
- [font-faces] Cut the body font's @font-face declarations from 37 to 6 by declaring only the weights, styles and subset the site uses.
- [lazy-scripts] Loaded PhotoSwipe and the 15 KB Tally form script only when a visitor opens them, with the form link still working if the script fails.
- [seo-audit] Closed the gaps a baseline SEO audit found: project pages added to the per-locale sitemaps, hreflang links, per-page meta descriptions, schema.org Person data, and share images cropped from Sanity.
- [canonical-urls] Served one canonical URL per page: fixed project canonicals that returned 404, dropped the trailing-slash redirect hop, redirected mixed-case paths to lowercase, and set noindex on branch previews.

## Notes

- The CMS is Sanity Studio v6.
- Multilingual project documents; a curated bento-grid tattoo projects page.
- Fonts via @nuxt/fonts.
- SEO via @nuxtjs/seo.
