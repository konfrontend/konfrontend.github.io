// Fixtures for the version State and the employment Guards: version.ts writes letter.md empty and
// never a Version, names resume-version on --tailor, and leaves an existing letter.md alone; the Guards
// refuse version off the employment route or before go, proposal without letter.md or with a Version
// that does not read; the Version sent is version.md when it exists, else the general one. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, run, employmentJob, freelanceJob, version, SUMMARY } from "./fixture.ts";

const CANDIDATE = "2026-10-17-acme-frontend";
const withJob = (job = employmentJob(), files: Record<string, string> = {}) => fixture({ candidates: { [CANDIDATE]: { "job.md": job, ...files } } });

test("version writes letter.md empty, names the general Version and the next command, and writes no Version", () => {
  const { root, candidate } = withJob();
  const r = run(root, "version.ts", CANDIDATE);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Wrote private\/candidates\/2026-10-17-acme-frontend\/letter\.md, empty: a resume-only application until proposal fills it\.\nVersion: general \(resume\/versions\/general\.md\)\nNext: \/route-proposal 2026-10-17-acme-frontend, or stop here/);
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "letter.md"), "utf8"), "");
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "job.md"), "utf8"), employmentJob(), "job.md is not written");
  assert.ok(!fs.existsSync(path.join(candidate(CANDIDATE), "version.md")));
});

test("version --tailor names resume-version and never copies the general Version", () => {
  const { root, candidate } = withJob();
  const dir = candidate(CANDIDATE);
  const r = run(root, "version.ts", CANDIDATE, "--tailor");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Version: tailored, not yet generated\. Invoke resume-version 2026-10-17-acme-frontend; it writes private\/candidates\/2026-10-17-acme-frontend\/version\.md/);
  assert.ok(!fs.existsSync(path.join(dir, "version.md")), "the skill writes the Version, the script never does");
  fs.writeFileSync(path.join(dir, "version.md"), version("Tailored summary."));
  const again = run(root, "version.ts", CANDIDATE, "--tailor");
  assert.match(again.stdout, /letter\.md exists; left as it is\.\nVersion: tailored \(private\/candidates\/2026-10-17-acme-frontend\/version\.md\)/);
});

test("a version re-run leaves an existing Letter alone", () => {
  const { root, candidate } = withJob(employmentJob(), { "letter.md": "Hello,\n\nThe Letter.\n" });
  const g = run(root, "guard.ts", "version", CANDIDATE);
  assert.match(g.stdout, /Note: letter\.md already holds a Letter; this run leaves it alone\./);
  assert.equal(run(root, "version.ts", CANDIDATE).status, 0);
  assert.equal(fs.readFileSync(path.join(candidate(CANDIDATE), "letter.md"), "utf8"), "Hello,\n\nThe Letter.\n");
});

test("the version Guard requires a valid job.md, route employment, and verdict go", () => {
  assert.match(run(withJob(employmentJob({ requirements: ["React"] })).root, "guard.ts", "version", CANDIDATE).stdout.trim(), /^Candidate: private\/candidates\/2026-10-17-acme-frontend\nTitle: Senior Frontend Developer\nRequirements: React$/);
  const f = run(withJob(freelanceJob({ verdict: "go" })).root, "guard.ts", "version", CANDIDATE);
  assert.match(f.stdout, /version refused\. .* freelance route; the version State runs on employment only/);
  assert.match(run(withJob(employmentJob({ verdict: "no-go" })).root, "guard.ts", "version", CANDIDATE).stdout, /the Verdict is no-go\. Route ended\./);
  assert.match(run(withJob(employmentJob({ verdict: "absent" })).root, "guard.ts", "version", CANDIDATE).stdout, /no Verdict yet\./);
  assert.ok(!/checkpoint pending/.test(run(withJob(employmentJob({ verdict: "absent" })).root, "guard.ts", "version", CANDIDATE).stdout));
  const invalid = run(withJob(employmentJob().replace("company: Acme\n", "")).root, "guard.ts", "version", CANDIDATE);
  assert.match(invalid.stdout, /job\.md is invalid:\n  \/ must have required property 'company'/);
});

test("the proposal Guard on employment needs letter.md and a Version that reads: version.md when it exists, else the general one", () => {
  const none = run(withJob().root, "guard.ts", "proposal", CANDIDATE);
  assert.match(none.stdout, /proposal refused\. .*letter\.md is missing\.\nRun \/route-version 2026-10-17-acme-frontend first\./);

  const general = run(withJob(employmentJob(), { "letter.md": "" }).root, "guard.ts", "proposal", CANDIDATE);
  assert.match(general.stdout, new RegExp(`^Version: general\\nIntro summary \\(the summary of resume/versions/general\\.md\\): ${SUMMARY.replace(/[.+]/g, "\\$&")}`), general.stdout);

  const tailored = withJob(employmentJob(), { "letter.md": "", "version.md": version("Tailored summary.") });
  const tOk = run(tailored.root, "guard.ts", "proposal", CANDIDATE);
  assert.match(tOk.stdout, /^Version: tailored\nIntro summary \(the summary of version\.md in the Candidate folder\): Tailored summary\./, tOk.stdout);
  fs.writeFileSync(path.join(tailored.candidate(CANDIDATE), "version.md"), version("Tailored summary.", ["Core: React"], { acme: ["[nope] Built nothing."] }));
  assert.match(run(tailored.root, "guard.ts", "proposal", CANDIDATE).stdout, /the Version sent does not read: version\.md: acme has no Bullet \[nope\]\nRun resume-version 2026-10-17-acme-frontend again\./);

  const broken = withJob(employmentJob(), { "letter.md": "" });
  fs.writeFileSync(path.join(broken.root, "resume", "versions", "general.md"), version(SUMMARY, ["Core: Vue"]));
  assert.match(run(broken.root, "guard.ts", "proposal", CANDIDATE).stdout, /does not read: general\.md: Skills term is not a Project keyword: Vue\nRun resume-version to regenerate/);
});

test("the verify Guard on employment requires a body-only letter.md, empty included; triage refuses once it exists", () => {
  const { root, candidate } = withJob();
  const dir = candidate(CANDIDATE);
  assert.match(run(root, "guard.ts", "verify", CANDIDATE).stdout, /letter\.md is missing/);
  fs.writeFileSync(path.join(dir, "letter.md"), "---\nversion: general\n---\n");
  assert.match(run(root, "guard.ts", "verify", CANDIDATE).stdout, /letter\.md is invalid/);
  fs.writeFileSync(path.join(dir, "letter.md"), "");
  const empty = run(root, "guard.ts", "verify", CANDIDATE);
  assert.match(empty.stdout, /Letter: letter\.md\nTemplate: letter-employment\nVersion: general/, `an empty body is a resume-only application: ${empty.stdout}`);
  assert.match(run(root, "guard.ts", "triage", CANDIDATE).stdout, /letter\.md already exists; the Route has passed triage/);
});
