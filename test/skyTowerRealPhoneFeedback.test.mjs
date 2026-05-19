import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

test("real phone feedback document exists with required QA sections", () => {
  assert.equal(exists("docs/SKY_TOWER_REAL_PHONE_FEEDBACK.md"), true);

  const doc = read("docs/SKY_TOWER_REAL_PHONE_FEEDBACK.md");
  assert.match(doc, /# Sky Tower Real Phone Feedback/);
  assert.match(doc, /## Test Matrix/);
  assert.match(doc, /## First 3-Minute Flow/);
  assert.match(doc, /## Issue Log/);
  assert.match(doc, /P0: 실행 불가/);
});

test("main.js keeps real-phone QA parameters and debug hooks available", () => {
  const main = read("src/main.js");

  assert.match(main, /easyPlaytest/);
  assert.match(main, /quickStageClear/);
  assert.match(main, /resetTowerTutorial/);
  assert.match(main, /debugTowerState/);
  assert.match(main, /Stage 2 Unlocked/);
  assert.match(main, /TOWER_JUMP_DURATION_MS/);
  assert.match(main, /TOWER_FLOOR_TRANSITION_MS/);
  assert.match(main, /createBlockHitZone/);
});

test("tower user UI avoids legacy MTB stage names and math defaults stay safe", () => {
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
