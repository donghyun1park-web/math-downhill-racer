import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const riderAssets = [
  ["riderMtbLarge", "assets/sprites/rider_mtb_large.svg"],
  ["riderMtbLeanLeft", "assets/sprites/rider_mtb_lean_left.svg"],
  ["riderMtbLeanRight", "assets/sprites/rider_mtb_lean_right.svg"],
  ["riderMtbBoostState", "assets/sprites/rider_mtb_boost.svg"],
  ["riderMtbJumpState", "assets/sprites/rider_mtb_jump.svg"],
  ["riderMtbLand", "assets/sprites/rider_mtb_land.svg"],
  ["riderMtbSlide", "assets/sprites/rider_mtb_slide.svg"]
];

test("MTB rider state SVG assets exist and include maintainable identifiers", async () => {
  for (const [, path] of riderAssets) {
    const contents = await readFile(path, "utf8");
    const info = await stat(path);

    assert.match(contents, /<svg[\s>]/);
    assert.equal(info.size < 18000, true, `${path} is too large`);
    assert.match(contents, /helmet/i, `${path} missing helmet identifier`);
    assert.match(contents, /front-wheel|rear-wheel/i, `${path} missing wheel identifier`);
    assert.match(contents, /handlebar/i, `${path} missing handlebar identifier`);
    assert.match(contents, /frame/i, `${path} missing frame identifier`);
    assert.match(contents, /grill-turbo/i, `${path} missing grill-turbo identifier`);
  }
});

test("service worker caches all MTB rider state assets", async () => {
  const sw = await readFile("sw.js", "utf8");

  for (const [, path] of riderAssets) {
    assert.equal(sw.includes(`./${path}`), true, `${path} missing from sw.js`);
  }
});

test("main preloads all MTB rider state keys", async () => {
  const main = await readFile("src/main.js", "utf8");

  for (const [key, path] of riderAssets) {
    assert.match(main, new RegExp(`load\\.svg\\("${key}"`));
    assert.equal(main.includes(path), true, `${path} missing from main.js`);
  }
});

test("rider state priority is documented in implementation order", async () => {
  const main = await readFile("src/main.js", "utf8");
  const start = main.indexOf("getRiderTextureKey(lean)");
  const implementation = main.slice(start, main.indexOf("\n  firstTextureKey", start));
  const jumpIndex = implementation.indexOf("state.jumping");
  const landIndex = implementation.indexOf("state.riderLandPulse");
  const slideIndex = implementation.indexOf("state.riderSlidePulse");
  const boostIndex = implementation.indexOf("state.boost > 8");
  const leanIndex = implementation.indexOf("lean < -0.25");

  assert.equal(jumpIndex !== -1, true);
  assert.equal(landIndex > jumpIndex, true);
  assert.equal(slideIndex > landIndex, true);
  assert.equal(boostIndex > slideIndex, true);
  assert.equal(leanIndex > boostIndex, true);
});
