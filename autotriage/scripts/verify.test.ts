// Fixtures for the script half of verify on both routes: a clean audit Letter and a clean cover
// letter pass, a Letter seeded with one Finding per Check group reports each one with the Fix the
// catalogue names, and a Letter the segmentation cannot read stops on slot/parse. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { analyse, segment, segmentEmployment, render, roleNoun, type VersionText, type Analysis } from "./verify.ts";
import { loadCatalogue, type Project } from "./lib.ts";

// Headers and caps come from the Slot catalogue, so a wording or cap change there does not break
// the fixtures; the tests pin segmentation and counting, not the current catalogue values.
const slotCatalogue = loadCatalogue("templates/letter-slots") as { headers: Record<string, string>; slots: { id: string; cap: Record<string, number> }[] };
const H = slotCatalogue.headers;
const cap = (id: string) => slotCatalogue.slots.find((s) => s.id === id)!.cap;

const profile = {
  word_cap: 350,
  terms: { rate: 60, rate_floor: 40, billing: "hourly-caps", subcontracting: "none", weekly_hours: { min: 0, max: 30 } },
};
const skillNames = ["TypeScript", "React", "Postgres"];
const voice = { language: "en-US", greeting: { freelance: "Hi,", employment: "Hello," }, sign_off: "Kon", banned_extra: ["synergy"], allowed_extra: ["leverage"], cite_role_period: false };
const story = { key: "rbac-admin", theme: "Admin", lead: "Built the RBAC admin and the SAML login.", context: "Collaborator and admin roles." };
const projects: Project[] = [{
  slug: "acme", file: "acme.md", errors: [],
  meta: { name: "Acme", url: "https://acme.example", role: "Full Stack Developer", employment: "contract", start: "2021-02", naming: "public", description: "B2B dashboard.", keywords: ["TypeScript"] },
  themes: [{ name: "Admin", stories: [story] }], stories: [story],
}];
const job = (family: string | null, flags = ["regulated-domain"], alert = 2) => ({
  frontmatter: { slug: "acme-audit", verdict: { family, flags, alert_level: alert } },
  body: "Client wants a HIPAA review of a PHI pipeline. Budget $2,000.",
});

const cleanAudit = `Hi,

As I understand it, you want a paid review of the pipeline before any build is priced, with PHI handling settled first.

${H.deliverables}
- Findings ranked by severity
- Map of what to keep, fix, or rebuild
- Effort and order for the next stage
- Assumptions and deferred items
If the review lands, the fixes continue from that list, each accepted against a written check.

${H.relevant_work}
Acme (https://acme.example), B2B dashboard, contractor since 2021. Built the RBAC admin and the SAML login.

${H.gaps}
No HIPAA project yet; the nearest work is the RBAC admin on Acme, so the PHI boundary comes first in the review.

${H.billing}
The review is capped at 20 hours, billed on actual hours; unused hours are not billed.

Madrid, Spain, six hours ahead of you, so my afternoon overlaps with your mornings; up to 30 hours a week.

Happy to answer whatever questions remain, here in Upwork Messages.

Kon`;

function run(body: string, family = "audit", { flags, alert, candidate = "2026-09-20-acme-audit", fm = {} }: { flags?: string[]; alert?: number; candidate?: string; fm?: object } = {}) {
  const letter = { frontmatter: { slug: "acme-audit", family, date: "2026-09-20", ...fm }, body, raw: "" };
  return analyse({ candidate, letter, job: job(family, flags, alert), profile, skillNames, voice, projects });
}
const ids = (r: Analysis) => r.findings.map((f) => f.id);
const has = (r: Analysis, id: string) => r.findings.some((f) => f.id === id);
const fixOf = (r: Analysis, id: string) => r.findings.find((f) => f.id === id)?.fix;

test("clean audit Letter passes the script Checks", () => {
  const r = run(cleanAudit);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["hook", "deliverables", "follow_on", "relevant_work", "gaps", "billing", "terms", "closing", "sign_off"]);
  assert.equal(r.brief.safeguards[0].slot, "deliverables");
  assert.deepEqual(r.brief.skills, ["TypeScript", "React", "Postgres"], "the brief lists the Profile's Skills");
  assert.deepEqual(r.brief.projects.map((p: any) => [p.slug, p.name, p.url, p.period, p.stories.length]), [["acme", "Acme", "https://acme.example", "2021-02 – present", 1]], "the brief harvests the Project facts from the meta and the Stories");
  assert.deepEqual(r.brief.projects[0].stories[0], { key: "rbac-admin", theme: "Admin", bullet: "Built the RBAC admin and the SAML login.", context: "Collaborator and admin roles." });
  assert.match(render(r, 0), /- \[rbac-admin\] Built the RBAC admin/);
});

