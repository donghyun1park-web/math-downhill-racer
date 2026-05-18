import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Sky Math Tower pivot documents exist", () => {
  assert.equal(existsSync(new URL("docs/SKY_MATH_TOWER_CONCEPT.md", root)), true);
  assert.equal(existsSync(new URL("docs/PIVOT_REUSE_AND_DEPRECATION_MAP.md", root)), true);
  const concept = read("docs/SKY_MATH_TOWER_CONCEPT.md");
  assert.match(concept, /Sky Math Tower/);
  assert.match(concept, /곱셈\/나눗셈 기본 OFF/);
  assert.match(concept, /정답은 위로 올라가는 보상/);
  const map = read("docs/PIVOT_REUSE_AND_DEPRECATION_MAP.md");
  assert.match(map, /\| Math generation \|/);
  assert.match(map, /\| MTB track \|/);
});

test("main.js defaults to the tower concept with tower state and stages", () => {
  const main = read("src/main.js");
  assert.match(main, /const GAME_CONCEPT = "sky-math-tower"/);
  assert.match(main, /const ACTIVE_GAME_MODE = "tower"/);
  assert.match(main, /const towerState = \{/);
  for (const field of ["currentHeight", "targetHeight", "lives", "currentBlocks", "roundState"]) {
    assert.match(main, new RegExp(field));
  }
  assert.match(main, /const SKY_TOWER_STAGES = \[/);
  assert.match(main, /Cloud Steps/);
  assert.match(main, /Storm Top/);
});

test("main.js includes block selection, jump, wrong feedback, and tower scene routing", () => {
  const main = read("src/main.js");
  assert.match(main, /class SkyTowerScene extends Phaser\.Scene/);
  assert.match(main, /createAnswerBlocks\s*\(/);
  assert.match(main, /handleBlockSelection\s*\(/);
  assert.match(main, /jumpToCorrectBlock\s*\(/);
  assert.match(main, /handleWrongBlock\s*\(/);
  assert.match(main, /finishTowerRun\s*\(/);
  assert.match(main, /scene\.start\("tower"/);
});

test("tower mode separates deprecated MTB debug and preserves math defaults", () => {
  const main = read("src/main.js");
  const stageLogic = read("src/stageLogic.js");
  assert.match(main, /isTowerMode\s*\(/);
  assert.match(main, /!this\.isTowerMode\(\).*DEBUG_MTB_READ_ENABLED|DEBUG_MTB_READ_ENABLED.*!this\.isTowerMode\(\)/s);
  assert.match(main, /!this\.isTowerMode\(\).*DEBUG_RACE_FEEL_ENABLED|DEBUG_RACE_FEEL_ENABLED.*!this\.isTowerMode\(\)/s);
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
  assert.match(stageLogic, /mul/);
  assert.match(stageLogic, /div/);
});
