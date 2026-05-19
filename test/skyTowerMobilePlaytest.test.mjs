import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

test("Sky Tower mobile playtest document exists", () => {
  assert.equal(exists("docs/SKY_TOWER_MOBILE_PLAYTEST.md"), true);

  const doc = read("docs/SKY_TOWER_MOBILE_PLAYTEST.md");
  assert.match(doc, /First 30 Seconds/);
  assert.match(doc, /Balance Notes/);
});

test("main.js exposes mobile playtest QA parameters and easy mode", () => {
  const main = read("src/main.js");

  assert.match(main, /resetTowerTutorial/);
  assert.match(main, /resetTowerProgress/);
  assert.match(main, /resetTowerAll/);
  assert.match(main, /quickStageClear/);
  assert.match(main, /easyPlaytest/);
  assert.match(main, /EASY_PLAYTEST_ENABLED/);
});

test("main.js keeps block touch area explicit and timing tunable", () => {
  const main = read("src/main.js");

  assert.match(main, /createBlockHitZone/);
  assert.match(main, /updateBlockHitZone/);
  assert.match(main, /setBlockInputEnabled/);
  assert.match(main, /TOWER_JUMP_DURATION_MS/);
  assert.match(main, /TOWER_FLOOR_TRANSITION_MS/);
});

test("main.js surfaces unlock feedback and richer tower debug state", () => {
  const main = read("src/main.js");

  assert.match(main, /Stage 2 Unlocked|Unlocked!/);
  assert.match(main, /easyPlaytest/);
  assert.match(main, /blockSpeed/);
  assert.match(main, /blockCount/);
  assert.match(main, /currentBlocks answers/);
});

test("tower user flow avoids legacy MTB stage names and math defaults stay safe", () => {
  const main = read("src/main.js");
  const towerStart = main.indexOf("const SKY_TOWER_STAGES");
  const legacyRaceStart = main.indexOf("class RaceScene");
  const towerOnly = main.slice(towerStart, legacyRaceStart);

  assert.doesNotMatch(
    towerOnly,
    /Snow Trail|Forest Rush|Ice Bridge|Alpine Jump|Storm Descent|Boost Gate|Speedometer|Downhill/
  );
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
