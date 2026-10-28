// Fixtures for the script half of verify on both routes: a clean Letter with each plan Slot and a clean
// cover letter pass, a Letter seeded with one Finding per Check group reports each one with the Fix the
// catalogue names, and a Letter the segmentation cannot read stops on slot/parse. The milestone lines and
// the bid after the sign-off, and a fenced Sent block, are not the Letter. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { analyse, segment, segmentEmployment, render, copiedRun, postingRuns, type Analysis } from "./verify.ts";
import { loadCatalogue, type Project } from "./lib.ts";

// Headers and caps come from the Slot catalogue, so a wording or cap change there does not break
// the fixtures; the tests pin segmentation and counting, not the current catalogue values.
const slotCatalogue = loadCatalogue("templates/letter-slots") as { headers: Record<string, string>; plan_slots: string[]; slots: { id: string; cap: Record<string, number> }[] };
const H = slotCatalogue.headers;
const cap = (id: string) => slotCatalogue.slots.find((s) => s.id === id)!.cap;

const profile = { terms: { rate: 60, rate_floor: 40, weekly_hours: { min: 0, max: 30 } } };
const skillNames = ["TypeScript", "React", "Postgres"];
const voice = { language: "en-US", greeting: { freelance: "Hi,", employment: "Hello," }, sign_off: "Kon", banned_phrases: ["I'm excited", "synergy", "I am writing to apply"] };
const bullet = { key: "rbac-admin", text: "Built the RBAC admin and the SAML login." };
const projects: Project[] = [{
  slug: "acme", file: "acme.md", errors: [],
  meta: { name: "Acme", url: "https://acme.example", role: "Full Stack Developer", employment: "contract", start: "2021-02", naming: "public", description: "B2B dashboard.", keywords: ["TypeScript"] },
  overview: "Built the admin over SSO.", bullets: [bullet], notes: ["Collaborator and admin roles."], warnings: [],
}];
const answers = [{ slug: "how-test-tenant-isolation", question: "How have you tested that one customer organisation cannot access another organisation's records?" }];
const job = (flags = ["regulated-domain"], body = "Client wants a HIPAA review of a PHI pipeline. Budget $2,000.", rate?: number) => ({
  frontmatter: { title: "Pipeline review", route: "freelance", verdict: "go", requirements: ["HIPAA"], flags, ...(rate === undefined ? {} : { rate }) },
  body,
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
Acme (https://acme.example), B2B dashboard. Built the RBAC admin and the SAML login.

Madrid, Spain, six hours ahead of you, so my afternoon overlaps with your mornings; up to 30 hours a week.

Happy to answer whatever questions remain, here in Upwork Messages.

Kon`;

function run(body: string, { flags, candidate = "2026-09-20-acme-audit", jobBody, rate }: { flags?: string[]; candidate?: string; jobBody?: string; rate?: number } = {}) {
  return analyse({ candidate, letter: { body }, job: job(flags, jobBody, rate), profile, skillNames, voice, projects, answers });
}
const ids = (r: Analysis) => r.findings.map((f) => f.id);
const has = (r: Analysis, id: string) => r.findings.some((f) => f.id === id);
const fixOf = (r: Analysis, id: string) => r.findings.find((f) => f.id === id)?.fix;

test("clean Letter with the deliverables plan Slot passes the script Checks; the prose after the list is the plan block's", () => {
  const r = run(cleanAudit);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["hook", "deliverables", "relevant_work", "terms", "closing", "sign_off"]);
  assert.equal(r.brief.plan_slot, "deliverables");
  assert.equal(r.brief.alert_level, 2, "recomputed from the stored flags");
  assert.equal(r.brief.safeguards[0].slot, "deliverables", "plan resolves to the plan Slot present");
  assert.deepEqual(r.brief.skills, ["TypeScript", "React", "Postgres"], "the brief lists the Profile's Skills");
  assert.deepEqual(r.brief.answers, answers, "the brief lists the Answers as a Letter source");
  assert.deepEqual(r.brief.claimed, [], "no claimed Skills given");
  assert.deepEqual(r.brief.projects.map((p: any) => [p.slug, p.name, p.url, p.period, p.bullets.length, p.notes]), [["acme", "Acme", "https://acme.example", "2021-02 – present", 1, ["Collaborator and admin roles."]]], "the brief harvests the Project facts from the meta, the Bullets and the Notes");
  assert.deepEqual(r.brief.projects[0].bullets[0], { key: "rbac-admin", text: "Built the RBAC admin and the SAML login." });
  const out = render(r);
  assert.match(out, /acme: Acme \(https:\/\/acme\.example\), Full Stack Developer, contract, 2021-02 – present, naming public, 1 Bullets, 1 Notes\n/);
  assert.ok(!out.includes("Built the RBAC admin") && !out.includes("Overview:"), "the output names each Project once and dumps no Bullet; the model reads the Project file");
  assert.match(out, /how-test-tenant-isolation: How have you tested/);
  assert.ok(!/[Ff]amily/.test(out));
});

test("voice: the Profile's banned_phrases, exclamation, plural, self-descriptive, self-deprecation, opener", () => {
  const body = cleanAudit
    .replace("Built the RBAC admin", "I'm excited to say we built the RBAC admin with synergy and leverage")
    .replace("here in Upwork Messages.", "here in Upwork Messages!")
    .replace("B2B dashboard.", "B2B dashboard, as a senior contractor.")
    .replace("and the SAML login.", "; the SAML login; the tests. I may not have the HIPAA badge. I am writing to apply.");
  const r = run(body);
  assert.ok(has(r, "voice/semicolon-chain"), ids(r).join());
  assert.equal(fixOf(r, "voice/semicolon-chain"), "patch");
  assert.ok(has(r, "voice/banned-phrase"), ids(r).join());
  assert.ok(r.findings.some((f) => f.id === "voice/banned-phrase" && f.detail.includes("synergy")));
  assert.ok(r.findings.some((f) => f.id === "voice/banned-phrase" && f.detail.includes("I am writing to apply")), "openers are banned");
  assert.ok(!r.findings.some((f) => f.detail.includes('"leverage"')), "a phrase off the Profile's list is not banned");
  assert.ok(has(r, "voice/exclamation"));
  assert.ok(has(r, "voice/first-person-plural"));
  assert.ok(has(r, "voice/self-descriptive"));
  assert.ok(r.findings.some((f) => f.id === "voice/self-deprecation" && f.detail.includes("I may not have")), "self-deprecation is a script fail");
  assert.equal(fixOf(r, "voice/self-deprecation"), "patch");
  assert.ok(r.findings.every((f) => f.id !== "voice/first-person-plural" || f.slot === "relevant_work"));
});

test("voice: a quoted client phrase and the country US are not first-person plural", () => {
  const body = cleanAudit.replace("Built the RBAC admin", 'Built what the brief calls "our admin" for a US client');
  assert.ok(!has(run(body), "voice/first-person-plural"));
});

test("voice/posting-copy: six words copied from the posting warn; an ask header is exempt", () => {
  const posting = "We need someone to review the pipeline before the pilot goes live in Boston. What is your rate and availability?";
  const copied = cleanAudit.replace("Built the RBAC admin and the SAML login.", "I can review the pipeline before the pilot goes live and report.");
  const r = run(copied, { jobBody: posting });
  assert.ok(r.findings.some((f) => f.id === "voice/posting-copy" && f.severity === "warn" && f.fix === "patch" && f.detail.includes("review the pipeline before the pilot")), ids(r).join());
  const asked = cleanAudit.replace("Madrid, Spain", "What is your rate and availability?\nMadrid, Spain");
  const r2 = run(asked, { jobBody: posting });
  assert.ok(!has(r2, "voice/posting-copy"), ids(r2).join());
  assert.equal(copiedRun("a b c d e f g", postingRuns("x a b c d e f y")), "a b c d e f");
  assert.equal(copiedRun("a b c d e", postingRuns("a b c d e f")), null, "five words are not a run");
});

test("format: markdown, emoji, all-caps, indentation, contact, url count; no url-list", () => {
  const body = cleanAudit
    .replace("Findings ranked by severity", "**Findings** ranked by SHOUTING severity")
    .replace("- Assumptions and deferred items", "  - Assumptions and deferred items 🚀")
    .replace("Built the RBAC admin", "Built the RBAC admin over SSO")
    .replace("here in Upwork Messages.", "here in Upwork Messages or at kon@example.com, https://calendly.com/kon, https://a.example, http://b.example.");
  const r = run(body);
  assert.ok(has(r, "format/markdown"));
  assert.ok(has(r, "format/emoji"));
  assert.ok(r.findings.some((f) => f.id === "format/all-caps" && f.detail.includes("SHOUTING")));
  assert.ok(!r.findings.some((f) => f.id === "format/all-caps" && /RBAC|SAML|SSO|PHI|HIPAA/.test(f.detail)), "acronyms from the Profile, the Projects (Overview included), and the Job are allowed");
  assert.ok(has(r, "format/indentation"));
  assert.ok(r.findings.filter((f) => f.id === "format/contact").length >= 2);
  assert.ok(r.findings.some((f) => f.id === "format/url-count" && f.detail.includes("not https")));
  assert.equal(fixOf(r, "format/url-count"), "regenerate");
  assert.ok(!has(r, "format/url-list"), "format/url-list is gone");
});

test("format/all-caps ignores known abbreviations: the acronym list (R3F) and Skill names", () => {
  assert.ok(!has(run(cleanAudit.replace("Built the RBAC admin", "Built the 3D editor in R3F and GLSL")), "format/all-caps"));
  const skill = analyse({ candidate: "2026-09-20-acme-audit", letter: { body: cleanAudit.replace("Built the RBAC admin", "Built the TSL admin") }, job: job(), profile, skillNames: [...skillNames, "TSL"], voice, projects, answers });
  assert.ok(!has(skill, "format/all-caps"), ids(skill).join());
  const unknown = run(cleanAudit.replace("Built the RBAC admin", "Built the QZX admin"));
  assert.ok(unknown.findings.some((f) => f.id === "format/all-caps" && f.detail.includes("QZX")), ids(unknown).join());
});

test("slot: a colon header in second person fails, a verbatim question keeps its pronouns", () => {
  const r = run(cleanAudit.replace("Madrid, Spain", "Your rate and availability:\nThe rate is in the bid.\n\nMadrid, Spain"));
  assert.ok(r.findings.some((f) => f.id === "slot/header-second-person" && f.slot === "answers"), ids(r).join());
  const r2 = run(cleanAudit.replace("Madrid, Spain", "What is your rate?\nThe rate is in the bid.\n\nMadrid, Spain"));
  assert.ok(!has(r2, "slot/header-second-person"), ids(r2).join());
});

test("slot: an ask header over a list is the plan Slot; numbered lines read as milestones", () => {
  const r = run(cleanAudit.replace(`${H.deliverables}\n`, "What I would deliver:\n"));
  const plan = r.slots.find((s) => s.id === "deliverables");
  assert.ok(plan && plan.demand === "What I would deliver", JSON.stringify(r.slots.map((s) => s.id)));
  assert.ok(!has(r, "slot/plan-count"), ids(r).join());
  const numbered = run(cleanAudit.replace(`${H.deliverables}\n- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items`, "What I would do first:\n1. Audit, 8 to 12 hours.\n2. Access control, 10 to 20 hours.\n3. Tests, 8 to 12 hours."));
  assert.ok(numbered.slots.some((s) => s.id === "milestones"), JSON.stringify(numbered.slots.map((s) => s.id)));
});

test("slot/plan-count: no plan Slot, or two, fails with regenerate; a header-missing list is the plan Slot", () => {
  const none = run(cleanAudit.replace(`${H.deliverables}\n- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items\nIf the review lands, the fixes continue from that list, each accepted against a written check.\n\n`, ""));
  assert.ok(none.findings.some((f) => f.id === "slot/plan-count" && f.detail.startsWith("no plan Slot")), ids(none).join());
  assert.equal(fixOf(none, "slot/plan-count"), "regenerate");
  const two = run(cleanAudit.replace("Madrid, Spain", `${H.working_model}\nRequests come in through Upwork Messages.\n\nMadrid, Spain`));
  assert.ok(two.findings.some((f) => f.id === "slot/plan-count" && f.detail.startsWith("2 plan Slots (deliverables, working_model)")), ids(two).join());
  assert.ok(!has(two, "slot/extra"), "every plan Slot is in the template; only the count is wrong");
  const headerless = run(cleanAudit.replace(`${H.deliverables}\n`, ""));
  assert.ok(has(headerless, "slot/header-missing"), ids(headerless).join());
  assert.ok(!has(headerless, "slot/plan-count"));
});

test("slot/extra: a Slot the template no longer lists (gaps, stack, follow_on headers read as answers; a stray Slot id fails)", () => {
  const r = run(cleanAudit.replace("Madrid, Spain", "Gaps:\nNo HIPAA project yet.\n\nMadrid, Spain"));
  assert.equal(r.slots.find((s) => s.demand === "Gaps")?.id, "answers", "an unknown header is an answers paragraph, never a gaps Slot");
  assert.ok(!has(r, "slot/extra"));
  const emp = analyse({ candidate: "2026-10-16-acme-frontend", letter: { body: cleanAudit }, job: { frontmatter: { route: "employment", verdict: "go" }, body: "" }, profile, skillNames, voice, projects });
  assert.ok(emp.findings.some((f) => f.id === "slot/parse"), "a freelance Letter does not read as a cover letter");
});

test("slot/parse stops: too few blocks, a header in the tail, an unheadered block after the hook", () => {
  const r = run("Hi,\n\nHook.\n\nKon");
  assert.ok(has(r, "slot/parse"));
  assert.equal(fixOf(r, "slot/parse"), "stop");
  const r2 = run(cleanAudit.replace("Madrid, Spain", `${H.relevant_work}\nMadrid, Spain`));
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
    .replace("Built the RBAC admin and the SAML login.", "Built the RBAC admin.\n\nMore work:\n- one\n- two")
    .replace("If the review lands", filler + " If the review lands");
  const r = run(body);
  for (const id of ["length/hook", "length/prose-cap", "length/total-ceiling", "length/list-lines"]) assert.ok(has(r, id), `${id} missing in ${ids(r).join()}`);
  assert.ok(r.findings.some((f) => f.id === "length/list-lines" && f.detail.includes("second list")));
  assert.equal(fixOf(r, "length/hook"), "regenerate");
  assert.equal(r.counts!.word_cap, 350, "the prose cap is the template's; no Profile word_cap");
});

test("length: relevant_work at its cap passes, one Project over fails", () => {
  const n = cap("relevant_work").paragraphs;
  const withProjects = (count: number) => cleanAudit.replace("Acme (https://acme.example), B2B dashboard. Built the RBAC admin and the SAML login.",
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

test("answers paragraphs are excluded from prose but counted in total; a stack ask is an answers paragraph", () => {
  const body = cleanAudit.replace("Madrid, Spain", "Proposed stack:\nReact and TypeScript, because the client already runs them.\n\nSubcontracting:\nNone. All work is mine.\n\nMadrid, Spain");
  const r = run(body);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.brief.job_asks_present, [], "no when-job-asks Slot on the freelance template");
  assert.deepEqual(r.slots.filter((s) => s.id === "answers").map((s) => s.demand), ["Proposed stack", "Subcontracting"]);
  assert.equal(r.counts!.words - r.counts!.prose_words, 23 + 3 + 2 + 9 + 1 + 5, "list lines, catalogue headers, ask headers and answers paragraphs");
});

test("segment reads the milestones and working_model plan Slots", () => {
  const list = `${H.deliverables}\n- Findings ranked by severity\n- Map of what to keep, fix, or rebuild\n- Effort and order for the next stage\n- Assumptions and deferred items\nIf the review lands, the fixes continue from that list, each accepted against a written check.`;
  const fix = cleanAudit.replace(list, `${H.milestones}\n1. Audit, 8 to 12 hours, read-only, findings ranked by severity.\n2. Access control, 10 to 20 hours.\n3. Tests, 8 to 12 hours.`);
  const seg = segment(fix, { headers: H, planSlots: slotCatalogue.plan_slots });
  assert.deepEqual(seg.errors, []);
  assert.deepEqual(seg.slots.map((s) => s.id), ["hook", "milestones", "relevant_work", "terms", "closing", "sign_off"]);
  const r = run(fix, { flags: ["burned-before", "regulated-domain"] });
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.equal(r.brief.plan_slot, "milestones");
  assert.deepEqual(r.brief.safeguards.map((s: any) => s.slot), ["milestones", "milestones"]);
  assert.equal(r.brief.alert_level, 4, "burned-before with regulated-domain steps up");
  const maint = run(cleanAudit.replace(list, `${H.working_model}\nRequests come in through Upwork Messages and go on a board you own. Each item is accepted against a written check, with a weekly summary.`));
  assert.equal(maint.fails, 0, JSON.stringify(maint.findings));
  assert.equal(maint.brief.plan_slot, "working_model");
});

// The employment route: letter.md against letter-employment, no headers, Slots by position.
const employmentTemplate = loadCatalogue("templates/letter-employment") as { cap: { chars: number } };
const employmentJob = (requirements = ["TypeScript", "Vue.js"]) => ({
  frontmatter: { title: "Senior Frontend Developer (Vue)", route: "employment", company: "Acme", employment: "full-time", timezone: "Europe/Madrid", verdict: "go", requirements },
  body: "Acme is hiring a frontend developer for a Vue and Nuxt site. Requirements: TypeScript, SEO, accessibility.",
});
const cleanCover = `Hello,

I'm a frontend developer with 10+ years in TypeScript, Vue and Nuxt.

I build design systems and prerendered sites with technical SEO, accessibility and Core Web Vitals in mind, and cover them with automated tests.

Happy to answer any questions about my work.

Kon`;

const generalVersion = { name: "general", source: "resume/versions/general.md", summary: "10+ years as a frontend developer in TypeScript: Vue and Nuxt sites.", skills: ["TypeScript", "React"], text: "Frontend Developer" };

function runCover(body: string, { candidate = "2026-10-16-acme-frontend", version = generalVersion as typeof generalVersion | null } = {}) {
  return analyse({ candidate, letter: { body }, job: employmentJob(), profile, skillNames, voice, projects, answers, version });
}

test("clean cover letter passes the script Checks within the template's character cap", () => {
  const r = runCover(cleanCover);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["intro", "relevant_work", "closing", "sign_off"]);
  assert.equal(r.brief.route, "employment");
  assert.equal(r.brief.template, "letter-employment");
  assert.equal(r.brief.plan_slot, null);
  assert.deepEqual(r.brief.safeguards, [], "no employment Flag has a Safeguard Slot, and none is stored");
  assert.deepEqual(r.brief.version, { name: "general", source: "resume/versions/general.md", summary: generalVersion.summary }, "the brief names the Version sent and its summary");
  assert.equal(r.counts!.char_cap, employmentTemplate.cap.chars);
  assert.ok(r.counts!.chars <= employmentTemplate.cap.chars);
  assert.equal(r.counts!.word_cap, null, "no prose cap on this route");
  assert.equal(r.counts!.hook_max, null);
  assert.match(render(r), /Version sent: general \(resume\/versions\/general\.md\); summary: 10\+ years/);
});

test("cover letter: over the character cap fails, the freelance word caps never apply", () => {
  const long = cleanCover.replace("and cover them with automated tests.", "and cover them with automated tests. " + "Another sentence about the work. ".repeat(12));
  const r = runCover(long);
  assert.ok(r.findings.some((f) => f.id === "format/char-ceiling" && f.detail.includes(`letter-employment cap ${employmentTemplate.cap.chars}`)), ids(r).join());
  for (const id of ["length/prose-cap", "length/total-ceiling", "length/hook", "slot/plan-count"]) assert.ok(!has(r, id), `${id} in ${ids(r).join()}`);
});

test("cover letter: a second middle block is terms; a third is too many; no gaps Slot", () => {
  const terms = cleanCover.replace("Happy to answer", "Based in Spain and available now, with full overlap with your working day.\n\nHappy to answer");
  assert.deepEqual(runCover(terms).slots.map((s) => s.id), ["intro", "relevant_work", "terms", "closing", "sign_off"]);
  const three = runCover(cleanCover.replace("Happy to answer", "No Jenkins pipeline yet; the nearest work is GitHub Actions.\n\nBased in Spain and available now.\n\nHappy to answer"));
  assert.ok(three.findings.some((f) => f.id === "slot/parse" && f.detail.includes("too many blocks")), ids(three).join());
  const bounded = runCover(cleanCover.replace("Happy to answer", "Available for the next 90 days.\n\nHappy to answer"));
  assert.ok(has(bounded, "terms/bounded-window"), ids(bounded).join());
});

test("cover letter: a header, a missing Slot, a contact detail", () => {
  const header = runCover(cleanCover.replace("I build design systems", "Relevant work:\nI build design systems"));
  assert.ok(header.findings.some((f) => f.id === "slot/parse" && f.detail.includes("has none")), ids(header).join());
  const short = runCover("Hello,\n\nI'm a frontend developer.\n\nKon");
  assert.ok(short.findings.some((f) => f.id === "slot/parse" && f.detail.includes("too few blocks")), ids(short).join());
  const contact = runCover(cleanCover.replace("about my work.", "about my work at kon@example.com."));
  assert.ok(has(contact, "format/contact"), ids(contact).join());
});

test("segmentEmployment reads the greeting apart and every block as prose", () => {
  const seg = segmentEmployment(cleanCover);
  assert.deepEqual(seg.errors, []);
  assert.equal(seg.greeting!.lines[0], "Hello,");
  assert.ok(seg.slots.every((s) => s.header === null));
});

test("every Check names its routes; the cut Checks are gone and the new ones are in", () => {
  const checks = loadCatalogue("verify").checks as { id: string; routes?: string[]; by: string; severity: string; fix: string }[];
  for (const c of checks) assert.ok(Array.isArray(c.routes) && c.routes.length, `${c.id} has no routes`);
  const idList = checks.map((c) => c.id);
  for (const gone of ["version/keyword-coverage", "version/title-in-summary", "job/gaps-required", "format/url-list", "slot/job-asks-unjustified", "slot/family-mismatch"]) assert.ok(!idList.includes(gone), `${gone} is cut`);
  for (const added of ["slot/plan-count", "voice/posting-copy", "voice/self-deprecation", "terms/rate-floor"]) assert.ok(idList.includes(added), `${added} is in`);
  assert.deepEqual(checks.find((c) => c.id === "terms/rate-floor"), { id: "terms/rate-floor", by: "script", severity: "warn", fix: "none", routes: ["freelance"] });
  assert.deepEqual(checks.find((c) => c.id === "flag/safeguard-missing")!.routes, ["freelance"]);
  assert.equal(new Set(idList).size, idList.length);
});

test("an empty letter.md on the employment route is a resume-only application: nothing to check", () => {
  const r = runCover("");
  assert.equal(r.letter_skipped, true);
  assert.deepEqual(r.findings, []);
  assert.equal(r.fails, 0);
  const out = render(r);
  assert.match(out, /^letter pass: skipped, letter\.md is empty \(a resume-only application\)\nversion: general/);
  assert.ok(!out.includes("slots:"));
});

test("the brief lists the claimed Skills as a Letter source", () => {
  const r = analyse({ candidate: "2026-10-16-acme-fix", letter: { body: cleanAudit }, job: job([]), profile, skillNames, claimed: ["Figma", "GSAP"], voice, projects, answers });
  assert.deepEqual(r.brief.claimed, ["Figma", "GSAP"]);
  assert.match(render(r), /Claimed Skills \(a Letter source, cited as "claimed Skill <name>"\): Figma, GSAP/);
});

// The milestone plan: the Letter body ends at the sign-off; the milestone lines and the bid follow it.
const milestoneLetter = `Hi,

As I understand it, you want the admin hardened before the pilot, starting from the existing code.

${H.relevant_work}
Acme, https://acme.example, a B2B dashboard. Built the RBAC admin and the SAML login.

Each milestone is accepted against a written check before the next one starts. Madrid, Spain, overlapping your mornings, up to 30 hours a week.

Happy to answer questions about any milestone.

Kon

1. Audit of the admin: read-only pass with a ranked findings list. $480, due Wed Oct 28
2. Access control fixes: roles checked on every endpoint. $600, due Mon Nov 2
Bid: $1,080`;

test("the milestone lines and the bid after the sign-off are not the Letter body; they carry the milestones plan Slot", () => {
  const r = run(milestoneLetter, { flags: ["burned-before"] });
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["hook", "relevant_work", "terms", "closing", "sign_off"]);
  assert.equal(r.brief.plan_slot, "milestones");
  assert.deepEqual(r.brief.safeguards.map((s: any) => s.slot), ["milestones"]);
  const body = milestoneLetter.slice(0, milestoneLetter.indexOf("\n\n1. Audit"));
  assert.equal(r.counts!.chars, body.length, "counts read the body alone");
  assert.equal(r.brief.after_sign_off, 3);
  assert.ok(!has(r, "length/list-lines") && !has(r, "slot/header-missing"), ids(r).join());
});

test("an optional fenced Sent block is skipped", () => {
  const sent = `${cleanAudit}\n\n\`\`\`Sent\nHi, the text as sent!!! WE SHOUT **here** at kon@example.com\n\nKon\n\`\`\`\n`;
  const r = run(sent);
  assert.equal(r.fails, 0, JSON.stringify(r.findings));
  assert.deepEqual(r.slots.map((s) => s.id), ["hook", "deliverables", "relevant_work", "terms", "closing", "sign_off"]);
  const m = run(`${milestoneLetter}\n\n\`\`\`Sent (milestones separately)\nHi!\n\`\`\``);
  assert.equal(m.fails, 0, JSON.stringify(m.findings));
  assert.equal(m.brief.after_sign_off, 3);
});

test("terms/rate-floor warns, never fails, when job.md's rate is under the Profile's rate_floor", () => {
  const under = run(cleanAudit, { rate: 30 });
  const f = under.findings.find((x) => x.id === "terms/rate-floor");
  assert.ok(f, ids(under).join());
  assert.equal(f!.severity, "warn");
  assert.equal(f!.fix, "none");
  assert.match(f!.detail, /rate 30 is under the Profile's rate_floor 40/);
  assert.equal(under.fails, 0);
  assert.ok(!has(run(cleanAudit, { rate: 40 }), "terms/rate-floor"), "at the floor is fine");
  assert.ok(!has(run(cleanAudit), "terms/rate-floor"), "no rate in job.md: the Profile rate applies");
});
