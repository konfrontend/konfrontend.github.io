# CV guidelines

Rules every scan and port follows: facts, highlights, bullets, keywords, and the shape of a pool and of the draft. Rendering the PDF is the `cv-pdf` skill's concern, not this file's. `build/lint.mjs` checks the mechanical rules on the draft and every pool; it reads the keyword names from the Tiers below.

## Facts

- The user has authority on facts. The codebase and git history do not show the full picture; a compact PR can hide a great deal of effort. When the user calls a fact valuable and rightfully claimed, do not argue. Frame it from its strongest side.
- A fact does not need a number to go into the pool.
- Tell a project's history as the user tells it. A repository's creation date or first commit says nothing about a migration, a rebuild or its duration.
- No lying. When a fact is valuable but hard to prove, write "experienced with X", "shipped X", "worked in production with X". Never invent a number.
- Numbers come only from git or from the user. The pool does not record where a number came from.
- A fact the user states in chat during a scan or a port is a clue. A port writes it into the pick's highlight in the pool first, then into the bullet, with the meaning the user gave it; the pool stays the only source.
- This repository is public. No colleague names, no organisation slugs, no internal product names that are not public, nothing confidential.

## Highlights

- One sentence, two when the problem needs stating. Under 100 words, aim for far less.
- Name the technical detail or the skill, using the keyword rules below.
- No dates, commit hashes, commands or file paths.

## Bullets

- A bullet is an interview opener. It names the result and what was used, and leaves the mechanism in the pool for the reader to ask about.
- Start with an action verb. No "I" or "we".
- Three parts in any order, except that what was used never leads: what was achieved, what was used to achieve it (the named technology or field), and how it shows (a measurement or the scope). The third part is optional and raises a bullet's value most, so it goes in whenever the pool has one worth the space.
- A stack bullet names the project's full stack, every Platforms-tier technology, with TypeScript left out as implied. It covers "what was used" for the other bullets of that project; they do not repeat its names.
- One sentence. Two only when one cannot hold the parts. No colon that opens an explanation ("roof engine: it splits the outline"), no clause that restates the outcome (", so new screens no longer need a design round trip").
- Every clause stands without the codebase. A detail an outside reader cannot place ("errors that name the bad argument") goes.
- Name the field, not the algorithm: Computational Geometry and Web Workers in the bullet; convex cells, lower envelope, raycasting and heatmap generation in the pool. The pool is public and keeps them; the draft never carries them.
- Show results, not duties.
- Describe what shipped. Name what it replaced only when the replaced work was not the user's own. Never name a starting point that shrinks the work: not "from a prototype".
- Strongest truthful framing. Take the highest rung of the Ownership ladder the pick's facts support, and never a rung below the pick's own verb: the pool's "decided" does not become "chose".
- A measurement is one a reader can judge without the repository: a rate per period with its baseline ("from about 30 to about 55 merged pull requests a month"), users, team size, revenue, latency. Counts of tests, cases, files, commits, documents, migrations or records never, even with a baseline; they stay in the pool.
- One measurement per bullet, the strongest. A second fact in the same bullet appears without its numbers ("introduced Vitest").
- Bullets stand in Rank order under their project, strongest first.
- At most two "and" in a bullet. A third means two facts fight for the line, or a list wants a colon.
- Cut every word in the Word list below.
- Up to 150 characters, under two rendered lines. A bullet that cannot fit goes to the user as a question; one the user accepts may run to 160, never more.

### Ownership ladder

Strongest first. A bullet takes the highest rung its pick supports and never drops below the pick's verb.

1. sole, alone
2. owned
3. led
4. decided
5. designed
6. built
7. co-built
8. contributed
9. helped

### Word list

Words a bullet never carries, curated from the user's corrections: when the user strikes a word from a bullet or a highlight as vague, a duty or coined, add it under its kind. `build/lint.mjs` reads this list.

- Vague quantifiers: various, multiple, several.
- Duties: responsible for.
- Coined terms: in-house.

## Keywords

### Tiers

A keyword earns its place by what it tells a recruiter or an ATS search about a senior web developer. Rank it before naming it.

1. **Platforms**, highest. Languages, frameworks, runtimes, databases, cloud and services that a job post lists as requirements: TypeScript, React, Vue.js, Node.js, Spring Boot, Playwright, Hugo, Docker, AWS, Cloudflare, InfluxDB, MariaDB, Stripe, Tailwind CSS, Vuex, Zustand, shadcn/ui, drei. Test: it could stand in a job post's requirements list.
2. **Capabilities**, next. Browser APIs, protocols, patterns and practices that show depth beyond a framework: Web Workers, WebSockets, OAuth, SSR, CI, WebExtension API, CSG. Test: an interviewer could ask you to explain it.
3. **Noise**, lowest. Two kinds:
   - Too specific: libraries and spec versions nobody hires for, such as Manifest V3, Pusher, Jackson, webextension-polyfill, vue-i18n, VueUse, Axios. Replace each with the capability it delivers: WebSockets, not Pusher; REST API, not Axios; WebExtension API, not Manifest V3.
   - Too generic: tools every senior developer is assumed to use, such as Git, Linear, ESLint, Prettier, and JavaScript next to TypeScript. Omit them, or name the practice they serve: Code Quality, not ESLint and Prettier.

