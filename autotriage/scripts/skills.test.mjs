// Fixtures for the Skill ledger script: Target grouping in the print, Evidence derived from the
// Projects' keywords, and the matching and recording rules triage applies. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { isTarget, group, renderTable, match, record, shippedWithoutEvidence } from "./skills.mjs";
import { deriveEvidence, parseStories } from "./lib.mjs";

const row = (name, level, extra = {}) => ({ name, category: "frontend", level, keywords: [], roles: [], seen: 0, ...extra });
const ledger = () => ({
  target_after: 3,
  categories: { frontend: "Frontend", backend: "Backend", database: "Data", other: "Other" },
  skills: [
    row("React", "shipped", { keywords: ["react.js"], roles: ["frontend"] }),
    row("Next.js", "used"),
    row("Postgres", "shipped", { keywords: ["sql", "postgresql"], category: "database" }),
    row("Stripe Connect", "gap", { seen: 3, category: "backend" }),
    row("Escrow", "gap", { seen: 1, category: "other" }),
    row("RBAC", "gap", { seen: 2, category: "backend" }),
    row("Rust", "learning"),
  ],
});
const project = (slug, keywords, errors = []) => ({ slug, frontmatter: { keywords }, errors });

test("a Target is a Gap seen target_after times or more", () => {
  const l = ledger();
  assert.ok(isTarget(l.skills[3], l.target_after));
  assert.ok(!isTarget(l.skills[4], l.target_after), "seen once");
  assert.ok(!isTarget(l.skills[5], l.target_after), "seen twice");
  assert.ok(!isTarget(row("x", "shipped", { seen: 3 }), 3), "not a Gap");
});

test("print groups Targets, then Gaps, then the rest, each by seen count descending, with Evidence", () => {
  const g = group(ledger());
  assert.deepEqual(g.targets.map((r) => r.name), ["Stripe Connect"]);
  assert.deepEqual(g.gaps.map((r) => r.name), ["RBAC", "Escrow"]);
  assert.deepEqual(g.rest.map((r) => r.name), ["React", "Next.js", "Postgres", "Rust"]);
  const { evidence } = deriveEvidence(ledger(), [project("acme", ["React", "postgres"]), project("shop", ["React"])]);
  const out = renderTable(ledger(), { evidence });
  assert.match(out, /^\| name \| level \| category \| evidence \| seen \|$/m);
  assert.ok(out.indexOf("Targets") < out.indexOf("Stripe Connect"));
  assert.ok(out.indexOf("Stripe Connect") < out.indexOf("RBAC"));
  assert.ok(out.indexOf("RBAC") < out.indexOf("Escrow"));
  assert.ok(out.indexOf("Escrow") < out.indexOf("React"));
  assert.match(out, /\| RBAC \| gap \| backend \|  \| 2 \|$/m);
  assert.match(out, /\| React \| shipped \| frontend \| acme, shop \| 0 \|$/m);
  const gapsOnly = renderTable(ledger(), { gapsOnly: true });
  assert.ok(gapsOnly.includes("Escrow") && !gapsOnly.includes("React"));
});

test("Evidence derives from the valid Projects' keywords by ledger name, case-insensitive; unknown terms are listed", () => {
  const { evidence, unknown } = deriveEvidence(ledger(), [
    project("acme", ["React", "postgres", "Supabase"]),
    project("old", ["React"], ["no YAML frontmatter"]),
  ]);
  assert.deepEqual(evidence.get("React"), ["acme"], "an invalid Project proves nothing");
  assert.deepEqual(evidence.get("Postgres"), ["acme"]);
  assert.deepEqual(evidence.get("Next.js"), []);
  assert.deepEqual(unknown, [{ slug: "acme", term: "Supabase" }]);
  assert.deepEqual(shippedWithoutEvidence(ledger(), evidence), [], "React and Postgres have a Project");
  assert.deepEqual(shippedWithoutEvidence(ledger(), new Map()), ["React", "Postgres"]);
});

test("match finds rows by name, by keyword, and several rows for a slash item", () => {
  const l = ledger();
  assert.deepEqual(match(l, "React").map((r) => r.name), ["React"]);
  assert.deepEqual(match(l, "SQL database").map((r) => r.name), ["Postgres"]);
  assert.deepEqual(match(l, "React/Next.js").map((r) => r.name), ["React", "Next.js"]);
  assert.deepEqual(match(l, "Strong React and Postgres").map((r) => r.name), ["React", "Postgres"]);
  assert.deepEqual(match(l, "Supabase"), []);
});

test("record increments seen once per Candidate, spawns gap rows for unknown items, and returns the marker", () => {
  const l = ledger();
  const { changes, recorded } = record(l, undefined, { seen: ["React", "Stripe Connect"], gaps: [{ name: "Supabase", category: "database" }] });
  assert.equal(l.skills.find((r) => r.name === "React").seen, 1);
  assert.equal(l.skills.find((r) => r.name === "Stripe Connect").seen, 4);
  const sb = l.skills.find((r) => r.name === "Supabase");
  assert.deepEqual(sb, { name: "Supabase", category: "database", level: "gap", keywords: [], roles: [], seen: 1 });
  assert.deepEqual(changes, { incremented: ["React", "Stripe Connect"], added: ["Supabase"], unchanged: [] });
  assert.deepEqual(recorded, ["React", "Stripe Connect", "Supabase"]);
  // a re-run with the marker written to job.md changes nothing
  const again = record(l, recorded, { seen: ["React"], gaps: [{ name: "supabase", category: "database" }] });
  assert.deepEqual(again.changes, { incremented: [], added: [], unchanged: ["React", "Supabase"] });
  assert.deepEqual(again.recorded, recorded);
  assert.equal(l.skills.find((r) => r.name === "React").seen, 1);
  assert.equal(sb.seen, 1);
  // a corrected re-run records only the rows the marker lacks
  const more = record(l, recorded, { seen: ["React", "Postgres"], gaps: [] });
  assert.deepEqual(more.changes, { incremented: ["Postgres"], added: [], unchanged: ["React"] });
  assert.deepEqual(more.recorded, [...recorded, "Postgres"]);
  assert.throws(() => record(l, [], { seen: ["Nope"], gaps: [] }), /no row named "Nope"/);
  assert.throws(() => record(l, [], { seen: [], gaps: [{ name: "Figma", category: "design" }] }), /category "design" is not a key/);
});

test("parseStories reads Themes, Bullets and their context lines", () => {
  const body = `**Backend**

- Built the MCP server in Spring Boot: 23 tools.
  Embedded in the Spring API over stateless HTTP.
  No tool starts a paid operation.
- Derived the tool schemas from one Jackson introspection.

**Frontend performance**

- Rendered 100,000-row trace reports.
`;
  const themes = parseStories(body);
  assert.deepEqual(themes.map((t) => [t.name, t.stories.length]), [["Backend", 2], ["Frontend performance", 1]]);
  assert.deepEqual(themes[0].stories[0], { theme: "Backend", lead: "Built the MCP server in Spring Boot: 23 tools.", context: "Embedded in the Spring API over stateless HTTP. No tool starts a paid operation." });
  assert.deepEqual(themes[0].stories[1], { theme: "Backend", lead: "Derived the tool schemas from one Jackson introspection.", context: null });
  assert.deepEqual(parseStories(""), []);
});
