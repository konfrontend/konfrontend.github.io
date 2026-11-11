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

test("matchItem names every Skill in an item, less a name another found name holds", () => {
  assert.deepEqual(matchItem([...names, "Figma"], "React and Figma"), ["React", "Figma"]);
  assert.deepEqual(matchItem(["GitHub Actions", "GitHub"], "GitHub Actions CI"), ["GitHub Actions"]);
  assert.deepEqual(matchItem(names, "Sketch"), []);
});