Bullets and the Skills line name tiers 1 and 2 only. A highlight may keep a tier 3 name when it is the technical detail that makes the fact concrete, next to the capability it delivers.

### Names

- Write the name the project gives itself: `React`, `Vue.js`, `Node.js`, `Spring Boot`, `Tailwind CSS`, `three.js`. No synonyms, no abbreviations, no variants side by side.
- Write an acronym or its expansion, once. Use the field's own terms, never coined ones.
- Join two names with "and", never "+": "React and WebGL", not "React+WebGL".
- No version numbers: `Vue.js`, not `Vue 3`; `React`, not `React 18`; `OAuth`, not `OAuth 2.1`.
- Write job titles in full: "Senior Front-end Developer", not "Sr. FE Dev".
- Keywords live inside the bullets, in the form "did A using B", attached to the thing they built: `three.js` on the 3D designer, not on its raycasting. The draft has no Skills section.
- A tier 1 or 2 keyword appears once across a project's bullets, in the bullet it strengthens most or where it fills a gap.
- Never add a keyword you cannot defend in an interview.

## Rank

The agreed strength of a highlight against the others in its project, marked A, B or C in the pool.

- Criteria, in order: ownership scope, business impact, technical depth, keyword tier, relevance to the target role.
- A: the facts an interviewer must hear; sole or owned work with impact. B: strong work that supports an A or stands alone when the budget allows. C: true and worth keeping in the pool, rarely ported.
- The scan proposes a rank for every candidate at its theme review, with one line of reason; the user confirms. The port re-checks the picks' ranks and writes any change back to the pool.
- Rank decides the order of bullets under a project, which pick merges as a tail onto a stronger bullet, what is cut first over budget, and the order of parts in the project description.

## Humanizer

Run the humanizer skill on every candidate highlight and bullet before the user sees it. It never replaces, abbreviates or reorders a technology name, and it never removes a number.

## Pool structure

`projects/<project>/highlights-pool.md`:

- `#` title: the company's public brand name, no legal suffix, linked to its public site: `# [Jigawatt Solar](https://jigawatt.solar)`. The same link heads the project in the draft.
- One role line per role, exactly as in the draft: `Title | Mon YYYY – Mon YYYY` or `– Present`, en dash, title in full.
- A one-line description of the product, naming only the parts the user worked on, in Rank order, strongest first.
- `##` theme sections holding the highlights. Each highlight opens with its rank mark: `- **A** Built ...`.
- A closing `**Skills:**` line: canonical names, no versions, highest tier first, lowest tier replaced by umbrella terms.

## Draft structure

`draft.md`, one A4 page:

- Header: name, headline, contact line, summary. The headline is one role title. The contact line is plain text, with every URL written as the visible link text (`github.com/konfrontend`), because the PDF text layer keeps only the link text. The summary is two or three sentences, no keyword list. The user writes the header; port does not touch it.
- `## Professional Experience`, holding the commercial projects, then `## Projects`, holding the personal projects: work with no employer or client. No Education, no Skills.
- 3-4 projects, most recent first within each section. Each is a `###` heading, a one-line description and its role rows, all copied from the pool's header, then a `-` list of 3-6 bullets under `## Professional Experience` or 2-6 bullets under `## Projects`. About 17 bullets fit the page. `build/lint.mjs` reads these numbers from this line.
- Markup is plain Markdown, and position marks each part: `#` name, then the headline, the contact line and the summary as three paragraphs. Under each `###` heading, the description is the next paragraph, and the role rows follow as one paragraph with one role per line.
- No tables, columns or images. Conventional heading words only.
- Too long: cut the oldest and least relevant bullets first. Never shrink the font or margins.

## Sources

- [Google: how we hire](https://www.google.com/about/careers/applications/how-we-hire/)
- [Laszlo Bock: my personal formula for a winning resume](https://www.calstatela.edu/sites/default/files/formula_for_a_winning_resume.docx)
- [Laszlo Bock: resume mistakes](https://www.themuse.com/advice/5-huge-resume-mistakes-googles-head-of-hr-sees-all-the-time)
- [Amazon: resume writing tips](https://www.aboutamazon.com/news/workplace/amazon-job-application-resume-writing-tips)
- [Amazon: 7 tips from recruiters](https://www.aboutamazon.com/news/workplace/applying-at-amazon-7-tips-from-recruiters)
- [MIT CAPD: make your resume ATS friendly](https://capd.mit.edu/resources/make-your-resume-ats-friendly/)
- [MIT CAPD: crafting an effective resume](https://capd.mit.edu/resources/career-toolkit-crafting-an-effective-resume/)
- [Harvard OCS: create a strong resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/)
- [Greenhouse: unsuccessful resume parse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse)
- [React README](https://github.com/facebook/react) and [vuejs.org](https://vuejs.org/): the projects' own names
