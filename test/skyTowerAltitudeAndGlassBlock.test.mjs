import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

test("altitude background and glass block assets exist", () => {
  const requiredAssets = [
    "assets/tower/background/ground_hills.svg",
    "assets/tower/background/cloud_band.svg",
    "assets/tower/background/upper_sky_glow.svg",
    "assets/tower/background/star_field.svg",
    "assets/tower/background/moon_or_planet_far.svg",
    "assets/tower/blocks/block_glass_normal.svg",
    "assets/tower/blocks/block_glass_selected.svg",
    "assets/tower/blocks/block_glass_correct.svg",
    "assets/tower/blocks/block_glass_wrong.svg",
    "assets/tower/blocks/block_glass_cracked.svg",
    "assets/tower/blocks/block_glass_locked.svg"
  ];

  for (const path of requiredAssets) {
    assert.equal(exists(path), true, `${path} should exist`);
    assert.match(read(path), /<svg[\s>]/, `${path} should be an SVG`);
  }
});

test("main.js exposes altitude background progression and glass block loading", () => {
  const main = read("src/main.js");

  assert.match(main, /getAltitudeProgress/);
  assert.match(main, /getBackgroundZone/);
  assert.match(main, /updateAltitudeBackground/);
  assert.match(main, /ground-to-space|Ground \/ Low Sky|Space Edge/);
  assert.match(main, /towerBlockGlassNormal/);
  assert.match(main, /block_glass_normal\.svg/);
  assert.match(main, /createBlockShadow/);
  assert.match(main, /updateBlockShadow/);
});

test("service worker and concept docs include altitude and glass block direction", () => {
  const sw = read("sw.js");
  const doc = read("docs/SKY_MATH_TOWER_CONCEPT.md");

  assert.match(sw, /math-tower-v8/);
  assert.match(sw, /assets\/tower\/background\/ground_hills\.svg/);
  assert.match(sw, /assets\/tower\/blocks\/block_glass_normal\.svg/);
  assert.match(doc, /altitude background progression/i);
  assert.match(doc, /ground.*sky.*space/i);
  assert.match(doc, /translucent 3D glass block/i);
});

test("math defaults remain addition and subtraction only", () => {
  const main = read("src/main.js");
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
