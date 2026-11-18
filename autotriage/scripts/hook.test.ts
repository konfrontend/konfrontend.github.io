// The write hook validates profile.md by its path and ignores the rest.
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, hook, PROFILE } from "./fixture.ts";

test("the write hook validates profile.md by its path and ignores the rest", () => {
  const { root } = fixture();
  const write = (file: string) => hook(root, "post-tool-use.ts", { tool_input: { file_path: file } });
  assert.equal(write(path.join(root, "profile", "profile.md")).stdout, "", "a valid file passes");
  fs.writeFileSync(path.join(root, "profile", "profile.md"), PROFILE.replace("terms: { rate: 60 }\n", ""));
  const blocked = JSON.parse(write(path.join(root, "profile", "profile.md")).stdout);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /does not match the profile schema:\n  \/ must have required property 'terms'/);
  assert.equal(write(path.join(root, "resume", "versions", "frontend.md")).stdout, "", "a Version is the person's prose, with no schema");
  assert.equal(write(path.join(root, "README.md")).stdout, "");
  fs.writeFileSync(path.join(root, "profile", "projects", "acme.md"), "No frontmatter, no sections.\n");
  assert.equal(write(path.join(root, "profile", "projects", "acme.md")).stdout, "", "a Project file is never blocked");
});
