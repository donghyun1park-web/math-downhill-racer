import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const visualAssets = [
  "assets/ui/logo_badge.svg",
  "assets/ui/button_start.svg",
  "assets/ui/button_blue.svg",
  "assets/ui/button_dark.svg",
  "assets/ui/math_gate_frame.svg",
  "assets/ui/problem_banner.svg",
  "assets/ui/jump_button.svg",
  "assets/environment/course_arrow.svg",
  "assets/environment/course_fence.svg",
  "assets/environment/mountain_layer.svg",
  "assets/effects/boost_spark.svg"
];

test("visual style svg assets exist and stay lightweight", async () => {
  for (const path of visualAssets) {
    const contents = await readFile(path, "utf8");
    const info = await stat(path);

    assert.match(contents, /<svg[\s>]/);
    assert.equal(info.size < 15000, true, `${path} is too large`);
  }
});

test("service worker caches new visual assets", async () => {
  const sw = await readFile("sw.js", "utf8");

  for (const path of visualAssets) {
    assert.equal(sw.includes(`./${path}`), true, `${path} missing from sw.js`);
  }
});

test("index does not add external cdn dependencies", async () => {
  const html = await readFile("index.html", "utf8");

  assert.equal(html.includes("https://cdn"), false);
  assert.equal(html.includes("vendor/phaser.min.js"), true);
});
