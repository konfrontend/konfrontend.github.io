// Fixtures for the route split: the schema a job.md validates against is picked by its route,
// intake's route inference reads the paste, and the Verdict arithmetic skips the money hard stop
// and the Family rule on the employment route. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { validate, jobSchemaFor, inferRoute, schemaForPath, flagsFor, loadCatalogue, CANDIDATES_DIR, PROFILE_ROOT, VERSIONS_DIR } from "./lib.ts";
import { compute } from "./verdict.ts";

const freelance = {
  slug: "clinic-booking-mvp", title: "Full-Stack Developer - Clinic Booking MVP", date: "2026-09-19", route: "freelance",
  timezone: "America/New_York", budget: { type: "hourly", min: 25, max: 100 }, extras: { country: "US" },
};
const employment = {
  slug: "heymondo-senior-frontend", title: "Senior Frontend Developer", date: "2026-10-14", route: "employment",
  company: "Heymondo", employment: "full-time", remote: "remote", location: "Barcelona", timezone: "Europe/Madrid",
  salary: { type: "annual", min: 50000, max: 60000, currency: "EUR" }, source: "linkedin", extras: { hours_per_day: 7.5 },
};
const block = (extra = {}) => ({ flags: [], skill_fit: 4, interest_fit: 3, value: 3, alert_level: 1, hard_stops: [], verdict: "go", decision: null, ...extra });
const without = <T extends object>(obj: T, key: keyof T) => { const { [key]: _, ...rest } = obj; return rest; };

test("the route picks the schema; a missing route fails on the freelance schema", () => {
  assert.equal(jobSchemaFor(freelance), "job-freelance");
  assert.equal(jobSchemaFor(employment), "job-employment");
  assert.equal(jobSchemaFor({}), "job-freelance");
  assert.deepEqual(validate("job", freelance), []);
  assert.deepEqual(validate("job", employment), []);
  assert.ok(validate("job", without(freelance, "route")).some((e) => e.includes("route")), "route is required");
  assert.ok(validate("job", { ...freelance, route: "employment" }).length, "a freelance record does not pass as employment");
  assert.ok(validate("job", { ...employment, route: "freelance" }).length, "an employment record does not pass as freelance");
});

test("employment schema: required terms, optional salary shape, no family, no rate-below-floor", () => {
  for (const k of ["company", "employment", "remote", "timezone"] as const) {
    assert.ok(validate("job", without(employment, k)).some((e) => e.includes(k)), `${k} is required`);
  }
  assert.deepEqual(validate("job", { ...employment, company: null }), [], "company may be null");
  const bare = (["salary", "location", "source", "extras"] as const).reduce((o, k) => without(o, k as never), employment as object);
  assert.deepEqual(validate("job", bare), [], "salary, location, source, extras are optional");
  assert.ok(validate("job", { ...employment, employment: "freelance" }).length, "employment enum is closed");
  assert.ok(validate("job", { ...employment, salary: { type: "annual", min: 1 } }).length, "salary needs a currency");
  assert.ok(validate("job", { ...employment, salary: { type: "annual", currency: "EUR" } }).length, "salary needs min or max");
  assert.deepEqual(validate("job", { ...employment, verdict: block() }), []);
  assert.ok(validate("job", { ...employment, verdict: block({ family: "build", family_runner_up: null }) }).length, "no family on the employment route");
  assert.ok(validate("job", { ...employment, verdict: block({ hard_stops: ["rate-below-floor"] }) }).length, "no rate-below-floor on the employment route");
  assert.ok(validate("job", { ...freelance, verdict: block() }).length, "the freelance block still requires family");
  assert.deepEqual(validate("job", { ...freelance, verdict: block({ family: "build", family_runner_up: null }) }), []);
});

test("cover-letter.md has its own schema and the write hook finds every artifact by path", () => {
  const cover = { slug: "heymondo-senior-frontend", date: "2026-10-14", version: "general" };
  assert.deepEqual(validate("cover-letter", cover), []);
  assert.deepEqual(validate("cover-letter", { ...cover, version: "tailored" }), []);
  assert.ok(validate("cover-letter", { slug: cover.slug, date: cover.date }).length, "version is required on the cover letter");
  assert.ok(validate("cover-letter", { ...cover, version: "frontend" }).length, "one stored Version: general or tailored");
  assert.ok(validate("job", { ...employment, version: "general" }).length, "version lives in cover-letter.md, not in job.md");
  assert.ok(validate("cover-letter", { ...cover, family: "build" }).length, "no family on a cover letter");
  const folder = path.join(CANDIDATES_DIR, "2026-10-14-heymondo-senior-frontend");
  assert.equal(schemaForPath(path.join(folder, "cover-letter.md")), "cover-letter");
  assert.equal(schemaForPath(path.join(folder, "job.md")), "job");
  assert.equal(schemaForPath(path.join(folder, "letter.md")), "letter");
  assert.equal(schemaForPath(path.join(folder, "version.md")), "version", "a tailored Version is a selection");
  assert.equal(schemaForPath(path.join(VERSIONS_DIR, "general.md")), "version");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "profile.md")), "profile");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "projects", "acme.md")), "project");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "skills.md")), null, "generated files have no schema");
  assert.equal(schemaForPath(path.join(PROFILE_ROOT, "answers", "why.md")), null);
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

