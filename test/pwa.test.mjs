import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("manifest has installable portrait PWA metadata", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(typeof manifest.name, "string");
  assert.equal(typeof manifest.short_name, "string");
  assert.equal(typeof manifest.start_url, "string");
  assert.match(manifest.display, /standalone|fullscreen/);
  assert.equal(manifest.orientation, "portrait");
  assert.equal(typeof manifest.background_color, "string");
  assert.equal(typeof manifest.theme_color, "string");
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length >= 3);
});

test("manifest icon paths exist", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  for (const icon of manifest.icons) {
    const path = icon.src.replace(/^\.\//, "");
    assert.equal(existsSync(new URL(path, root)), true, `${icon.src} should exist`);
  }
});

test("service worker caches runtime PWA files and icons", () => {
  const sw = read("sw.js");
  for (const path of [
    "./index.html",
    "./manifest.webmanifest",
    "./src/main.js",
    "./src/stageLogic.js",
    "./src/audioFeedback.js",
    "./src/game.css",
    "./vendor/phaser.min.js",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/maskable-512.png"
  ]) {
    assert.match(sw, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(sw, /math-downhill-racer-v\d+/);
});

test("index links manifest and theme color", () => {
  const index = read("index.html");
  assert.match(index, /<link\s+rel="manifest"\s+href="\.\/manifest\.webmanifest"/);
  assert.match(index, /<meta\s+name="theme-color"/);
});
