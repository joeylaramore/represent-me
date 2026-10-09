import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Explore race cards link to the visible comparison ballot view", async () => {
  const source = await readFile(new URL("../explore.js", import.meta.url), "utf8");
  assert.ok(source.includes('href="?view=compare#contests"'));
  assert.doesNotMatch(source, /href="#contests"/);
});

test("index requests a versioned Explore script to avoid stale navigation", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /src="explore\.js\?v=ce6a0fe"/);
});
