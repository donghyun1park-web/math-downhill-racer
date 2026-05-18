import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const trackAssets = [
  "assets/environment/mtb_track_tape_left.svg",
  "assets/environment/mtb_track_tape_right.svg",
  "assets/environment/mtb_course_pole.svg",
  "assets/environment/mtb_course_arrow_blue.svg",
  "assets/environment/mtb_course_arrow_orange.svg"
];

test("pseudo-3D MTB track SVG assets exist and are SVG files", () => {
  for (const asset of trackAssets) {
    assert.equal(existsSync(asset), true, `${asset} should exist`);
    const svg = readFileSync(asset, "utf8");
    assert.match(svg, /<svg\b/i, `${asset} should contain an svg tag`);
  }
});

test("main.js exposes pseudo-3D track helper functions and renderer", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /getPerspectiveScale\s*\(/);
  assert.match(main, /getTrackWidthAtY\s*\(/);
  assert.match(main, /getTrackCenterAtY\s*\(/);
  assert.match(main, /drawPseudo3DTrack\s*\(/);
});

test("main.js preloads new MTB track perspective assets", () => {
  const main = readFileSync("src/main.js", "utf8");
  for (const key of [
    "mtbTrackTapeLeft",
    "mtbTrackTapeRight",
    "mtbCoursePole",
    "mtbCourseArrowBlue",
    "mtbCourseArrowOrange"
  ]) {
    assert.match(main, new RegExp(`this\\.load\\.svg\\("${key}"`), `${key} should be preloaded`);
  }
});

test("service worker caches new MTB track perspective assets", () => {
  const sw = readFileSync("sw.js", "utf8");
  for (const asset of trackAssets) {
    assert.match(sw, new RegExp(asset.replaceAll("/", "\\/")), `${asset} should be cached`);
  }
});

test("low effects mode applies to perspective track decoration groups", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /lowEffects[\s\S]{0,500}courseTape/);
  assert.match(main, /lowEffects[\s\S]{0,500}coursePoles/);
  assert.match(main, /lowEffects[\s\S]{0,500}courseArrows/);
});
