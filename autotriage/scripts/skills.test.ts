// Skill matching for triage: canonical names as whole words in a Job item, several per item.
import test from "node:test";
import assert from "node:assert/strict";
import { skillsIn, matchItem } from "./skills.ts";

const names = ["React", "Next.js", "Postgres", "C++ / WebAssembly"];

test("skillsIn finds canonical names as whole words, several rows for a slash item, nothing for an alias", () => {
  assert.deepEqual(skillsIn(names, "React"), ["React"]);
  assert.deepEqual(skillsIn(names, "React/Next.js"), ["React", "Next.js"]);
  assert.deepEqual(skillsIn(names, "Strong React and Postgres"), ["React", "Postgres"]);
  assert.deepEqual(skillsIn(names, "PostgreSQL"), [], "no alias matching: the model maps the phrase to the canonical name");
  assert.deepEqual(skillsIn(names, "Reactive UI"), []);
  assert.deepEqual(skillsIn(names, "C++ / WebAssembly tooling"), ["C++ / WebAssembly"]);
});

test("matchItem names proved Skills first, then claimed Skills, marked by level", () => {
  const claimed = ["Figma", "react"];
  assert.deepEqual(matchItem(names, claimed, "React and Figma"), [{ name: "React", level: "shipped" }, { name: "Figma", level: "claimed" }], "a proved Skill wins over a claimed spelling of it");
  assert.deepEqual(matchItem(names, claimed, "Figma mockups"), [{ name: "Figma", level: "claimed" }]);
  assert.deepEqual(matchItem(["GitHub Actions"], ["GitHub"], "GitHub Actions CI"), [{ name: "GitHub Actions", level: "shipped" }], "a claimed name inside a proved one");
  assert.deepEqual(matchItem(names, claimed, "Sketch"), []);
});
