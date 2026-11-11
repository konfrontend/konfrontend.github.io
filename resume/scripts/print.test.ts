// Print: a Markdown file and a stylesheet to a PDF with headless Chrome. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHROME } from "./print.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const CSS = path.join(here, "resume.css");
const skip = !fs.existsSync(CHROME) && `no Chrome at ${CHROME}`;

function print(md: string, ...args: string[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "print-"));
  const input = path.join(dir, "frontend.md");
  fs.writeFileSync(input, md);
  const run = spawnSync(process.execPath, [path.join(here, "print.ts"), input, CSS, ...args], { encoding: "utf8" });
  return { run, dir };
}

test("a one-page Markdown file prints to a PDF beside it, without a warning", { skip }, () => {
  const { run, dir } = print("# Kon\n\nFrontend Developer\n\n* Built charts.\n");
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, "");
  assert.match(fs.readFileSync(path.join(dir, "frontend.pdf"), "latin1"), /^%PDF-/);
});

test("a PDF longer than one page is written with one warning and no failure", { skip }, () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "print-")), "long.pdf");
  const { run } = print(`# Kon\n\n${"* A Bullet that takes a line.\n".repeat(150)}`, out);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr.trim().split("\n").length, 1);
  assert.match(run.stderr, /3 pages/);
  assert.ok(fs.existsSync(out));
});

test("print imports nothing from the Profile", () => {
  const imports = [...fs.readFileSync(path.join(here, "print.ts"), "utf8").matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[1]);
  assert.deepEqual(imports.filter((m) => m.startsWith(".")), []);
});