test("voice: banned phrase, Profile extra, allowed extra, exclamation, plural, self-descriptive", () => {
  const body = cleanAudit
    .replace("Built the RBAC admin", "I'm excited to say we built the RBAC admin with synergy and leverage")
    .replace("here in Upwork Messages.", "here in Upwork Messages!")
    .replace("contractor since 2021", "senior contractor since 2021")
    .replace("and the SAML login.", "; the SAML login; the tests.");
  const r = run(body);
  assert.ok(has(r, "voice/semicolon-chain"), ids(r).join());
  assert.equal(fixOf(r, "voice/semicolon-chain"), "patch");
  assert.ok(has(r, "voice/banned-phrase"), ids(r).join());
  assert.ok(r.findings.some((f) => f.id === "voice/banned-phrase" && f.detail.includes("synergy")));
  assert.ok(!r.findings.some((f) => f.detail.includes('"leverage"')), "allowed_extra lifts the shared ban");
  assert.ok(has(r, "voice/exclamation"));
  assert.ok(has(r, "voice/first-person-plural"));
  assert.ok(has(r, "voice/self-descriptive"));
  assert.equal(fixOf(r, "voice/banned-phrase"), "patch");
  assert.ok(r.findings.every((f) => f.id !== "voice/first-person-plural" || f.slot === "relevant_work"));
});

test("voice: a quoted client phrase and the country US are not first-person plural", () => {
  const body = cleanAudit.replace("Built the RBAC admin", 'Built what the brief calls "our admin" for a US client');
  assert.ok(!has(run(body), "voice/first-person-plural"));
});

test("format: markdown, emoji, all-caps, indentation, contact, url count", () => {
  const body = cleanAudit
    .replace("Findings ranked by severity", "**Findings** ranked by SHOUTING severity")
    .replace("- Assumptions and deferred items", "  - Assumptions and deferred items 🚀")
    .replace("here in Upwork Messages.", "here in Upwork Messages or at kon@example.com, https://calendly.com/kon, https://a.example, http://b.example.");
  const r = run(body);
  assert.ok(has(r, "format/markdown"));
  assert.ok(has(r, "format/emoji"));
  assert.ok(r.findings.some((f) => f.id === "format/all-caps" && f.detail.includes("SHOUTING")));
  assert.ok(!r.findings.some((f) => f.id === "format/all-caps" && /RBAC|SAML|PHI|HIPAA/.test(f.detail)), "acronyms from the Profile, the Projects, and the Job are allowed");
  assert.ok(has(r, "format/indentation"));
  assert.ok(r.findings.filter((f) => f.id === "format/contact").length >= 2);
  assert.ok(r.findings.some((f) => f.id === "format/url-count" && f.detail.includes("not https")));
  assert.equal(fixOf(r, "format/url-count"), "regenerate");
});

test("slot: a colon header in second person fails, a verbatim question keeps its pronouns", () => {
  const r = run(cleanAudit.replace(`${H.billing}\n`, `Your rate and availability:\nRate is 60 USD.\n\n${H.billing}\n`));
  assert.ok(r.findings.some((f) => f.id === "slot/header-second-person" && f.slot === "answers"), ids(r).join());
  const r2 = run(cleanAudit.replace(`${H.billing}\n`, `What is your rate?\nRate is 60 USD.\n\n${H.billing}\n`));
  assert.ok(!has(r2, "slot/header-second-person"), ids(r2).join());
});

test("slot: an ask header over a list is the plan Slot", () => {
  const r = run(cleanAudit.replace(`${H.deliverables}\n`, "What I would deliver:\n"));
  const plan = r.slots.find((s) => s.id === "deliverables");
  assert.ok(plan && plan.demand === "What I would deliver", JSON.stringify(r.slots.map((s) => s.id)));
  assert.ok(!has(r, "slot/missing"), ids(r).join());
});

