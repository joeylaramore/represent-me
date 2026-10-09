import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Explore race cards link to the visible comparison ballot view", async () => {
  const source = await readFile(new URL("../explore.js", import.meta.url), "utf8");
  assert.match(source, /href="\\?view=compare#contests"/);
  assert.doesNotMatch(source, /href="#contests"/);
});
