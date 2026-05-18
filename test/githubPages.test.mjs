import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("github pages static deploy files exist", () => {
  assert.equal(existsSync(new URL(".nojekyll", root)), true);
  assert.equal(existsSync(new URL(".github/workflows/deploy-pages.yml", root)), true);
  assert.equal(existsSync(new URL("docs/GITHUB_PAGES_DEPLOY.md", root)), true);
});

test("github pages workflow deploys static root with official pages actions", () => {
  const workflow = read(".github/workflows/deploy-pages.yml");
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*\./);
  assert.match(workflow, /branches:\s*\n\s*-\s*main/);
});

test("runtime paths are relative for project-site deployment", () => {
  const index = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const main = read("src/main.js");

  assert.match(index, /href="\.\/manifest\.webmanifest"/);
  assert.match(index, /src="\.\/vendor\/phaser\.min\.js"/);
  assert.match(index, /src="\.\/src\/main\.js"/);
  assert.equal(manifest.start_url, "./index.html");
  assert.match(main, /serviceWorker\.register\("\.\/sw\.js"\)/);
});
