import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const mtbAssets = [
  "assets/sprites/rider_mtb_large.svg",
  "assets/sprites/rider_mtb_boost_large.svg",
  "assets/sprites/rider_mtb_jump_large.svg",
  "assets/environment/mtb_track_tape.svg",
  "assets/environment/mtb_jump_ramp.svg",
  "assets/environment/mtb_tire_tracks.svg",
  "assets/environment/mtb_bank_curve.svg",
  "assets/environment/mtb_course_marker.svg"
];

test("large MTB rider assets include recognizable bike details", async () => {
  for (const path of mtbAssets.slice(0, 3)) {
    const contents = await readFile(path, "utf8");
    const info = await stat(path);

    assert.match(contents, /<svg[\s>]/);
    assert.equal(info.size < 18000, true, `${path} is too large`);
    assert.match(contents, /wheel/i);
    assert.match(contents, /helmet/i);
    assert.match(contents, /bike/i);
    assert.match(contents, /turbo|grill/i);
  }
});

test("MTB course identity assets exist and are cached", async () => {
  const sw = await readFile("sw.js", "utf8");

  for (const path of mtbAssets) {
    const contents = await readFile(path, "utf8");
    assert.match(contents, /<svg[\s>]/);
    assert.equal(sw.includes(`./${path}`), true, `${path} missing from service worker cache`);
  }
});

test("main preloads and prefers large MTB rider assets", async () => {
  const main = await readFile("src/main.js", "utf8");

  assert.match(main, /load\.svg\("riderMtb"/);
  assert.match(main, /load\.svg\("riderMtbBoost"/);
  assert.match(main, /load\.svg\("riderMtbJump"/);
  assert.equal(main.includes("assets/sprites/rider_mtb_large.svg"), true);
  assert.equal(main.includes("riderMtbJump"), true);
});
