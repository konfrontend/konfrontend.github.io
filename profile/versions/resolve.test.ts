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

## Keywords
\`TypeScript\`, \`Canvas\`

***

### Charts
Built live charts.

### Recorder
<https://store.test/recorder>
Co-authored the recorder.

***
`;

// A Profile folder with projects/acme.md and versions/<name>.md; returns the Version's path.
function version(text: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "version-"));
  fs.mkdirSync(path.join(root, "projects"));
  fs.mkdirSync(path.join(root, "versions"));
  fs.writeFileSync(path.join(root, "projects", "acme.md"), ACME);
  fs.writeFileSync(path.join(root, "projects", "bare.md"), "# Bare\n\n## Description\nNo Keywords section.\n\n### Only\nOne Bullet.\n\n\`Stray\`\n");
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

test("a slot or link it cannot fill is a problem and a marker under a Project with no Keywords a warning, each named with its line", () => {
  const file = version(`{{role}}

### [Acme](../projects/acme.md)
{{title}}

* [Gone](../projects/acme.md#gone)
* [Elsewhere](../projects/other.md#charts)

### [Bare](../projects/bare.md)

{{keywords}}

### [Ghost](../projects/ghost.md) {{url}}
`);
  const { problems, warnings, markdown } = resolveVersion(file);
  assert.deepEqual(problems, [
    "line 1: {{role}} is under no Project heading",
    "line 4: {{title}} has no value in the Project file",
    "line 6: Bullet link ../projects/acme.md#gone names no Bullet of that Project",
    "line 7: Bullet link ../projects/other.md#charts points outside ../projects/acme.md",
    "line 13: Project heading links ../projects/ghost.md, which does not exist",
    "line 13: {{url}} reads ../projects/ghost.md, which does not exist",
  ]);
  assert.deepEqual(warnings, ["line 11: {{keywords}} marker prints nothing: the Project has no Keywords"]);
  assert.doesNotMatch(markdown, /\{\{keywords\}\}/);
});

test("a lone link to another site or to an anchor on the page prints as written", () => {
  const text = "### [Acme](../projects/acme.md)\n\n* [Store](https://store.test/page#top)\n* [Top](#top)\n\n## [Site](https://site.test/readme.md)\n";
  const { problems, markdown } = resolveVersion(version(text));
  assert.deepEqual(problems, []);
  assert.equal(markdown, text.replace("[Acme](../projects/acme.md)", "Acme"));
});

test("a marker in either case prints its Project's Keywords in file order, whichever Bullets are picked; a written Keyword line prints as written", () => {
  const file = version(`### [Acme](../projects/acme.md)

* [Charts](../projects/acme.md#charts)

{{keywords}}

### [Acme](../projects/acme.md)

{{ Keywords }}

### [Acme](../projects/acme.md)

\`Canvas\`, \`By hand\`
`);
  assert.deepEqual(resolveVersion(file), {
    problems: [],
    warnings: [],
    markdown: "### Acme\n\n* Built live charts.\n\n`TypeScript`, `Canvas`\n\n### Acme\n\n`TypeScript`, `Canvas`\n\n### Acme\n\n`Canvas`, `By hand`\n",
  });
});
