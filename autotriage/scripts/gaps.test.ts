import test from "node:test";
import assert from "node:assert/strict";
import { ledger, renderLedger } from "./gaps.ts";
import type { Profile, Project } from "./lib.ts";

const project = (slug: string, keywords: string[]): Project => ({ slug, file: `${slug}.md`, errors: [], warnings: [], stories: [], bullets: [], notes: [], meta: { name: slug, role: "R", employment: "contract", start: "2020-01", naming: "public", description: "D", keywords } });
const profile = { projects: [project("engine", ["Punched cards", "Bernoulli numbers"]), project("notes", ["punched cards", "Writing"])] } as unknown as Profile;

test("ledger counts Candidates once per Skill and adds Gaps for unproved requirements, Gaps first", () => {
  const rows = ledger(profile, [
    { candidate: "c1", requirements: ["Writing", "writing", "Steam"] },
    { candidate: "c2", requirements: ["steam", "Punched cards"] },
  ]);
  assert.deepEqual(rows.map((r) => [r.name, r.level, r.seen]), [["Steam", "gap", 2], ["Punched cards", "shipped", 1], ["Writing", "shipped", 1], ["Bernoulli numbers", "shipped", 0]]);
  const out = renderLedger(rows);
  assert.match(out, /\| Steam \| 2 \|/);
  assert.match(out, /\| Writing \| 1 \|/);
  assert.ok(out.indexOf("Gaps (1)") < out.indexOf("Skills seen (2)"), "Gaps first");
  assert.doesNotMatch(out, /Bernoulli/, "a Skill no Job asked for is not printed");
});
