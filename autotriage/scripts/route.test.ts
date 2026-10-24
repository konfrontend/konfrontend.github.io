// Fixtures for the Candidate record and the Route split: one job.md schema for both routes, intake's
// route inference, the Verdict arithmetic from arguments, and the Flag sets per route. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { validate, validateArtifact, inferRoute, schemaForPath, flagsFor, loadCatalogue, templateFor, CANDIDATES_DIR, PROFILE_ROOT, VERSIONS_DIR } from "./lib.ts";
import { compute } from "./verdict.ts";
import { fixture, run } from "./fixture.ts";

const freelance = { title: "Full-Stack Developer - Clinic Booking MVP", route: "freelance", timezone: "America/New_York", location: "US" };
const employment = { title: "Senior Frontend Developer", route: "employment", company: "Heymondo", employment: "full-time", location: "Barcelona", timezone: "Europe/Madrid" };
const without = <T extends object>(obj: T, key: keyof T) => { const { [key]: _, ...rest } = obj; return rest; };

test("one job.md schema: the identity fields per route, no field the body carries", () => {
  assert.deepEqual(validate("job", freelance), []);
  assert.deepEqual(validate("job", employment), []);
  assert.deepEqual(validate("job", without(freelance, "location")), [], "location is optional");
  for (const k of ["title", "route", "timezone"] as const) assert.ok(validate("job", without(freelance, k)).some((e) => e.includes(k)), `${k} is required`);
  for (const k of ["company", "employment"] as const) assert.ok(validate("job", without(employment, k)).some((e) => e.includes(k)), `${k} is required on employment`);
  assert.ok(validate("job", { ...employment, company: null }).length, "company is never null");
  assert.ok(validate("job", { ...freelance, company: "Acme" }).length, "no company on the freelance route");
  assert.ok(validate("job", { ...employment, employment: "freelance" }).length, "employment enum is closed");
  for (const [k, v] of Object.entries({ slug: "x", date: "2026-10-14", budget: { type: "hourly", min: 1, max: 2 }, remote: "remote", salary: { type: "annual", min: 1, currency: "EUR" }, source: "linkedin", extras: {} })) {
    assert.ok(validate("job", { ...employment, [k]: v }).length, `${k} is not a field; the folder name or the body carries it`);
  }
});

test("the Checkpoint fields: verdict go or no-go, requirements in Keyword spelling, flags on freelance only", () => {
  assert.deepEqual(validate("job", { ...freelance, verdict: "go", requirements: ["React"], flags: ["regulated-domain", "paid-first-milestone"] }), []);
  assert.deepEqual(validate("job", { ...employment, verdict: "no-go", requirements: ["Vue 3", "Nuxt 4"] }), []);
  assert.ok(validate("job", { ...freelance, verdict: "ask" }).length, "ask is a recommendation, never a Verdict");
  assert.ok(validate("job", { ...freelance, verdict: null }).length, "no pending Verdict: the field is absent until the Checkpoint");
  assert.ok(validate("job", { ...freelance, requirements: ["React"] }).length, "requirements are written with the Verdict");
  assert.ok(validate("job", { ...employment, verdict: "go", flags: ["role-sprawl"] }).length, "no flags on the employment route");
  assert.ok(validate("job", { ...employment, verdict: "go", requirements: [""] }).length, "no empty requirement");
  assert.ok(validate("job", { ...freelance, decision: "go" }).length, "decision is gone");
});

test("outcome is sent, interview or offer, only on verdict go", () => {
  for (const job of [freelance, employment]) {
    assert.deepEqual(validate("job", { ...job, verdict: "go", outcome: "sent" }), []);
    assert.deepEqual(validate("job", { ...job, verdict: "go", outcome: "offer" }), []);
    assert.ok(validate("job", { ...job, verdict: "go", outcome: "hired" }).length, "a win is a Project file, not an outcome");
    assert.ok(validate("job", { ...job, verdict: "go", outcome: "replied" }).length, "no reply field: a missing next step is the negative outcome");
    assert.ok(validate("job", { ...job, verdict: "go", outcome: null }).length, "absent, never null");
    assert.ok(validate("job", { ...job, verdict: "no-go", outcome: "sent" }).length, "no outcome on no-go");
    assert.ok(validate("job", { ...job, outcome: "sent" }).length, "no outcome without a Verdict");
  }
});

