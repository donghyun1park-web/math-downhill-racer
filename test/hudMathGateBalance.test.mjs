import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("main.js includes compact HUD structure and visual state handling", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /createCompactHud\s*\(/);
  assert.match(main, /updateCompactHud\s*\(/);
  assert.match(main, /setHudVisualState\s*\(/);
  assert.match(main, /normal[\s\S]{0,240}correct[\s\S]{0,240}wrong[\s\S]{0,240}boost/);
});

test("main.js includes problem banner sizing and positioning balance", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /getProblemBannerLayout\s*\(/);
  assert.match(main, /getProblemBannerLayout[\s\S]{0,400}height:\s*Math\.min/);
  assert.match(main, /questionText[\s\S]{0,260}setFontSize/);
});

test("main.js includes gate visual balance helpers", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /getGateVisualScale\s*\(/);
  assert.match(main, /applyGateVisualBalance\s*\(/);
  assert.match(main, /isCorrect[\s\S]{0,300}0x42ff9b/);
});

test("main.js defines UI safe zones and decorative overlap handling", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /UI_SAFE_ZONES/);
  assert.match(main, /getUiSafeZones\s*\(/);
  assert.match(main, /isInUiSafeZone\s*\(/);
  assert.match(main, /drawDecorativeCourseObject[\s\S]{0,700}safeZone/);
});

test("multiplication and division remain disabled by default", () => {
  const main = readFileSync("src/main.js", "utf8");
  assert.match(main, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
