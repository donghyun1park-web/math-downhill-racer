import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("wrong answer flow applies a bounded one-step descent and can continue", () => {
  const main = read("src/main.js");

  assert.match(main, /handleWrongAnswer|handleWrongBlock/);
  assert.match(main, /applyWrongAnswerPenalty/);
  assert.match(main, /Math\.max\(0,\s*towerState\.currentHeight\s*-\s*1\)/);
  assert.match(main, /Math\.max\(0,\s*towerState\.floorIndex\s*-\s*1\)/);
  assert.match(main, /-1 STEP|DOWN 1 STEP/);
  assert.match(main, /continueAfterWrongAnswer/);
  assert.match(main, /towerState\.selectedBlockId\s*=\s*null/);
  assert.match(main, /towerState\.roundState\s*=\s*"waitingForAnswer"/);
  assert.match(main, /finishTowerRun\(false,\s*"No hearts left"\)/);
  assert.match(main, /towerState\.roundState\s*=\s*cleared \? "stageClear" : "gameOver"/);
});

test("wrong answer bug is recorded in real-phone feedback", () => {
  const doc = read("docs/SKY_TOWER_REAL_PHONE_FEEDBACK.md");

  assert.match(doc, /P1-WRONG-ANSWER-STUCK/);
  assert.match(doc, /오답 선택 후 다음 문제로 진행할 수 없음/);
  assert.match(doc, /Status \|[\s\S]*Fixed/);
});

test("math defaults remain addition and subtraction only", () => {
  const main = read("src/main.js");

  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
