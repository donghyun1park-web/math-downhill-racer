import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("mobile viewport and PWA portrait metadata are present", () => {
  const index = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));

  assert.match(index, /<meta\s+name="viewport"[^>]+viewport-fit=cover/i);
  assert.equal(manifest.orientation, "portrait");
  assert.equal(existsSync(new URL("sw.js", root)), true);
});

test("race input handles multitouch movement, jump, cancellation, and debug overlay", () => {
  const main = read("src/main.js");

  assert.match(main, /activeTouches\s*=\s*{/);
  assert.match(main, /setInputMode\(/);
  assert.match(main, /isRaceInputEnabled\(/);
  assert.match(main, /handlePointerDown\(/);
  assert.match(main, /handlePointerUp\(/);
  assert.match(main, /handlePointerCancel\(/);
  assert.match(main, /pointercancel/);
  assert.match(main, /pointerout/);
  assert.match(main, /debugTouch/);
});

test("mobile layout keeps jump controls and safe-area handling explicit", () => {
  const main = read("src/main.js");
  const css = read("src/game.css");

  assert.match(main, /JUMP_ZONE_SIZE/);
  assert.match(main, /SAFE_BOTTOM_FALLBACK/);
  assert.match(main, /jumpCooldown/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /overflow-y:\s*auto/);
});

test("default multiplication and division settings stay disabled", () => {
  const main = read("src/main.js");
  const index = read("index.html");

  assert.match(main, /mul:\s*false/);
  assert.match(main, /div:\s*false/);
  assert.doesNotMatch(index, /id="op-mul"[^>]+checked/i);
  assert.doesNotMatch(index, /id="op-div"[^>]+checked/i);
});
