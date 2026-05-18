import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const cockpitPngs = [
  "assets/sprites/generated/mtb_cockpit_normal.png",
  "assets/sprites/generated/mtb_cockpit_left.png",
  "assets/sprites/generated/mtb_cockpit_right.png",
  "assets/sprites/generated/mtb_cockpit_boost.png",
  "assets/sprites/generated/mtb_cockpit_jump.png",
  "assets/sprites/generated/mtb_cockpit_land.png"
];

test("generated cockpit prompt document and folder exist", () => {
  assert.equal(existsSync(new URL("docs/GENERATED_COCKPIT_ASSET_PROMPTS.md", root)), true);
  assert.equal(existsSync(new URL("assets/sprites/generated", root)), true);

  const prompts = read("docs/GENERATED_COCKPIT_ASSET_PROMPTS.md");
  assert.match(prompts, /cockpit asset list/i);
  assert.match(prompts, /transparent PNG/i);
  assert.match(prompts, /no logos/i);
  assert.match(prompts, /no full rider body/i);
  assert.match(prompts, /no rear wheel/i);
});

test("main.js defines generated cockpit PNG paths and preload keys", () => {
  const main = read("src/main.js");
  for (const path of cockpitPngs) {
    assert.match(main, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const key of [
    "mtbCockpitNormal",
    "mtbCockpitLeft",
    "mtbCockpitRight",
    "mtbCockpitBoost",
    "mtbCockpitJump",
    "mtbCockpitLand"
  ]) {
    assert.match(main, new RegExp(`load\\.image\\("${key}"`));
  }
});

test("main.js exposes cockpit mode, state, motion, and debug readout", () => {
  const main = read("src/main.js");
  assert.match(main, /visualMode\s*=\s*'cockpit-png'|"cockpit-png"|cockpit-png/);
  assert.match(main, /createMtbCockpit\s*\(/);
  assert.match(main, /updateMtbCockpit\s*\(/);
  assert.match(main, /setCockpitTexture\s*\(/);
  assert.match(main, /getCockpitState\s*\(/);
  assert.match(main, /cockpit asset loaded/);
  assert.match(main, /track mode: first-person cockpit/);
  assert.match(main, /cockpitFocus/);
});

test("service worker caches generated cockpit assets without breaking math defaults", () => {
  const sw = read("sw.js");
  const main = read("src/main.js");
  for (const path of cockpitPngs) {
    assert.match(sw, new RegExp(`./${path}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(sw, /OPTIONAL_ASSETS/);
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