test("slot: extra Slot, header-missing list, family and folder mismatch", () => {
  const body = cleanAudit
    .replace(`${H.deliverables}\n`, "")
    .replace(H.billing, `${H.working_model}\nRequests come in through Upwork Messages.\n\n${H.billing}`);
  const r = run(body, "audit", { candidate: "2026-09-21-other-slug", fm: { family: "audit" } });
  assert.ok(has(r, "slot/header-missing"), ids(r).join());
  assert.ok(r.findings.some((f) => f.id === "slot/extra" && f.slot === "working_model"));
  assert.equal(fixOf(r, "slot/extra"), "remove");
  assert.ok(r.findings.filter((f) => f.id === "slot/family-mismatch").length >= 2);
  const r2 = run(cleanAudit, "fix");
  assert.ok(r2.findings.some((f) => f.id === "slot/missing" && f.slot === "milestones"), ids(r2).join());
  assert.ok(r2.findings.some((f) => f.id === "slot/extra" && f.slot === "deliverables"));
  assert.ok(r2.findings.some((f) => f.id === "slot/extra" && f.slot === "follow_on"));
});

test("slot/parse stops: too few blocks, a header in the tail, an unheadered block after the hook", () => {
  const r = run("Hi,\n\nHook.\n\nKon");
  assert.ok(has(r, "slot/parse"));
  assert.equal(fixOf(r, "slot/parse"), "stop");
  const r2 = run(cleanAudit.replace("Madrid, Spain", `${H.billing}\nMadrid, Spain`));
  assert.ok(r2.findings.some((f) => f.id === "slot/parse" && f.detail.includes("terms")), ids(r2).join());
  const r4 = run(cleanAudit.replace("Madrid, Spain", "My current availability:\nMadrid, Spain"));
  assert.ok(!has(r4, "slot/parse"), ids(r4).join());
  assert.equal(r4.slots.find((s) => s.id === "terms")!.header, "My current availability:");
  const r5 = run(cleanAudit.replace(H.relevant_work, "Show me one or two business applications you personally built or maintained. What were you responsible for?"));
  assert.ok(!has(r5, "slot/parse"), ids(r5).join());
  assert.equal(r5.slots.find((s) => s.id === "answers")!.demand, "Show me one or two business applications you personally built or maintained. What were you responsible for");
  const r3 = run(cleanAudit.replace(`${H.deliverables}\n- Findings`, `Some prose without a header.\n\n${H.deliverables}\n- Findings`));
  assert.ok(r3.findings.some((f) => f.id === "slot/parse" && f.detail.includes("follows the hook")), ids(r3).join());
});

test("length: hook, prose cap, total ceiling, second list", () => {
  const longHook = "As I understand it, " + "you want the pipeline reviewed and every PHI touchpoint listed before a single line of the build is priced or planned, ".repeat(2);
  const filler = ("Another sentence of prose that says nothing new about the work. ").repeat(60);
  const body = cleanAudit
    .replace(/As I understand it.*\n/, longHook + "\n")
    .replace("Built the RBAC admin and the SAML login.", "Built the RBAC admin.\n\nGaps list:\n- one\n- two")
    .replace("No HIPAA project yet;", filler + " No HIPAA project yet;");
  const r = run(body);
  for (const id of ["length/hook", "length/prose-cap", "length/total-ceiling", "length/list-lines"]) assert.ok(has(r, id), `${id} missing in ${ids(r).join()}`);
  assert.ok(r.findings.some((f) => f.id === "length/list-lines" && f.detail.includes("second list")));
  assert.equal(fixOf(r, "length/hook"), "regenerate");
});

test("length: relevant_work at its cap passes, one Project over fails", () => {
  const n = cap("relevant_work").paragraphs;
  const withProjects = (count: number) => cleanAudit.replace("Acme (https://acme.example), B2B dashboard, contractor since 2021. Built the RBAC admin and the SAML login.",
    Array.from({ length: count }, (_, i) => `Acme product ${i + 1} (https://acme.example/${i + 1}). Built the RBAC admin.`).join("\n\n"));
  assert.ok(!has(run(withProjects(n)), "length/relevant-work-count"));
  const over = run(withProjects(n + 1));
  assert.ok(over.findings.some((f) => f.id === "length/relevant-work-count" && f.detail.includes(`cap ${n}`)), ids(over).join());
});

