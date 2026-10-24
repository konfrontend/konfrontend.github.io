// Fixtures for the Candidate contract: the job.md read with its schema errors, the Letter rule, the paths a
// write hook knows, and the two writes, intake's job.md and the Checkpoint's fields, each refusing before it
// writes. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readJob, letterErrors, candidateSchemaForPath, candidatesDir, candidateFiles, generalVersion } from "./candidate.ts";
import { schemaForPath } from "./lib.ts";
import { fixture, run, pipe, employmentJob, freelanceJob } from "./fixture.ts";
import { repoRoot } from "../../profile/lib/index.ts";

const CANDIDATE = "2026-10-17-acme-frontend";
const PASTE = "UK, $600\nFix our checkout.\n\nScreening: why you?\n";

test("readJob returns the frontmatter, the body and the schema errors, and null when job.md is missing", () => {
  const { candidate } = fixture({ candidates: { [CANDIDATE]: { "job.md": employmentJob() }, "2026-10-18-bad": { "job.md": employmentJob().replace("company: Acme\n", "") }, "2026-10-19-none": { "letter.md": "" } } });
  const job = readJob(candidate(CANDIDATE))!;
  assert.deepEqual(job.errors, []);
  assert.equal(job.frontmatter?.company, "Acme");
  assert.equal(job.body, "Posting text.\n");
  assert.equal(readJob(candidate("2026-10-18-bad"))!.errors[0], "/ must have required property 'company'");
  assert.equal(readJob(candidate("2026-10-19-none")), null);
});

test("the Letter rule: body only, empty included", () => {
  assert.deepEqual(letterErrors({ frontmatter: null }), []);
  assert.deepEqual(letterErrors({ frontmatter: { slug: "x" } }), ["letter.md carries frontmatter; a Letter is body only"]);
});

test("the write hook finds every artifact by path, under the root", () => {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  const { root } = fixture();
  process.env.CLAUDE_PROJECT_DIR = root;
  try {
    assert.equal(repoRoot(), root);
    const folder = path.join(candidatesDir(), "2026-10-14-heymondo-senior-frontend");
    assert.equal(folder, path.join(root, "private", "candidates", "2026-10-14-heymondo-senior-frontend"));
    const files = candidateFiles(folder);
    assert.equal(candidateSchemaForPath(files.job), "job");
    assert.equal(candidateSchemaForPath(files.letter), "letter");
    assert.equal(candidateSchemaForPath(path.join(folder, "cover-letter.md")), null, "no such file any more");
    assert.equal(candidateSchemaForPath(files.version), null, "a Version is generated prose, checked by render.ts");
    assert.equal(candidateSchemaForPath(generalVersion()), null);
    assert.equal(schemaForPath(files.job), null, "the Profile half knows no Candidate file");
    assert.equal(schemaForPath(path.join(root, "profile", "profile.md")), "profile");
    assert.equal(schemaForPath(path.join(root, "profile", "projects", "acme.md")), "project");
    assert.equal(schemaForPath(path.join(root, "profile", "skills.md")), null, "generated files have no schema");
    assert.equal(schemaForPath(path.join(root, "profile", "answers", "why.md")), null);
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev;
  }
});

const intake = (root: string, ...args: string[]) => run(root, "intake.ts", "write", ...args);

test("intake writes job.md through the contract: the identity fields, then the paste verbatim", () => {
  const { root, candidate } = fixture();
  const r = run(root, "intake.ts", "write", "2026-10-20-fix-checkout", "--title", "Fix our checkout", "--route", "freelance", "--timezone", "Europe/London", "--location", "UK");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "Wrote private/candidates/2026-10-20-fix-checkout/job.md");
  const file = candidateFiles(candidate("2026-10-20-fix-checkout")).job;
  assert.equal(fs.readFileSync(file, "utf8"), "---\ntitle: Fix our checkout\nroute: freelance\ntimezone: Europe/London\nlocation: UK\n---\n");
  const piped = fixture();
  const p = pipe(piped.root, PASTE, "intake.ts", "write", "2026-10-20-fix-checkout", "--title", "Fix our checkout", "--route", "freelance", "--timezone", "Europe/London");
  assert.equal(p.status, 0, p.stderr);
  const job = readJob(piped.candidate("2026-10-20-fix-checkout"))!;
  assert.deepEqual(job.errors, []);
  assert.equal(job.body, PASTE, "the body is the paste verbatim");
});

