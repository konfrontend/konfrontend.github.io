// Resolve: a Version's slots and Bullet links filled from the Project files. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveVersion } from "./resolve.ts";

const ACME = `---
url: https://acme.test
role: Frontend Developer
employment: contract
start: Mar 2019
end: Present
---
# Acme

## Description
Load testing for websites.

### Charts
Built live charts.

### Recorder
<https://store.test/recorder>
Co-authored the recorder.

\`TypeScript\`, \`Canvas\`

***
`;

// A Profile folder with projects/acme.md and versions/<name>.md; returns the Version's path.
function version(text: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "version-"));
  fs.mkdirSync(path.join(root, "projects"));
  fs.mkdirSync(path.join(root, "versions"));
  fs.writeFileSync(path.join(root, "projects", "acme.md"), ACME);
  const file = path.join(root, "versions", "frontend.md");
  fs.writeFileSync(file, text);
  return file;
}

test("slots and Bullet links print the Project file's text", () => {
  const file = version(`# Kon

## Experience

### [Acme Inc](../projects/acme.md) {{url}}
{{role}} ({{employment}}) | {{start}} – {{end}}
{{Description}}

* [Recorder](../projects/acme.md#recorder)
* [Charts](../projects/acme.md#charts)

## Skills

- Languages: TypeScript
`);
  assert.deepEqual(resolveVersion(file), {
    problems: [],
    warnings: [],
    markdown: `# Kon

## Experience

### Acme Inc https://acme.test
Frontend Developer (contract) | Mar 2019 – Present
Load testing for websites.

* <https://store.test/recorder>
  Co-authored the recorder.
* Built live charts.

## Skills

- Languages: TypeScript
`,
  });
});

test("a slot or link it cannot fill is a problem and a leftover marker a warning, each named with its line", () => {
  const file = version(`{{role}}

### [Acme](../projects/acme.md)
{{title}}

* [Gone](../projects/acme.md#gone)
* [Elsewhere](../projects/other.md#charts)

{{keywords}}

### [Ghost](../projects/ghost.md) {{url}}
`);
  const { problems, warnings, markdown } = resolveVersion(file);
  assert.deepEqual(problems, [
    "line 1: {{role}} is under no Project heading",
    "line 4: {{title}} has no value in the Project file",
    "line 6: Bullet link ../projects/acme.md#gone names no Bullet of that Project",
    "line 7: Bullet link ../projects/other.md#charts points outside ../projects/acme.md",
    "line 11: Project heading links ../projects/ghost.md, which does not exist",
    "line 11: {{url}} reads ../projects/ghost.md, which does not exist",
  ]);
  assert.deepEqual(warnings, ["line 9: {{keywords}} marker still in the file"]);
  assert.doesNotMatch(markdown, /\{\{keywords\}\}/);
});
