import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Sky Tower tracks floor transition state for vertical climb feel", () => {
  const main = read("src/main.js");
  assert.match(main, /floorIndex/);
  assert.match(main, /floorTransition/);
  assert.match(main, /floorTransitionProgress/);
  assert.match(main, /cameraOffsetY/);
  assert.match(main, /roundState\s*=\s*"floorTransition"/);
});

test("Sky Tower animates old floors down and spawns the next floor from above", () => {
  const main = read("src/main.js");
  assert.match(main, /previousFloorBlocks/);
  assert.match(main, /startFloorTransition/);
  assert.match(main, /spawnNextFloor/);
  assert.match(main, /y:\s*["']\+=/);
  assert.match(main, /Back\.easeOut/);
});

test("Sky Tower shows explicit floor-up feedback and debug state", () => {
  const main = read("src/main.js");
  assert.match(main, /\+1 STEP!/);
  assert.match(main, /FLOOR UP!/);
  assert.match(main, /debugTowerState/);
  assert.match(main, /DEBUG_TOWER_STATE_ENABLED/);
});

test("Sky Tower climb feel preserves math defaults", () => {
  const main = read("src/main.js");
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
