import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("low effects mode defaults to false and is persisted separately", () => {
  const main = read("src/main.js");
  assert.match(main, /PERFORMANCE_SETTINGS_KEY/);
  assert.match(main, /lowEffectsMode:\s*false/);
  assert.match(main, /loadPerformanceSettings\(/);
  assert.match(main, /savePerformanceSettings\(/);
});

test("low effects mode does not alter math defaults", () => {
  const main = read("src/main.js");
  assert.match(main, /OPS_DEFAULT\s*=\s*{\s*add:\s*true,\s*sub:\s*true,\s*mul:\s*false,\s*div:\s*false\s*}/);
  assert.doesNotMatch(main, /lowEffectsMode[\s\S]{0,160}state\.operations/);
});

test("debug performance and storage code paths exist", () => {
  const main = read("src/main.js");
  assert.match(main, /debugPerf/);
  assert.match(main, /debugStorage/);
  assert.match(main, /createDebugPerfOverlay\(/);
  assert.match(main, /createDebugStorageOverlay\(/);
  assert.match(main, /serviceWorker/);
});

test("settings panel exposes low effects and feedback test buttons", () => {
  const index = read("index.html");
  assert.match(index, /id="low-effects"/);
  assert.match(index, /id="test-sound"/);
  assert.match(index, /id="test-haptic"/);
});