test("length: a plan list at its cap passes, one line over fails", () => {
  const n = cap("deliverables").lines;
  const withLines = (count: number) => cleanAudit.replace("- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items",
    Array.from({ length: count }, (_, i) => `- Artifact ${i + 1}`).join("\n"));
  assert.ok(!has(run(withLines(n)), "length/list-lines"));
  const over = run(withLines(n + 1));
  assert.ok(over.findings.some((f) => f.id === "length/list-lines" && f.slot === "deliverables" && f.detail.includes(`cap ${n}`)), ids(over).join());
});

test("terms and closing patterns: hour range, bounded window, call", () => {
  const body = cleanAudit
    .replace("so my afternoon overlaps with your mornings; up to 30 hours a week.", "reachable 08:00 to 21:00 CET, 20 to 30 hours a week, available now and through the next 90 days.")
    .replace("Happy to answer whatever questions remain, here in Upwork Messages.", "Happy to walk through the Acme admin on a call.");
  const r = run(body);
  assert.ok(has(r, "terms/hour-range"), ids(r).join());
  assert.ok(has(r, "terms/bounded-window"));
  assert.ok(has(r, "closing/call"));
  assert.equal(fixOf(r, "closing/call"), "patch");
});

test("answers paragraphs are excluded from prose but counted in total; when-job-asks Slots are reported", () => {
  const body = cleanAudit.replace(H.billing, `${H.stack}\nReact and TypeScript, because the client already runs them.\n\nSubcontracting:\nNone. All work is mine.\n\n${H.billing}`);
  const r = run(body);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.brief.job_asks_present, ["stack"]);
  assert.equal(r.slots.find((s) => s.id === "answers")!.demand, "Subcontracting");
  assert.equal(r.counts!.words - r.counts!.prose_words, 7 + 1 + 5 + 23);
});

test("segment reads the milestones Family without a follow_on", () => {
  const fix = cleanAudit
    .replace(`${H.deliverables}\n- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items\nIf the review lands, the fixes continue from that list, each accepted against a written check.`,
      `${H.milestones}\n1. Audit, 8 to 12 hours, read-only, findings ranked by severity.\n2. Access control, 10 to 20 hours.\n3. Tests, 8 to 12 hours.`);
  const seg = segment(fix, { headers: H, planSlot: "milestones" });
  assert.deepEqual(seg.errors, []);
  assert.deepEqual(seg.slots.map((s) => s.id), ["hook", "milestones", "relevant_work", "gaps", "billing", "terms", "closing", "sign_off"]);
  assert.equal(run(fix, "fix").fails, 0);
});

// The employment route: cover-letter.md against letter-employment, no headers, Slots by position.
const employmentTemplate = loadCatalogue("templates/letter-employment") as { cap: { chars: number } };
const employmentJob = (flags = ["regulated-domain"], requirements = ["Strong TypeScript skills", "Vue and Nuxt"]) => ({
  frontmatter: { slug: "acme-frontend", title: "Senior Frontend Developer (Vue)", route: "employment", requirements, verdict: { flags, alert_level: 2, decision: "go" } },
  body: "Acme is hiring a frontend developer for a Vue and Nuxt site. Requirements: TypeScript, SEO, accessibility.",
});
const cleanCover = `Hello,

I'm a frontend developer with 10+ years in TypeScript, Vue and Nuxt.

I build design systems and prerendered sites with technical SEO, accessibility and Core Web Vitals in mind, and cover them with automated tests.

Happy to answer any questions about my work.

Kon`;

// The Version as loadInputs reads it: the general Version's summary, Skills lines and selected Bullets as one text.
const summary = "10+ years as a frontend developer in TypeScript: Vue and Nuxt sites.";
const generalVersion: VersionText = { name: "general", source: "resume/versions/general.md", summary, skills: ["TypeScript", "React"], text: `Frontend Developer\n${summary}\nCore: TypeScript, React\nBuilt the RBAC admin and the SAML login.` };

function runCover(body: string, { candidate = "2026-10-16-acme-frontend", fm = {}, flags, requirements, version = generalVersion }: { candidate?: string; fm?: object; flags?: string[]; requirements?: string[]; version?: VersionText | null } = {}) {
  const letter = { frontmatter: { slug: "acme-frontend", date: "2026-10-16", version: version?.name ?? "general", ...fm }, body, raw: "" };
  return analyse({ candidate, letter, job: employmentJob(flags, requirements), profile, skillNames, voice, projects, version });
}
const versionIds = (r: Analysis) => r.findings.filter((f) => f.pass === "version").map((f) => f.id);