test("letter.md is body only; the write hook finds every artifact by path", () => {
  assert.deepEqual(validateArtifact("letter", { frontmatter: null, body: "Hi,\n" }), []);
  assert.deepEqual(validateArtifact("letter", { frontmatter: null, body: "" }), [], "an empty Letter is a resume-only application");
  assert.deepEqual(validateArtifact("letter", { frontmatter: { slug: "x" }, body: "Hi,\n" }), ["letter.md carries frontmatter; a Letter is body only"]);
  assert.deepEqual(validateArtifact("job", { frontmatter: null, body: "" }), ["no YAML frontmatter"]);
  const folder = path.join(CANDIDATES_DIR, "2026-10-14-heymondo-senior-frontend");
  assert.equal(schemaForPath(path.join(folder, "job.md")), "job");
  assert.equal(schemaForPath(path.join(folder, "letter.md")), "letter");
  assert.equal(schemaForPath(path.join(folder, "cover-letter.md")), null, "no such file any more");
  assert.equal(schemaForPath(path.join(folder, "version.md")), null, "a Version is generated prose, checked by render.ts");
  assert.equal(schemaForPath(path.join(VERSIONS_DIR, "general.md")), null);
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "profile.md")), "profile");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "projects", "acme.md")), "project");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "skills.md")), null, "generated files have no schema");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "answers", "why.md")), null);
  assert.equal(templateFor("freelance"), "letter-freelance");
  assert.equal(templateFor("employment"), "letter-employment");
});

test("intake infers the route from the paste and marks it; a stated route is taken as given", () => {
  assert.deepEqual(inferRoute("USA, $25-100, <30h/week, 1-3 months\nNeed a full-stack dev for a clinic booking MVP."), { route: "freelance", inferred: true });
  assert.deepEqual(inferRoute("UK, $600\nFix our checkout."), { route: "freelance", inferred: true });
  assert.deepEqual(inferRoute("About the Role\nSenior Frontend Developer. Schedule: Full-time. 100% Remote. Requirements: Vue 3."), { route: "employment", inferred: true });
  assert.deepEqual(inferRoute("Remote-first: fully remote collaboration under a B2B model. What we offer: health insurance, 19 paid vacation days."), { route: "employment", inferred: true });
  assert.deepEqual(inferRoute("route: employment\nUSA, $50\nSome text"), { route: "employment", inferred: false });
  assert.deepEqual(inferRoute("route: freelance\nAbout the role, full-time"), { route: "freelance", inferred: false });
  assert.equal(inferRoute("Need a React developer."), null, "nothing to infer from: intake asks");
});

test("verdict arithmetic from arguments: the budget maximum feeds rate-below-floor on freelance only, no Family rule", () => {
  assert.deepEqual(compute({ route: "freelance", flags: [], skill_fit: 4, budget_max: 20, rate_floor: 40 }).hard_stops, ["rate-below-floor"]);
  assert.deepEqual(compute({ route: "freelance", flags: [], skill_fit: 4, budget_max: 20 }).hard_stops, [], "no floor given, no money stop");
  assert.equal(compute({ route: "freelance", flags: [], skill_fit: 4 }).verdict, "go", "no Family to ask for");
  const emp = compute({ route: "employment", flags: [], skill_fit: 4, budget_max: 20, rate_floor: 40 });
  assert.deepEqual(emp.hard_stops, []);
  assert.equal(emp.verdict, "go");
  assert.equal(compute({ route: "employment", flags: ["unmet-constraint"], skill_fit: 4 }).verdict, "no-go", "the stop Flag stops on both routes");
  assert.deepEqual(compute({ route: "freelance", flags: ["unmet-constraint"], skill_fit: 4 }), { alert_level: 1, hard_stops: ["unmet-constraint"], verdict: "no-go" });
  assert.equal(compute({ route: "freelance", flags: [], skill_fit: 2 }).verdict, "ask");
  assert.equal(compute({ route: "freelance", flags: ["refused-stack"], skill_fit: 4 }).verdict, "go", "refused-stack is gone: an unknown id counts for nothing");
});

