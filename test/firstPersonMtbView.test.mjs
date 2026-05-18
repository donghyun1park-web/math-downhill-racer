import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("generated cockpit asset prompt document exists", () => {
  const promptPath = new URL("docs/GENERATED_COCKPIT_ASSET_PROMPTS.md", root);
  assert.equal(existsSync(promptPath), true);

  const prompts = read("docs/GENERATED_COCKPIT_ASSET_PROMPTS.md");
  for (const name of [
    "mtb_cockpit_normal.png",
    "mtb_cockpit_left.png",
    "mtb_cockpit_right.png",
    "mtb_cockpit_boost.png",
    "mtb_cockpit_jump.png",
    "mtb_cockpit_land.png"
  ]) {
    assert.match(prompts, new RegExp(name));
  }
  assert.match(prompts, /transparent background/i);
  assert.match(prompts, /first-person downhill MTB cockpit view/i);
  assert.match(prompts, /no full rider body/i);
});

test("main.js prepares generated cockpit paths and fallback priority", () => {
  const main = read("src/main.js");
  for (const path of [
    "assets/sprites/generated/mtb_cockpit_normal.png",
    "assets/sprites/generated/mtb_cockpit_left.png",
    "assets/sprites/generated/mtb_cockpit_right.png",
    "assets/sprites/generated/mtb_cockpit_boost.png",
    "assets/sprites/generated/mtb_cockpit_jump.png",
    "assets/sprites/generated/mtb_cockpit_land.png"
  ]) {
    assert.match(main, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(main, /cockpit-png[\s\S]{0,120}cockpit-svg[\s\S]{0,120}rider-svg[\s\S]{0,120}graphics/);
});

test("main.js includes first-person cockpit view state and debug readout", () => {
  const main = read("src/main.js");
  assert.match(main, /FIRST_PERSON_MTB_VIEW/);
  assert.match(main, /COCKPIT_SCREEN_HEIGHT_RATIO/);
  assert.match(main, /createCockpitView\s*\(/);
  assert.match(main, /updateCockpitView\s*\(/);
  assert.match(main, /getCockpitTextureKey\s*\(/);
  assert.match(main, /debugMtbRead/);
  assert.match(main, /track mode: first-person simplified/);
});

test("first-person view keeps simplified track and math defaults", () => {
  const main = read("src/main.js");
  assert.match(main, /FIRST_PERSON_SIMPLIFIED_TRACK/);
  assert.match(main, /getDecorativeDensityScale\s*\(/);
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
