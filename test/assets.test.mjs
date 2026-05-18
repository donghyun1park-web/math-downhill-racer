import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const requiredAssets = [
  ["rider", "assets/sprites/rider.svg"],
  ["riderBoost", "assets/sprites/rider_boost.svg"],
  ["riderJump", "assets/sprites/rider_jump.svg"],
  ["bikeShadow", "assets/sprites/bike_shadow.svg"],
  ["boostFlame", "assets/sprites/boost_flame.svg"],
  ["pineTree", "assets/environment/pine_tree.svg"],
  ["snowBank", "assets/environment/snow_bank.svg"],
  ["courseFlag", "assets/environment/course_flag.svg"],
  ["rock", "assets/environment/rock.svg"],
  ["icePatch", "assets/environment/ice_patch.svg"],
  ["jumpRamp", "assets/environment/jump_ramp.svg"],
  ["speedometerPanel", "assets/ui/speedometer_panel.svg"],
  ["boostIcon", "assets/ui/boost_icon.svg"],
  ["tempIcon", "assets/ui/temp_icon.svg"],
  ["starFull", "assets/ui/star_full.svg"],
  ["starEmpty", "assets/ui/star_empty.svg"]
];

test("required svg assets exist and stay lightweight", async () => {
  for (const [, path] of requiredAssets) {
    const contents = await readFile(path, "utf8");
    const info = await stat(path);

    assert.match(contents, /<svg[\s>]/);
    assert.equal(info.size < 15000, true, `${path} is larger than expected`);
  }
});

test("main preload references required asset keys and paths", async () => {
  const main = await readFile("src/main.js", "utf8");

  for (const [key, path] of requiredAssets) {
    assert.match(main, new RegExp(`load\\.svg\\("${key}"`));
    assert.equal(main.includes(path), true, `${path} missing from preload`);
  }
});
