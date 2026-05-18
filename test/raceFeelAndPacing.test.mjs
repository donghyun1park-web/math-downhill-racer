import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const main = () => readFileSync("src/main.js", "utf8");

test("main.js includes lightweight arcade race feel state and update loop", () => {
  const source = main();
  assert.match(source, /raceFeel:\s*createInitialRaceFeel\(\)|raceFeel\s*=\s*\{/);
  assert.match(source, /speed:\s*0/);
  assert.match(source, /targetSpeed:\s*0/);
  assert.match(source, /lateralVelocity:\s*0/);
  assert.match(source, /steering:\s*0/);
  assert.match(source, /traction:\s*1/);
  assert.match(source, /updateRaceFeel\s*\(/);
  assert.match(source, /applySteering\s*\(/);
  assert.match(source, /applyBoostFeel\s*\(/);
});

test("main.js uses arcade jump, landing, surface, and collision feel", () => {
  const source = main();
  assert.match(source, /jumpVelocity/);
  assert.match(source, /jumpGravity|gravity/);
  assert.match(source, /jumpImpulse/);
  assert.match(source, /applyJumpFeel\s*\(/);
  assert.match(source, /landingTime/);
  assert.match(source, /applySurfaceFeel\s*\(/);
  assert.match(source, /traction/);
  assert.match(source, /slideTime/);
  assert.match(source, /applyCollisionFeel\s*\(/);
});

test("main.js paces math gates as race events instead of constant runners", () => {
  const source = main();
  assert.match(source, /MATH_GATE_MIN_INTERVAL_MS/);
  assert.match(source, /MATH_GATE_MIN_DISTANCE/);
  assert.match(source, /MATH_GATE_MAX_INTERVAL_MS/);
  assert.match(source, /canSpawnMathGate\s*\(/);
  assert.match(source, /scheduleNextMathGate\s*\(/);
  assert.match(source, /spawnMathGateEvent\s*\(/);
  assert.match(source, /lastMathGateDistance/);
  assert.match(source, /nextMathGateAt/);
});

test("debugRaceFeel exists and math defaults stay unchanged", () => {
  const source = main();
  assert.match(source, /debugRaceFeel/);
  assert.match(source, /nextMathGateIn/);
  assert.match(source, /const OPS_DEFAULT = \{ add: true, sub: true, mul: false, div: false \}/);
});