test("clean cover letter passes the script Checks within the template's character cap", () => {
  const r = runCover(cleanCover);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["intro", "relevant_work", "closing", "sign_off"]);
  assert.equal(r.brief.route, "employment");
  assert.equal(r.brief.template, "letter-employment");
  assert.equal(r.brief.family, null);
  assert.deepEqual(r.brief.safeguards, [], "a Safeguard whose Slot the template lacks is not briefed");
  assert.equal(r.counts!.char_cap, employmentTemplate.cap.chars);
  assert.ok(r.counts!.chars <= employmentTemplate.cap.chars);
  assert.equal(r.counts!.word_cap, null, "no prose cap on this route, whatever the Profile word_cap says");
  assert.equal(r.counts!.hook_max, null);
});

test("cover letter: over the character cap fails, the freelance word caps never apply", () => {
  const long = cleanCover.replace("and cover them with automated tests.", "and cover them with automated tests. " + "Another sentence about the work. ".repeat(12));
  const r = runCover(long);
  assert.ok(r.findings.some((f) => f.id === "format/char-ceiling" && f.detail.includes(`letter-employment cap ${employmentTemplate.cap.chars}`)), ids(r).join());
  for (const id of ["length/prose-cap", "length/total-ceiling", "length/hook"]) assert.ok(!has(r, id), `${id} in ${ids(r).join()}`);
});

test("cover letter: gaps and terms by position, terms read from its cues", () => {
  const gapsAndTerms = cleanCover.replace("Happy to answer", "No Jenkins pipeline yet; the nearest work is GitHub Actions for the same tests.\n\nBased in Spain and available now, with full overlap with your working day.\n\nHappy to answer");
  assert.deepEqual(runCover(gapsAndTerms).slots.map((s) => s.id), ["intro", "relevant_work", "gaps", "terms", "closing", "sign_off"]);
  const termsOnly = cleanCover.replace("Happy to answer", "Based in Spain and available now.\n\nHappy to answer");
  assert.deepEqual(runCover(termsOnly).slots.map((s) => s.id), ["intro", "relevant_work", "terms", "closing", "sign_off"]);
  const gapsOnly = cleanCover.replace("Happy to answer", "No Jenkins pipeline yet; the nearest work is GitHub Actions.\n\nHappy to answer");
  assert.deepEqual(runCover(gapsOnly).slots.map((s) => s.id), ["intro", "relevant_work", "gaps", "closing", "sign_off"]);
  const bounded = runCover(cleanCover.replace("Happy to answer", "Available for the next 90 days.\n\nHappy to answer"));
  assert.ok(has(bounded, "terms/bounded-window"), ids(bounded).join());
});

test("cover letter: a header, a missing Slot, a slug mismatch, a contact detail", () => {
  const header = runCover(cleanCover.replace("I build design systems", "Relevant work:\nI build design systems"));
  assert.ok(header.findings.some((f) => f.id === "slot/parse" && f.detail.includes("has none")), ids(header).join());
  const short = runCover("Hello,\n\nI'm a frontend developer.\n\nKon");
  assert.ok(short.findings.some((f) => f.id === "slot/parse" && f.detail.includes("too few blocks")), ids(short).join());
  const slug = runCover(cleanCover, { fm: { slug: "other" } });
  assert.ok(slug.findings.some((f) => f.id === "slot/family-mismatch" && f.detail.startsWith("cover-letter.md slug")), ids(slug).join());
  const contact = runCover(cleanCover.replace("about my work.", "about my work at kon@example.com."));
  assert.ok(has(contact, "format/contact"), ids(contact).join());
});

test("segmentEmployment reads the greeting apart and every block as prose", () => {
  const seg = segmentEmployment(cleanCover);
  assert.deepEqual(seg.errors, []);
  assert.equal(seg.greeting!.lines[0], "Hello,");
  assert.ok(seg.slots.every((s) => s.header === null));
});

