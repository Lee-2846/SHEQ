import test from "node:test";
import assert from "node:assert/strict";

test("hotspot scoring contract is documented as candidate-only", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../src/services/hotspotService.js", import.meta.url), "utf8"));
  assert.match(source, /NOT a validated ML model/);
  assert.match(source, /sourceType: \{ \$ne: "synthetic_demo" \}/);
  assert.match(source, /state|candidate|review/i);
});
