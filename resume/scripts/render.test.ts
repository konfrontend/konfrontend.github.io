// The input-to-target resolution of render.ts, without Chrome. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { fixture, employmentJob, version } from "../../autotriage/scripts/fixture.ts";
import { resolveRender } from "./render.ts";

const OCT = new Date(2026, 9, 25);

test("a Candidate with a tailored Version renders it into the folder under the sent name", () => {
  const { root } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob(), "version.md": version() } } });
  assert.deepEqual(resolveRender("private/candidates/2026-10-17-acme-frontend", root, OCT), {
    version: "private/candidates/2026-10-17-acme-frontend/version.md",
    target: "private/candidates/2026-10-17-acme-frontend/Dolbilov_SeniorFrontendDeveloper_Acme_Oct2026.pdf",
  });
});

test("a Candidate without a tailored Version renders the general Version into the folder", () => {
  const { root } = fixture({ candidates: { "2026-10-17-acme-frontend": { "job.md": employmentJob({ title: "Front-end engineer (React/Vue)" }) } } });
  assert.deepEqual(resolveRender("private/candidates/2026-10-17-acme-frontend/", root, OCT), {
    version: "resume/versions/general.md",
    target: "private/candidates/2026-10-17-acme-frontend/Dolbilov_FrontEndEngineerReactVue_Acme_Oct2026.pdf",
  });
});

test("no input renders the general Version to the root PDF", () => {
  const { root } = fixture();
  assert.deepEqual(resolveRender(undefined, root, OCT), { version: "resume/versions/general.md", target: "Konstantin_Dolbilov_Resume.pdf" });
  assert.deepEqual(resolveRender("resume/versions/general.md", root, OCT), { version: "resume/versions/general.md", target: "Konstantin_Dolbilov_Resume.pdf" });
});

test("any other Version path renders beside itself", () => {
  const { root } = fixture();
  assert.deepEqual(resolveRender("resume/versions/frontend.md", root, OCT), { version: "resume/versions/frontend.md", target: "resume/versions/frontend.pdf" });
});

test("a folder without job.md, or a Candidate without a company, is refused", () => {
  const { root } = fixture({ candidates: { "2026-10-17-fix": { "job.md": "---\ntitle: Fix it\nroute: freelance\ntimezone: UTC\n---\n" } } });
  assert.throws(() => resolveRender("private/candidates/2026-10-17-fix", root, OCT), /no company/);
  assert.throws(() => resolveRender("resume/versions", root, OCT), /no Candidate folder/);
});