test("every Check names its routes; the Version Checks run on employment only", () => {
  const checks = loadCatalogue("verify").checks as { id: string; routes?: string[]; by: string; severity: string; fix: string }[];
  for (const c of checks) assert.ok(Array.isArray(c.routes) && c.routes.length, `${c.id} has no routes`);
  for (const id of ["version/keyword-coverage", "version/title-in-summary"]) {
    const c = checks.find((x) => x.id === id)!;
    assert.deepEqual([c.routes, c.by, c.severity, c.fix], [["employment"], "script", "warn", "none"], id);
  }
  const r = run(cleanAudit);
  assert.equal(r.version, null, "no Version pass on the freelance route");
  assert.ok(r.findings.every((f) => f.pass === "letter"));
});

test("Version pass: a covered Version reports nothing", () => {
  const r = runCover(cleanCover);
  assert.deepEqual(versionIds(r), [], JSON.stringify(r.findings));
  assert.equal(r.version!.role_noun, "Frontend Developer");
  assert.equal(r.version!.requirements, 2);
});

test("version/keyword-coverage: one Finding per requirement the Version sent does not carry", () => {
  // TypeScript is in the Skills lines; Postgres is a Skill the Version does not show; Jenkins is no Skill and not in the text
  const r = runCover(cleanCover, { requirements: ["Strong TypeScript skills", "Postgres", "Jenkins pipelines"] });
  const found = r.findings.filter((f) => f.id === "version/keyword-coverage");
  assert.deepEqual(found.map((f) => f.detail.split('"')[1]), ["Postgres", "Jenkins pipelines"]);
  assert.ok(found.every((f) => f.severity === "warn" && f.fix === "none" && f.slot === "version" && f.detail.endsWith("is not in resume/versions/general.md")));
  assert.equal(r.fails, 0);
  const bullet = runCover(cleanCover, { requirements: ["SAML login"] });
  assert.ok(!has(bullet, "version/keyword-coverage"), "a phrase in a selected Bullet counts");
});

test("version/keyword-coverage on tailored reads the Candidate's version.md", () => {
  const tailored: VersionText = { name: "tailored", source: "version.md in the Candidate folder", summary: "10+ years as a frontend developer.", skills: ["Vue"], text: "10+ years as a frontend developer.\nCore: Vue\nVue and Nuxt sites." };
  const r = runCover(cleanCover, { version: tailored, requirements: ["Strong TypeScript skills", "Vue and Nuxt"] });
  const found = r.findings.filter((f) => f.id === "version/keyword-coverage");
  assert.equal(found.length, 1, JSON.stringify(found));
  assert.ok(found[0].detail.includes("TypeScript") && found[0].detail.includes("version.md in the Candidate folder"));
});

test("version/title-in-summary: the role noun absent from the summary, or no summary at all", () => {
  const r = runCover(cleanCover, { version: { ...generalVersion, summary: "10+ years building web frontends in TypeScript, Vue and Nuxt." } });
  assert.deepEqual(versionIds(r), ["version/title-in-summary"]);
  assert.ok(r.findings[0].detail.includes('"Frontend Developer"'));
  const hyphen = runCover(cleanCover, { version: { ...generalVersion, summary: "10+ years as a front-end developer in TypeScript, Vue and Nuxt." } });
  assert.deepEqual(versionIds(hyphen), [], "front-end reads as frontend");
  const none = runCover(cleanCover, { version: { ...generalVersion, summary: null, text: null } });
  assert.ok(none.findings.some((f) => f.id === "version/title-in-summary" && f.detail.includes("missing or invalid")), versionIds(none).join());
  assert.equal(roleNoun("Lead Senior Front-end Engineer - Payments, Remote"), "Front-end Engineer");
});

test("an empty cover-letter.md body is a CV-only application: the Version pass alone", () => {
  const r = runCover("", { requirements: ["Jenkins pipelines"] });
  assert.equal(r.letter_skipped, true);
  assert.deepEqual(r.findings.map((f) => f.id), ["version/keyword-coverage"]);
  assert.equal(r.fails, 0);
  const out = render(r, 5);
  assert.match(out, /^version pass: 1 warn/);
  assert.match(out, /letter pass: skipped/);
  assert.ok(!out.includes("slots:"));
});

test("render prints the Version pass before the Letter pass", () => {
  const out = render(runCover(cleanCover, { requirements: ["Jenkins pipelines"] }), 5);
  assert.ok(out.indexOf("version pass:") < out.indexOf("script:"), out);
  assert.match(out, /warn version\/keyword-coverage "Jenkins pipelines"/);
});
