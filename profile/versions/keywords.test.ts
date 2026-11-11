// The Keyword lines of a Version filled from its picked Bullets' groups. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fillKeywords } from "./keywords.ts";

const ACME = `---
url: https://acme.test
---
# Acme

## Description
Load testing.

### Charts
Built charts.

### Tables
Built tables.

\`Canvas\`, \`TypeScript\`, \`SVG\`

***

### Recorder
Co-authored the recorder.

\`TypeScript\`, \`Shadow DOM\`

***

### Docs
Wrote docs.

\`Markdown\`, \`Shadow DOM\`
`;

function version(text: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "version-"));
  fs.mkdirSync(path.join(root, "projects"));
  fs.mkdirSync(path.join(root, "versions"));
  fs.writeFileSync(path.join(root, "projects", "acme.md"), ACME);
  const file = path.join(root, "versions", "frontend.md");
  fs.writeFileSync(file, text);
  return file;
}

test("a marker becomes the union of the picked Bullets' groups, deduplicated, most repeated first", () => {
  const file = version(`### [Acme](../projects/acme.md)

* [Charts](../projects/acme.md#charts)
* [Tables](../projects/acme.md#tables)
* [Recorder](../projects/acme.md#recorder)
* [Docs](../projects/acme.md#docs)

{{keywords}}
`);
  assert.deepEqual(fillKeywords(file), {
    reports: [],
    text: `### [Acme](../projects/acme.md)

* [Charts](../projects/acme.md#charts)
* [Tables](../projects/acme.md#tables)
* [Recorder](../projects/acme.md#recorder)
* [Docs](../projects/acme.md#docs)

\`TypeScript\`, \`Shadow DOM\`, \`Canvas\`, \`SVG\`, \`Markdown\`
`,
  });
});

test("an existing Keyword line is left untouched and the Keywords it lacks are reported", () => {
  const text = `### [Acme](../projects/acme.md)

* [Recorder](../projects/acme.md#recorder)
* [Docs](../projects/acme.md#docs)

\`typescript\`
`;
  const file = version(text);
  assert.deepEqual(fillKeywords(file), {
    text,
    reports: ["line 1 Acme: the Keyword line lacks `Shadow DOM`, `Markdown`"],
  });
});

test("a marker under a Project that picks no Bullet is kept and reported", () => {
  const text = "### [Acme](../projects/acme.md)\n\n* [Gone](../projects/acme.md#gone)\n\n{{keywords}}\n";
  assert.deepEqual(fillKeywords(version(text)), { text, reports: ["line 1 Acme: no Bullet picked, the marker is kept"] });
});