test("intake refuses an invalid job.md, a bad folder name and an existing Candidate, and writes nothing", () => {
  const { root, candidate } = fixture({ candidates: { [CANDIDATE]: { "job.md": employmentJob() } } });
  const bad = intake(root, "2026-10-20-acme", "--title", "Frontend", "--route", "employment", "--timezone", "Europe/Madrid", "--employment", "full-time");
  assert.equal(bad.status, 0);
  assert.match(bad.stdout, /^autotriage: intake refused\. job\.md would be invalid:\n  \/ must have required property 'company'/);
  assert.ok(!fs.existsSync(candidate("2026-10-20-acme")), "nothing is written");
  assert.match(intake(root, "Acme", "--title", "x", "--route", "freelance", "--timezone", "UTC").stdout, /intake refused\. needs a Candidate folder name YYYY-MM-DD-<slug> \(got "Acme"\)/);
  const again = intake(root, CANDIDATE, "--title", "x", "--route", "freelance", "--timezone", "UTC");
  assert.match(again.stdout, /intake refused\. private\/candidates\/2026-10-17-acme-frontend already exists; an existing Candidate is never overwritten\./);
  assert.equal(fs.readFileSync(candidateFiles(candidate(CANDIDATE)).job, "utf8"), employmentJob());
});

const write = (root: string, ...args: string[]) => run(root, "verdict.ts", "write", ...args);

test("verdict.ts write sets the Checkpoint fields, replacing earlier ones, and keeps the body", () => {
  const { root, candidate } = fixture({ candidates: { "2026-10-16-acme-fix": { "job.md": freelanceJob() }, [CANDIDATE]: { "job.md": employmentJob({ requirements: ["Vue"] }) } } });
  const f = write(root, "2026-10-16-acme-fix", "--verdict", "go", "--requirements", "React, Stripe Connect", "--flags", "regulated-domain,paid-first-milestone");
  assert.equal(f.status, 0, f.stderr);
  assert.equal(f.stdout.trim(), "Wrote the Checkpoint into private/candidates/2026-10-16-acme-fix/job.md: verdict go");
  const job = readJob(candidate("2026-10-16-acme-fix"))!;
  assert.deepEqual(job.errors, []);
  assert.deepEqual({ verdict: job.frontmatter!.verdict, requirements: job.frontmatter!.requirements, flags: job.frontmatter!.flags }, { verdict: "go", requirements: ["React", "Stripe Connect"], flags: ["regulated-domain", "paid-first-milestone"] });
  assert.equal(job.body, "Posting text.\n");
  const e = write(root, CANDIDATE, "--verdict", "no-go", "--requirements", "");
  assert.equal(e.status, 0, e.stderr);
  const emp = readJob(candidate(CANDIDATE))!;
  assert.deepEqual([emp.frontmatter!.verdict, emp.frontmatter!.requirements, "flags" in emp.frontmatter!], ["no-go", [], false], "employment stores no flags");
});

test("verdict.ts write refuses invalid input and leaves job.md as it was", () => {
  const { root, candidate } = fixture({ candidates: { [CANDIDATE]: { "job.md": employmentJob({ verdict: "absent" }) }, "2026-10-16-acme-fix": { "job.md": freelanceJob() } } });
  const before = fs.readFileSync(candidateFiles(candidate(CANDIDATE)).job, "utf8");
  const ask = write(root, CANDIDATE, "--verdict", "ask", "--requirements", "React");
  assert.equal(ask.status, 0);
  assert.match(ask.stdout, /^autotriage: triage refused\. job\.md would be invalid:\n  \/verdict must be equal to one of the allowed values/);
  const flags = write(root, CANDIDATE, "--verdict", "go", "--requirements", "React", "--flags", "role-sprawl");
  assert.match(flags.stdout, /triage refused\. job\.md would be invalid:\n {2}\/ must NOT be valid/, "no flags on the employment route");
  assert.equal(fs.readFileSync(candidateFiles(candidate(CANDIDATE)).job, "utf8"), before);
  assert.match(write(root, "2026-10-16-nope", "--verdict", "go", "--requirements", "").stdout, /triage refused\. private\/candidates\/2026-10-16-nope\/job\.md is missing\./);
  assert.equal(write(root, CANDIDATE, "--requirements", "React").status, 2, "--verdict is required");
  const fix = candidateFiles(candidate("2026-10-16-acme-fix")).job, fixBefore = fs.readFileSync(fix, "utf8");
  assert.match(write(root, "2026-10-16-acme-fix", "--verdict", "go", "--requirements", "React").stdout, /triage refused\. a freelance Checkpoint names its flags\./);
  assert.equal(fs.readFileSync(fix, "utf8"), fixBefore);
  assert.equal(write(root, "2026-10-16-acme-fix", "--verdict", "go", "--requirements", "React", "--flags", "").status, 0);
  assert.deepEqual(readJob(candidate("2026-10-16-acme-fix"))!.frontmatter!.flags, [], "no Flag triggered");
});
