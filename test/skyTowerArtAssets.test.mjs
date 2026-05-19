import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

const requiredAssets = [
  "assets/tower/blocks/block_normal.svg",
  "assets/tower/blocks/block_correct.svg",
  "assets/tower/blocks/block_cracked.svg",
  "assets/tower/character/player_idle.svg",
  "assets/tower/character/player_jump.svg",
  "assets/tower/character/player_celebrate.svg",
  "assets/tower/background/cloud_far.svg",
  "assets/tower/background/distant_tower.svg",
  "assets/tower/effects/correct_sparkle.svg",
  "assets/tower/effects/floor_up_glow.svg"
];

test("Sky Tower art asset folders and required SVGs exist", () => {
  assert.equal(exists("assets/tower"), true);
  for (const asset of requiredAssets) {
    assert.equal(exists(asset), true, `${asset} should exist`);
    assert.match(read(asset), /<svg[\s>]/, `${asset} should be an SVG`);
  }
});

test("main.js preloads and uses tower block and character art keys", () => {
  const main = read("src/main.js");
  assert.match(main, /towerPlayerIdle/);
  assert.match(main, /towerPlayerJump/);
  assert.match(main, /towerPlayerCelebrate/);
  assert.match(main, /towerBlockNormal/);
  assert.match(main, /towerBlockCorrect/);
  assert.match(main, /towerBlockCracked/);
  assert.match(main, /TOWER_JUMP_DURATION_MS/);
  assert.match(main, /TOWER_FLOOR_TRANSITION_MS/);
  assert.match(main, /createTowerCharacterSprite/);
});

test("service worker caches Sky Tower art assets", () => {
  const sw = read("sw.js");
  for (const asset of requiredAssets) {
    assert.match(sw, new RegExp(asset.replace(/[./]/g, "\\$&")));
  }
  assert.match(sw, /math-tower-v[5-9]/);
});

test("math operation defaults remain addition and subtraction only", () => {
  const main = read("src/main.js");
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
