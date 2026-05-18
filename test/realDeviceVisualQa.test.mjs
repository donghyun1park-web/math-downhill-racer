import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("real device visual QA document exists and has required sections", () => {
  const qaPath = new URL("docs/REAL_DEVICE_VISUAL_QA.md", root);
  assert.equal(existsSync(qaPath), true);

  const qa = read("docs/REAL_DEVICE_VISUAL_QA.md");
  assert.match(qa, /# Real Device Visual QA/);
  assert.match(qa, /## Test Matrix/);
  assert.match(qa, /## Visual Issues/);
  assert.match(qa, /## Screens Checked/);
  assert.match(qa, /https:\/\/donghyun1park-web\.github\.io\/math-downhill-racer\//);
});

test("mobile visual safety structures remain present in main.js", () => {
  const main = read("src/main.js");
  assert.match(main, /UI_SAFE_ZONES/);
  assert.match(main, /getUiSafeZones\s*\(/);
  assert.match(main, /isInUiSafeZone\s*\(/);
  assert.match(main, /getProblemBannerLayout\s*\(/);
  assert.match(main, /createCompactHud\s*\(/);
  assert.match(main, /updateCompactHud\s*\(/);
});

test("debug overlays stay opt-in and available for visual QA", () => {
  const main = read("src/main.js");
  assert.match(main, /debugTouch/);
  assert.match(main, /debugPerf/);
  assert.match(main, /debugStorage/);
  assert.match(main, /new URLSearchParams\(location\.search\)\.get\("debugTouch"\)\s*===\s*"1"/);
  assert.match(main, /new URLSearchParams\(location\.search\)\.get\("debugPerf"\)\s*===\s*"1"/);
  assert.match(main, /new URLSearchParams\(location\.search\)\.get\("debugStorage"\)\s*===\s*"1"/);
});

test("math defaults and deployment cache version are preserved", () => {
  const main = read("src/main.js");
  const sw = read("sw.js");
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
  assert.match(sw, /math-downhill-racer-v\d+/);
});
