import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Sky Tower tutorial has its own completion key and first-run routing", () => {
  const main = read("src/main.js");
  assert.match(main, /SKY_TOWER_TUTORIAL_KEY\s*=\s*"sky-math-tower-tutorial-complete"/);
  assert.match(main, /loadSkyTowerTutorialState\(\)/);
  assert.match(main, /saveSkyTowerTutorialState\(/);
  assert.match(main, /scene\.start\("tutorialIntro"/);
});

test("Sky Tower tutorial defines steps, source exclusion, and completion flow", () => {
  const main = read("src/main.js");
  assert.match(main, /SKY_TOWER_TUTORIAL_STEPS/);
  assert.match(main, /Look at the problem\. Pick the correct block!/);
  assert.match(main, /Correct answer makes you jump higher/);
  assert.match(main, /Moving blocks/);
  assert.match(main, /Practice Complete!/);
  assert.match(main, /source:\s*"tutorial"/);
});

test("Sky Tower menu and stage flow use tower stages and unlocks", () => {
  const main = read("src/main.js");
  for (const stage of ["Cloud Steps", "Windy Blocks", "Sky Bridge", "Star Tower", "Storm Top"]) {
    assert.match(main, new RegExp(stage));
  }
  assert.match(main, /createTowerMenu\(/);
  assert.match(main, /createTowerStageCards\(/);
  assert.match(main, /targetHeight/);
  assert.match(main, /unlockedStage/);
  assert.match(main, /NEXT STAGE/);
});

test("tower mode keeps legacy MTB tutorial and stage names out of default flow", () => {
  const main = read("src/main.js");
  assert.match(main, /if \(isTowerMode\(\)\) \{\s*this\.createTowerMenu\(\);\s*return;/s);
  assert.match(main, /if \(isTowerMode\(\)\) \{\s*this\.createTowerIntro\(\);\s*return;/s);
  assert.match(main, /scene\.start\("tower", \{ mode: "tutorial"/);
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
