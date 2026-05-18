import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("graphics reference and MTB visual plan docs exist", async () => {
  const graphicsReference = await readFile("docs/GRAPHICS_SKILL_REFERENCE.md", "utf8");
  const reworkPlan = await readFile("docs/MTB_VISUAL_REWORK_PLAN.md", "utf8");

  assert.match(graphicsReference, /# Graphics Skill Reference/);
  assert.match(reworkPlan, /# MTB Visual Rework Plan/);
});

test("graphics reference includes required visual systems", async () => {
  const doc = await readFile("docs/GRAPHICS_SKILL_REFERENCE.md", "utf8");

  assert.match(doc, /Pseudo-3D Perspective Track/);
  assert.match(doc, /Rider Visual Identity Rules/);
  assert.match(doc, /Generated Image Asset Pipeline/);
  assert.match(doc, /This game should look like a downhill MTB racing game first/);
});

test("MTB visual plan names the next graphics tasks", async () => {
  const doc = await readFile("docs/MTB_VISUAL_REWORK_PLAN.md", "utf8");

  assert.match(doc, /TASK_012_RIDER_AND_BIKE_VISUAL_REWORK/);
  assert.match(doc, /TASK_013_PSEUDO_3D_DOWNHILL_TRACK/);
  assert.match(doc, /TASK_014_MTB_COURSE_OBJECTS_AND_PARALLAX/);
  assert.match(doc, /TASK_015_HUD_AND_MATH_GATE_VISUAL_BALANCE/);
});
