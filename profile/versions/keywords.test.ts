// The Keywords each marker of a Version is offered, ranked from its picked Bullets' groups. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { rankKeywords } from "./keywords.ts";

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

test("each marker is offered the union of the picked Bullets' groups, deduplicated, most repeated first; the file is untouched", () => {
  const text = `### [Acme](../projects/acme.md)

* [Charts](../projects/acme.md#charts)
* [Tables](../projects/acme.md#tables)
* [Recorder](../projects/acme.md#recorder)
* [Docs](../projects/acme.md#docs)

{{keywords}}
`;
  const file = version(text);
  assert.deepEqual(rankKeywords(file), {
    markers: [{ line: 8, project: "Acme", keywords: ["TypeScript", "Shadow DOM", "Canvas", "SVG", "Markdown"] }],
    reports: [],
  });
  assert.equal(fs.readFileSync(file, "utf8"), text);
});

test("an existing Keyword line is left untouched and the Keywords it lacks are reported", () => {
  const text = `### [Acme](../projects/acme.md)

* [Recorder](../projects/acme.md#recorder)
* [Docs](../projects/acme.md#docs)

\`typescript\`
`;
  assert.deepEqual(rankKeywords(version(text)), {
    markers: [],
    reports: ["line 1 Acme: the Keyword line lacks `Shadow DOM`, `Markdown`"],
  });
});

test("a marker under a Project that picks no Bullet is offered nothing and reported", () => {
  const text = "### [Acme](../projects/acme.md)\n\n* [Gone](../projects/acme.md#gone)\n\n{{keywords}}\n";
  assert.deepEqual(rankKeywords(version(text)), { markers: [], reports: ["line 1 Acme: no Bullet picked, nothing to offer for the marker on line 5"] });
});
