import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProfile, parseProject, keywords, writeArtifact, repoRoot } from "./index.ts";

const ENGINE = `---
url: https://example.com/engine
role: Programmer
employment: contract
start: Jan 1842
end: 1843-09
---
# Analytical Engine

## Description
A mechanical computer.

### Bernoulli Program
Wrote the first program, computing Bernoulli numbers.

### Loops
Described loops
and conditional branches.

\`Punched cards\`, \`Bernoulli numbers\`

***

### Translation
Translated Menabrea's memoir.

\`Writing\`, \`punched cards\`,

***

## Notes
[published] Published in 1843.
- A raw line.
`;

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "profile-"));
  writeArtifact(path.join(root, "profile.md"), {
    identity: { name: "Ada Lovelace", timezone: "Europe/London", constraints: [] },
    contact: { email: "ada@example.com", github: "https://github.com/ada" },
    terms: { rate: 60 },
  });
  writeArtifact(path.join(root, "voice.md"), { language: "en-US", greeting: { freelance: "Hi,", employment: "Hello," }, sign_off: "Ada", banned_phrases: [] });
  fs.mkdirSync(path.join(root, "projects"));
  fs.writeFileSync(path.join(root, "projects", "engine.md"), ENGINE);
  fs.writeFileSync(path.join(root, "projects", "notes.md"), "---\nrole: Author\n---\n# Notes\n\n## Description\nTranslation notes.\n\n\`Quill pens\`, \`writing\`\n\n***\n");
  fs.mkdirSync(path.join(root, "answers"));
  writeArtifact(path.join(root, "answers", "why.md"), { question: "Why compute?" }, "Because the Engine can.\n");
  return root;
}

test("parseProject reads the name, the five frontmatter values as written, the Description, the Bullets with anchors and group Keywords, and the Notes", () => {
  const p = parseProject(ENGINE);
  assert.equal(p.name, "Analytical Engine");
  assert.deepEqual(p.meta, { url: "https://example.com/engine", role: "Programmer", employment: "contract", start: "Jan 1842", end: "1843-09" });
  assert.equal(p.description, "A mechanical computer.");
  assert.deepEqual(p.bullets, [
    { anchor: "bernoulli-program", title: "Bernoulli Program", text: "Wrote the first program, computing Bernoulli numbers.", keywords: ["Punched cards", "Bernoulli numbers"] },
    { anchor: "loops", title: "Loops", text: "Described loops\nand conditional branches.", keywords: ["Punched cards", "Bernoulli numbers"] },
    { anchor: "translation", title: "Translation", text: "Translated Menabrea's memoir.", keywords: ["Writing", "punched cards"] },
  ]);
  assert.deepEqual(p.keywords, ["Punched cards", "Bernoulli numbers", "Writing"], "every group's Keywords, once each, case-insensitive");
  assert.deepEqual(p.notes, ["[published] Published in 1843.", "- A raw line."]);
});

test("parseProject reads any value and refuses nothing: other frontmatter keys are dropped, a file without frontmatter or sections is empty", () => {
  const p = parseProject("---\nname: Old\nstart: 2019\nkeywords: [A]\n---\nStray.\n\n## Other\n\n### CAD Engine\nText.\n\n### CAD Engine\nMore.\n");
  assert.deepEqual(p.meta, { start: "2019" }, "a number is kept as written, a key outside the five is dropped");
  assert.equal(p.name, "");
  assert.deepEqual(p.bullets.map((b) => [b.anchor, b.keywords]), [["cad-engine", []], ["cad-engine-1", []]], "a repeated heading takes the next anchor; a group with no Keyword line has no Keywords");
  assert.deepEqual(parseProject(""), { name: "", meta: {}, description: "", bullets: [], keywords: [], notes: [] });
});

test("readProfile reads every Project in filename order and the Answers", () => {
  const p = readProfile(fixture());
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.projects.map((x) => [x.slug, x.name, x.bullets.length]), [["engine", "Analytical Engine", 3], ["notes", "Notes", 0]]);
  assert.deepEqual(p.answers.map((a) => [a.question, a.text]), [["Why compute?", "Because the Engine can."]]);
});

test("keywords are the Bullet groups' Keywords of every Project, spelled as the first Project in filename order spells them", () => {
  const p = readProfile(fixture());
  assert.deepEqual(keywords(p), ["Punched cards", "Bernoulli numbers", "Writing", "Quill pens"]);
});

test("repoRoot is CLAUDE_PROJECT_DIR when set, else the repo this module sits in, read on each call", () => {
  const prev = process.env.CLAUDE_PROJECT_DIR;
  try {
    delete process.env.CLAUDE_PROJECT_DIR;
    const own = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    assert.equal(repoRoot(), own);
    process.env.CLAUDE_PROJECT_DIR = os.tmpdir();
    assert.equal(repoRoot(), path.resolve(os.tmpdir()));
    assert.equal(readProfile().root, path.join(path.resolve(os.tmpdir()), "profile"), "the Profile follows the root");
  } finally {
    if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR; else process.env.CLAUDE_PROJECT_DIR = prev;
  }
});