test("verdict arithmetic: no rate-below-floor and no Family rule on the employment route", () => {
  const profile = { terms: { rate_floor: 40 } };
  const low = { ...freelance, budget: { type: "hourly", min: 10, max: 20 } };
  assert.deepEqual(compute({ flags: [], skill_fit: 4, family: "build" }, profile, low).hard_stops, ["rate-below-floor"]);
  assert.equal(compute({ flags: [], skill_fit: 4, family: null }, profile, freelance).verdict, "ask", "no Family on freelance asks");
  const emp = compute({ flags: [], skill_fit: 4 }, profile, { ...employment, budget: { type: "hourly", min: 10, max: 20 } });
  assert.deepEqual(emp.hard_stops, []);
  assert.equal(emp.verdict, "go");
  assert.equal(compute({ flags: ["refused-stack"], skill_fit: 4 }, profile, employment).verdict, "no-go", "stop Flags still stop on employment");
});

test("Flags by route: each route reads only its own Flags; the stop Flags are on both", () => {
  const all = loadCatalogue("flags").flags as { id: string; routes?: string[]; kind?: string; slot?: string }[];
  assert.equal(new Set(all.map((f) => f.id)).size, all.length, "Flag ids are unique across routes");
  for (const f of all) assert.ok(f.routes?.length && f.routes.every((r) => ["freelance", "employment"].includes(r)), `${f.id} names its routes`);
  const ids = (route?: string) => new Set(flagsFor(route).map((f) => f.id));
  const free = ids("freelance"), emp = ids("employment");
  for (const id of ["refused-stack", "unmet-constraint"]) assert.ok(free.has(id) && emp.has(id), `${id} on both routes`);
  assert.ok(free.has("hostile-tone") && !emp.has("hostile-tone"));
  assert.ok(emp.has("codebase-handover") && !free.has("codebase-handover"));
  assert.deepEqual(ids(undefined), free, "a missing route reads as freelance");
  const employmentSlots = ["intro", "relevant_work", "gaps", "terms", "closing", "none"];
  for (const f of flagsFor("employment").filter((f) => !f.kind || f.kind === "risk")) assert.ok(employmentSlots.includes(f.slot!), `${f.id} targets a letter-employment Slot`);
});

test("verdict arithmetic counts only the Flags of the Candidate's route", () => {
  const profile = { terms: { rate_floor: 40 } };
  // hostile-tone is freelance only: on employment it adds no level and no compound step
  assert.equal(compute({ flags: ["hostile-tone"], skill_fit: 4 }, profile, employment).alert_level, 1);
  assert.equal(compute({ flags: ["hostile-tone"], skill_fit: 4, family: "build" }, profile, freelance).alert_level, 4);
  // codebase-handover is employment only
  assert.equal(compute({ flags: ["codebase-handover"], skill_fit: 4 }, profile, employment).alert_level, 2);
  assert.equal(compute({ flags: ["codebase-handover"], skill_fit: 4, family: "build" }, profile, freelance).alert_level, 1);
  // employment green Flag lowers, level 5 Flag stops
  assert.equal(compute({ flags: ["unpaid-assignment", "practices-stated"], skill_fit: 4 }, profile, employment).alert_level, 2);
  assert.deepEqual(compute({ flags: ["recruitment-scam"], skill_fit: 4 }, profile, employment).hard_stops, ["alert-level-5", "level-5-flag"]);
});

test("job.md carries requirements on both routes; the Profile may state a salary_floor", () => {
  assert.deepEqual(validate("job", { ...employment, requirements: ["Vue 3", "Nuxt 4"] }), []);
  assert.deepEqual(validate("job", { ...freelance, requirements: ["React"] }), []);
  assert.ok(validate("job", { ...employment, requirements: [""] }).length, "no empty requirement");
  assert.ok(validate("job", { ...employment, recorded_skills: ["Vue"] }).length, "the ledger marker is gone: the ledger derives from requirements");
  const profile = {
    identity: { name: "A", timezone: "Europe/Berlin", constraints: [] }, contact: { location: "Berlin", email: "a@b.de" }, resume_order: ["x"],
    terms: { rate: 50, rate_floor: 40 },
  };
  assert.deepEqual(validate("profile", profile), [], "salary_floor is optional");
  assert.deepEqual(validate("profile", { ...profile, terms: { ...profile.terms, salary_floor: { type: "annual", amount: 60000, currency: "EUR" } } }), []);
  assert.ok(validate("profile", { ...profile, terms: { ...profile.terms, salary_floor: 60000 } }).length, "salary_floor names period and currency");
  assert.ok(validate("profile", { ...profile, summaries: { general: "x" } }).length, "summaries left profile.md for the Version");
});
