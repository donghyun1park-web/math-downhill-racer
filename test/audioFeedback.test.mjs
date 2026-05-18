import test from "node:test";
import assert from "node:assert/strict";
import {
  FEEDBACK_EVENTS,
  createAudioFeedback,
  getDefaultFeedbackSettings,
  normalizeFeedbackSettings
} from "../src/audioFeedback.js";

test("default feedback settings enable sound and haptic", () => {
  assert.deepEqual(getDefaultFeedbackSettings(), { sound: true, haptic: true });
});

test("saved feedback settings are normalized", () => {
  assert.deepEqual(normalizeFeedbackSettings({ sound: false, haptic: true }), { sound: false, haptic: true });
  assert.deepEqual(normalizeFeedbackSettings({}), { sound: true, haptic: true });
});

test("sound off makes play a safe no-op", () => {
  const feedback = createAudioFeedback({ settings: { sound: false, haptic: true } });

  assert.doesNotThrow(() => feedback.play("correct"));
});

test("haptic off avoids vibrate calls", () => {
  let calls = 0;
  const feedback = createAudioFeedback({
    settings: { sound: true, haptic: false },
    navigatorLike: {
      vibrate() {
        calls += 1;
        return true;
      }
    }
  });

  feedback.haptic("wrong");

  assert.equal(calls, 0);
});

test("haptic is safe without browser support", () => {
  const feedback = createAudioFeedback({ settings: { sound: true, haptic: true }, navigatorLike: {} });

  assert.doesNotThrow(() => feedback.haptic("boost"));
});

test("feedback event list includes required events", () => {
  for (const event of ["correct", "wrong", "boost", "jump", "land", "stageClear", "gameOver", "uiClick"]) {
    assert.equal(FEEDBACK_EVENTS.includes(event), true);
  }
});