test("the verdict CLI takes its inputs as arguments and reads no Candidate file", () => {
  const { root } = fixture();
  const r = run(root, "verdict.ts", "--route", "freelance", "--skill-fit", "4", "--flags", "regulated-domain,paid-first-milestone", "--budget-max", "20");
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { alert_level: 1, hard_stops: ["rate-below-floor"], verdict: "no-go" }, "rate_floor 40 from the fixture Profile");
  const ok = run(root, "verdict.ts", "--route", "employment", "--skill-fit", "3", "--flags", "role-sprawl,codebase-handover,unpaid-assignment");
  assert.deepEqual(JSON.parse(ok.stdout), { alert_level: 4, hard_stops: [], verdict: "ask" });
  assert.equal(run(root, "verdict.ts", "--route", "freelance").status, 2, "skill-fit is required");
  assert.equal(run(root, "verdict.ts", "2026-10-16-acme-fix").status, 2, "no Candidate argument any more");
});

test("Flags by route: each route reads only its own Flags; vague-posting and the stop Flag are on both; no employment Safeguard Slot", () => {
  const all = loadCatalogue("flags").flags as { id: string; routes?: string[]; kind?: string; slot?: string }[];
  assert.equal(new Set(all.map((f) => f.id)).size, all.length, "Flag ids are unique across routes");
  for (const f of all) assert.ok(f.routes?.length && f.routes.every((r) => ["freelance", "employment"].includes(r)), `${f.id} names its routes`);
  assert.ok(!all.some((f) => f.id === "refused-stack"), "refused-stack is gone");
  const ids = (route?: string) => new Set(flagsFor(route).map((f) => f.id));
  const free = ids("freelance"), emp = ids("employment");
  for (const id of ["unmet-constraint", "vague-posting"]) assert.ok(free.has(id) && emp.has(id), `${id} on both routes`);
  assert.ok(free.has("hostile-tone") && !emp.has("hostile-tone"));
  assert.ok(emp.has("codebase-handover") && emp.has("culture-hype") && !free.has("codebase-handover"));
  assert.deepEqual(ids(undefined), free, "a missing route reads as freelance");
  for (const f of all.filter((f) => f.routes!.includes("employment") && !f.routes!.includes("freelance") && (!f.kind || f.kind === "risk"))) assert.equal(f.slot, "none", `${f.id} has no Safeguard Slot`);
  const stop = all.filter((f) => f.kind === "stop");
  assert.deepEqual(stop.map((f) => f.id), ["unmet-constraint"]);
  assert.ok((stop[0] as any).cues.some((c: string) => /degree/.test(c)), "T5: a required degree is unmet-constraint evidence");
  const cat = loadCatalogue("flags") as any;
  assert.ok(!("interest_fit" in cat.scores), "interest_fit is gone");
  assert.ok(!JSON.stringify(cat).match(/\bFamily\b|\bdecision\b/), "no Family, no decision in the catalogue");
});

test("verdict arithmetic counts only the Flags of the Candidate's route", () => {
  // hostile-tone is freelance only: on employment it adds no level and no compound step
  assert.equal(compute({ route: "employment", flags: ["hostile-tone"], skill_fit: 4 }).alert_level, 1);
  assert.equal(compute({ route: "freelance", flags: ["hostile-tone"], skill_fit: 4 }).alert_level, 4);
  // codebase-handover is employment only
  assert.equal(compute({ route: "employment", flags: ["codebase-handover"], skill_fit: 4 }).alert_level, 2);
  assert.equal(compute({ route: "freelance", flags: ["codebase-handover"], skill_fit: 4 }).alert_level, 1);
  // employment green Flag lowers, level 5 Flag stops
  assert.equal(compute({ route: "employment", flags: ["unpaid-assignment", "practices-stated"], skill_fit: 4 }).alert_level, 2);
  assert.deepEqual(compute({ route: "employment", flags: ["recruitment-scam"], skill_fit: 4 }).hard_stops, ["alert-level-5", "level-5-flag"]);
});

test("the Profile may state a salary_floor; summaries left profile.md for the Version", () => {
  const profile = {
    identity: { name: "A", timezone: "Europe/Berlin", constraints: [] }, contact: { location: "Berlin", email: "a@b.de" }, resume_order: ["x"],
    terms: { rate: 50, rate_floor: 40 },
  };
  assert.deepEqual(validate("profile", profile), [], "salary_floor is optional");
  assert.deepEqual(validate("profile", { ...profile, terms: { ...profile.terms, salary_floor: { type: "annual", amount: 60000, currency: "EUR" } } }), []);
  assert.ok(validate("profile", { ...profile, terms: { ...profile.terms, salary_floor: 60000 } }).length, "salary_floor names period and currency");
  assert.ok(validate("profile", { ...profile, summaries: { general: "x" } }).length, "summaries left profile.md for the Version");
});
