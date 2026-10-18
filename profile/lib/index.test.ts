import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readProfile, parseStories, skills, skillFor, ledger, renderLedger, master, readVersion, selection, writeArtifact } from "./index.ts";

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "profile-"));
  writeArtifact(path.join(root, "profile.md"), {
    identity: { name: "Ada Lovelace", timezone: "Europe/London", constraints: [] },
    contact: { location: "London (UTC+0)", email: "ada@example.com", github: "https://github.com/ada" },
    resume_order: ["engine", "notes"],
    refused_stacks: [], family_precedence: ["audit", "build", "maintenance", "fix"], word_cap: 350,
    terms: { rate: 60, rate_floor: 40, budget_floor: 0, billing: "hourly-caps" },
  });
  writeArtifact(path.join(root, "voice.md"), { language: "en-US", greeting: { freelance: "Hi,", employment: "Hello," }, sign_off: "Ada" });
  writeArtifact(path.join(root, "projects", "engine.md"), {
    name: "Analytical Engine", url: "https://example.com/engine", role: "Programmer", employment: "contract", start: "1842-01", end: "1843-09", naming: "public", description: "A mechanical computer.", keywords: ["Punched cards", "Bernoulli numbers"],
  }, "**Programs**\n\n- [bernoulli] Wrote the first program, computing Bernoulli numbers.\n  Published as Note G.\n- [loops] Described loops and conditional branches.\n");
  writeArtifact(path.join(root, "projects", "notes.md"), {
    name: "Notes", role: "Author", employment: "independent", start: "1843-01", naming: "public", description: "Translation notes.", keywords: ["punched cards", "Writing"],
  }, "- [translation] Translated Menabrea's memoir with notes three times its length.\n");
  fs.mkdirSync(path.join(root, "answers"));
  writeArtifact(path.join(root, "answers", "why.md"), { question: "Why compute?" }, "Because the Engine can.\n");
  return root;
}

test("parseStories reads keys, Bullets, Facts and Themes, and reports a Story without a key", () => {
  const { themes, errors } = parseStories("**T**\n\n- [a] One.\n  Fact one.\n- Two without key.\n- [a] Three.\n");
  assert.equal(themes[0].name, "T");
  assert.deepEqual(themes[0].stories.map((s) => [s.key, s.lead, s.context]), [["a", "One.", "Fact one."], ["a", "Three.", null]]);
  assert.deepEqual(errors, ['Story without a key: "Two without key."', "duplicate Story key [a]"]);
});

test("readProfile validates every file, orders Projects by resume_order and reads Answers", () => {
  const p = readProfile(fixture());
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.projects.map((x) => x.slug), ["engine", "notes"]);
  assert.equal(p.projects[0].stories.length, 2);
  assert.deepEqual(p.answers.map((a) => [a.question, a.text]), [["Why compute?", "Because the Engine can."]]);
});

test("readProfile names a resume_order slug with no Project file and a Project missing from the order", () => {
  const root = fixture();
  writeArtifact(path.join(root, "projects", "extra.md"), { name: "X", role: "R", employment: "independent", start: "1850-01", naming: "public", description: "D", keywords: ["Writing"] }, "");
  const p = readProfile(root);
  assert.ok(p.errors.includes("profile.md: resume_order lacks the Project extra"));
  assert.equal(p.profile, null);
});

test("skills derive from keywords: canonical spelling from the first Project in resume order, exact match only", () => {
  const p = readProfile(fixture());
  assert.deepEqual(skills(p).map((s) => [s.name, s.evidence]), [["Punched cards", ["engine", "notes"]], ["Bernoulli numbers", ["engine"]], ["Writing", ["notes"]]]);
  assert.equal(skillFor(p, "punched CARDS")?.name, "Punched cards");
  assert.equal(skillFor(p, "cards"), null);
});

test("ledger counts Candidates once per Skill and adds Gaps for unproved requirements, Gaps first", () => {
  const p = readProfile(fixture());
  const rows = ledger(p, [
    { candidate: "c1", requirements: ["Writing", "writing", "Steam"] },
    { candidate: "c2", requirements: ["steam", "Punched cards"] },
  ]);
  assert.deepEqual(rows.map((r) => [r.name, r.level, r.seen]), [["Steam", "gap", 2], ["Punched cards", "shipped", 1], ["Writing", "shipped", 1], ["Bernoulli numbers", "shipped", 0]]);
  assert.match(renderLedger(rows), /\| Steam \| 2 \|/);
});

test("master lists the contact line, every Skill, and every Story by key under its Project in resume order", () => {
  const md = master(readProfile(fixture()));
  assert.match(md, /^# Ada Lovelace\n\nLondon \(UTC\+0\) • \[ada@example.com\]\(mailto:ada@example.com\) • \[github.com\/ada\]/);
  assert.match(md, /## Professional Experience\n\n### \[Analytical Engine\]\(https:\/\/example.com\/engine\) \| Programmer \(Contract\) \| Jan 1842 – Sep 1843\n\nA mechanical computer.\n\n\*\*Programs\*\*\n\n- \[bernoulli\] Wrote/);
  assert.match(md, /## Projects\n\n### Notes \| Author \| Jan 1843 – Present/);
});

test("readVersion refuses unknown Skills terms, Projects and Story keys, and selection follows resume order", () => {
  const root = fixture();
  const p = readProfile(root);
  const file = path.join(root, "general.md");
  writeArtifact(file, { title: "Programmer", summary: "First programmer.", skills: ["Core: Punched cards, Steam"], projects: { notes: ["translation"], engine: ["loops", "nope"], ghost: ["x"] } });
  const v = readVersion(file, p);
  assert.deepEqual(v.errors, ["general.md: Skills term is not a Project keyword: Steam", "general.md: engine has no Story [nope]", "general.md: no Project file for ghost"]);
  assert.deepEqual(selection(v, p).map((s) => [s.project.slug, s.stories.map((x) => x.key)]), [["engine", ["loops"]], ["notes", ["translation"]]]);
});
