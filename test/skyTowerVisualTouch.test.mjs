import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Sky Tower concept documents visual direction and forbidden legacy style", () => {
  const concept = read("docs/SKY_MATH_TOWER_CONCEPT.md");
  assert.match(concept, /Visual Direction/);
  assert.match(concept, /bright sky/);
  assert.match(concept, /floating stone or crystal blocks/);
  assert.match(concept, /deep cliff below/);
  assert.match(concept, /MTB graphics should not be reused/i);
  assert.match(concept, /racing HUD/i);
});

test("main.js exposes Sky Tower background, block, player, and jump polish hooks", () => {
  const main = read("src/main.js");
  for (const name of [
    "drawSkyTowerBackground",
    "createCloudLayer",
    "updateCloudLayer",
    "drawDepthFog",
    "createAnswerBlock",
    "updateAnswerBlockVisual",
    "setBlockVisualState",
    "createTowerPlayer",
    "updateTowerPlayerState",
    "playTowerJumpAnimation"
  ]) {
    assert.match(main, new RegExp(`${name}\\s*\\(`));
  }
});

test("Sky Tower stages and temporary tutorial language are tower-specific", () => {
  const main = read("src/main.js");
  for (const stage of ["Cloud Steps", "Windy Blocks", "Sky Bridge", "Star Tower", "Storm Top"]) {
    assert.match(main, new RegExp(stage));
  }
  assert.match(main, /Choose the correct block!/);
  assert.match(main, /Tap the answer block/);
  assert.match(main, /Correct answer makes you jump higher/);
});

test("tower mode keeps legacy MTB UI out of default flow and preserves math defaults", () => {
  const main = read("src/main.js");
  assert.match(main, /ACTIVE_GAME_MODE = "tower"/);
  assert.match(main, /scene\.start\("tower"/);
  assert.match(main, /!DEBUG_MTB_READ_ENABLED \|\| this\.isTowerMode\(\)/);
  assert.match(main, /!DEBUG_RACE_FEEL_ENABLED \|\| this\.isTowerMode\(\)/);
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
