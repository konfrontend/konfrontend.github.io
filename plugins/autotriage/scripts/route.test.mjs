// Fixtures for the route split: the schema a job.md validates against is picked by its route,
// intake's route inference reads the paste, and the Verdict arithmetic skips the money hard stop
// and the Family rule on the employment route. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { validate, jobSchemaFor, inferRoute, schemaForPath, CANDIDATES_DIR } from "./lib.mjs";
import { compute } from "./verdict.mjs";

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
const without = (obj, key) => { const { [key]: _, ...rest } = obj; return rest; };

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
  for (const k of ["company", "employment", "remote", "timezone"]) {
    assert.ok(validate("job", without(employment, k)).some((e) => e.includes(k)), `${k} is required`);
  }
  assert.deepEqual(validate("job", { ...employment, company: null }), [], "company may be null");
  const bare = ["salary", "location", "source", "extras"].reduce(without, employment);
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

test("cover-letter.md has its own schema and the write hook finds it", () => {
  const cover = { slug: "heymondo-senior-frontend", date: "2026-10-14", outcome: null };
  assert.deepEqual(validate("cover-letter", cover), []);
  assert.ok(validate("cover-letter", { ...cover, version: "general" }).length, "version lives in job.md, not on the cover letter");
  assert.deepEqual(validate("job", { ...employment, version: "tailored" }), []);
  assert.ok(validate("job", { ...employment, version: "audit" }).length, "version enum is closed");
  assert.ok(validate("job", { ...freelance, version: "general" }).length, "no version on the freelance route");
  assert.ok(validate("cover-letter", { ...cover, family: "build" }).length, "no family on a cover letter");
  const folder = path.join(CANDIDATES_DIR, "2026-10-14-heymondo-senior-frontend");
  assert.equal(schemaForPath(path.join(folder, "cover-letter.md")), "cover-letter");
  assert.equal(schemaForPath(path.join(folder, "job.md")), "job");
  assert.equal(schemaForPath(path.join(folder, "version.md")), null, "version.md has no schema");
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
