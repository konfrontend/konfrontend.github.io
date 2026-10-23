// Fixtures for the version State and the employment Guards: version.ts records `version` in a
// frontmatter-only cover-letter.md, keeps its body on a re-run, and copies the general Version on
// --tailor; the Guards refuse version off the employment route or before go, proposal without
// cover-letter.md, with `version: tailored` and no version.md, or with a Version that does not read;
// an empty body is a valid cover-letter.md. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, run, employmentJob, freelanceJob, cover, version, SUMMARY } from "./fixture.ts";

const CANDIDATE = "2026-10-17-acme-frontend";
const withJob = (job = employmentJob(), files: Record<string, string> = {}) => fixture({ candidates: { [CANDIDATE]: { "job.md": job, ...files } } });

test("version creates cover-letter.md with frontmatter only, version general, and names the next command", () => {
  const { root, candidate } = withJob();
  const r = run(root, "version.ts", CANDIDATE);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^version: general\nNext: \/route-proposal 2026-10-17-acme-frontend, or stop here/);
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "cover-letter.md"), "utf8"), cover("general"), "slug and date from job.md, empty body");
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "job.md"), "utf8"), employmentJob(), "job.md is not written");
  assert.ok(!fs.existsSync(path.join(candidate(CANDIDATE), "version.md")));
});

test("version --tailor writes tailored, copies the general Version, and never overwrites version.md", () => {
  const { root, candidate } = withJob();
  const dir = candidate(CANDIDATE);
  const r = run(root, "version.ts", CANDIDATE, "--tailor");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^version: tailored\nCreated private\/candidates\/2026-10-17-acme-frontend\/version\.md from resume\/versions\/general\.md/);
  assert.equal(fs.readFileSync(path.join(dir, "cover-letter.md"), "utf8"), cover("tailored"));
  assert.equal(fs.readFileSync(path.join(dir, "version.md"), "utf8"), version());
  fs.writeFileSync(path.join(dir, "version.md"), version("Edited by hand."));
  const again = run(root, "version.ts", CANDIDATE, "--tailor");
  assert.match(again.stdout, /version\.md already exists; left as it is/);
  assert.match(fs.readFileSync(path.join(dir, "version.md"), "utf8"), /Edited by hand\./);
});

test("a version re-run rewrites version and leaves the Letter body alone", () => {
  const { root, candidate } = withJob(employmentJob(), { "cover-letter.md": cover("general", "Hello,\n\nThe Letter.\n") });
  const g = run(root, "guard.ts", "version", CANDIDATE);
  assert.match(g.stdout, /Note: version is already general; this run rewrites it and leaves the cover-letter\.md body alone\./);
  assert.equal(run(root, "version.ts", CANDIDATE, "--tailor").status, 0);
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "cover-letter.md"), "utf8"), cover("tailored", "Hello,\n\nThe Letter.\n"));
});

test("the version Guard requires a valid job.md, route employment, and decision go", () => {
  assert.match(run(withJob().root, "guard.ts", "version", CANDIDATE).stdout, /^Candidate: private\/candidates/);
  const f = run(withJob(freelanceJob({ decision: "go" })).root, "guard.ts", "version", CANDIDATE);
  assert.match(f.stdout, /version refused\. .* freelance route; the version State runs on employment only/);
  for (const [decision, reason] of [["null", /checkpoint pending: decision is not set/], ["no-go", /decision is no-go\. Route ended\./], ["absent", /decision is not go/]] as const) {
    assert.match(run(withJob(employmentJob({ decision })).root, "guard.ts", "version", CANDIDATE).stdout, reason, decision);
  }
  const invalid = run(withJob(employmentJob().replace("remote: remote\n", "")).root, "guard.ts", "version", CANDIDATE);
  assert.match(invalid.stdout, /job\.md is invalid against job-employment/);
});

test("the proposal Guard on employment needs cover-letter.md, version.md on tailored, and a Version that reads", () => {
  const none = run(withJob().root, "guard.ts", "proposal", CANDIDATE);
  assert.match(none.stdout, /proposal refused\. .*cover-letter\.md is missing\.\nRun \/route-version 2026-10-17-acme-frontend first\./);

  const nv = run(withJob(employmentJob(), { "cover-letter.md": cover(null) }).root, "guard.ts", "proposal", CANDIDATE);
  assert.match(nv.stdout, /cover-letter\.md is invalid:\n  .*version/);

  const tailored = withJob(employmentJob(), { "cover-letter.md": cover("tailored") });
  assert.match(run(tailored.root, "guard.ts", "proposal", CANDIDATE).stdout, /version is tailored but .*version\.md is missing/);
  fs.writeFileSync(path.join(tailored.candidate(CANDIDATE), "version.md"), version("Tailored summary."));
  const tOk = run(tailored.root, "guard.ts", "proposal", CANDIDATE);
  assert.match(tOk.stdout, /^Version: tailored\nIntro summary \(the summary of version\.md in the Candidate folder\): Tailored summary\./, tOk.stdout);
  fs.writeFileSync(path.join(tailored.candidate(CANDIDATE), "version.md"), version("Tailored summary.", ["Core: React"], { acme: ["nope"] }));
  assert.match(run(tailored.root, "guard.ts", "proposal", CANDIDATE).stdout, /the Version sent does not read: version\.md: acme has no Bullet \[nope\]\nFix private\/candidates\/2026-10-17-acme-frontend\/version\.md\./);

  const general = run(withJob(employmentJob(), { "cover-letter.md": cover("general") }).root, "guard.ts", "proposal", CANDIDATE);
  assert.match(general.stdout, new RegExp(`^Version: general\\nIntro summary \\(the summary of resume/versions/general\\.md\\): ${SUMMARY.replace(/[.+]/g, "\\$&")}`), general.stdout);
  const broken = withJob(employmentJob(), { "cover-letter.md": cover("general") });
  fs.writeFileSync(path.join(broken.root, "resume", "versions", "general.md"), version(SUMMARY, ["Core: Vue"]));
  assert.match(run(broken.root, "guard.ts", "proposal", CANDIDATE).stdout, /does not read: general\.md: Skills term is not a Project keyword: Vue\nFix resume\/versions\/general\.md\./);
});

test("the verify Guard on employment requires a valid cover-letter.md, empty body included; triage refuses once it exists", () => {
  const { root, candidate } = withJob();
  const dir = candidate(CANDIDATE);
  assert.match(run(root, "guard.ts", "verify", CANDIDATE).stdout, /cover-letter\.md is missing/);
  fs.writeFileSync(path.join(dir, "cover-letter.md"), cover(null, "Hi,\n"));
  assert.match(run(root, "guard.ts", "verify", CANDIDATE).stdout, /cover-letter\.md is invalid/);
  fs.writeFileSync(path.join(dir, "cover-letter.md"), cover("general"));
  const empty = run(root, "guard.ts", "verify", CANDIDATE);
  assert.match(empty.stdout, /Letter: cover-letter\.md\nTemplate: letter-employment\nVersion: general/, `an empty body is a CV-only application: ${empty.stdout}`);
  assert.match(run(root, "guard.ts", "triage", CANDIDATE).stdout, /cover-letter\.md already exists; the Route has passed triage/);
});
