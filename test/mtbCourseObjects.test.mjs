import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const courseObjectAssets = [
  ["assets/environment/mtb_pine_near.svg", /pine/i],
  ["assets/environment/mtb_pine_far.svg", /pine/i],
  ["assets/environment/mtb_snow_bank_large.svg", /snow-bank/i],
  ["assets/environment/mtb_snow_bank_small.svg", /snow-bank/i],
  ["assets/environment/mtb_rock_trackside.svg", /rock/i],
  ["assets/environment/mtb_ice_patch_trackside.svg", /ice-patch/i],
  ["assets/environment/mtb_banner_math_speed.svg", /banner/i],
  ["assets/environment/mtb_checkpoint_flag.svg", /checkpoint-flag/i],
  ["assets/environment/mtb_spectator_flag.svg", /spectator-flag/i]
];

test("MTB course object SVG assets exist, are SVG files, and include identifiers", () => {
  for (const [asset, identifier] of courseObjectAssets) {
    assert.equal(existsSync(asset), true, `${asset} should exist`);
    const svg = readFileSync(asset, "utf8");
    assert.match(svg, /<svg\b/i, `${asset} should contain an svg tag`);
    assert.match(svg, identifier, `${asset} should include ${identifier}`);
  }
});

test("main.js includes decorative course object pool functions", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /createCourseObjectPool\s*\(/);
  assert.match(main, /spawnDecorativeCourseObject\s*\(/);
  assert.match(main, /updateCourseObjects\s*\(/);
  assert.match(main, /recycleCourseObject\s*\(/);
});

test("main.js includes parallax layer creation and update functions", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /createParallaxLayers\s*\(/);
  assert.match(main, /updateParallaxLayers\s*\(/);
  assert.match(main, /drawFarMountains\s*\(/);
  assert.match(main, /drawMidForest\s*\(/);
  assert.match(main, /drawNearCourseDecorations\s*\(/);
});

test("decorative density respects stage identity and low effects mode", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /getStageDecorationProfile\s*\(/);
  assert.match(main, /Stage 1 Snow Trail|snowTrail|Snow Trail/);
  assert.match(main, /Forest Rush|forestRush/);
  assert.match(main, /Ice Bridge|iceBridge/);
  assert.match(main, /Alpine Jump|alpineJump/);
  assert.match(main, /Storm Descent|stormDescent/);
  assert.match(main, /lowEffects[\s\S]{0,900}decorativeCourseObjects/);
});

test("service worker caches new MTB course object assets", () => {
  const sw = readFileSync("sw.js", "utf8");
  for (const [asset] of courseObjectAssets) {
    assert.match(sw, new RegExp(asset.replaceAll("/", "\\/")), `${asset} should be cached`);
  }
});
