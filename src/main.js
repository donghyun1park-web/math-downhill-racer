import {
  FEEDBACK_SETTINGS_KEY,
  createAudioFeedback,
  normalizeFeedbackSettings
} from "./audioFeedback.js";

import {
  STAGES,
  LEARNING_STATS_KEY,
  TUTORIAL_KEY,
  calculateStars,
  createInitialLearningStats,
  createInitialProgress,
  createTutorialCompletion,
  createTutorialProblem,
  generateProblem,
  mergeStageResult,
  normalizeLearningStats,
  normalizeProgress,
  shouldRecordLearningResult,
  skipTutorial,
  summarizeLearningStats,
  updateLearningStats
} from "./stageLogic.js";

const DESIGN = {
  width: 390,
  height: 844,
  laneCount: 3,
  laneWidth: 104
};

const OPS_DEFAULT = { add: true, sub: true, mul: false, div: false };
const PROGRESS_KEY = "math-downhill-progress";
const PERFORMANCE_SETTINGS_KEY = "math-downhill-performance-settings";
const OVERHEAT_LIMIT = 112;
const JUMP_ZONE_SIZE = 88;
const SAFE_BOTTOM_FALLBACK = 16;
const TOUCH_REPEAT_MS = 230;
const TOUCH_TOP_DEAD_ZONE = 172;
const DEBUG_TOUCH_ENABLED = new URLSearchParams(location.search).get("debugTouch") === "1"
  || localStorage.getItem("math-downhill-debug-touch") === "1";
const DEBUG_PERF_ENABLED = new URLSearchParams(location.search).get("debugPerf") === "1"
  || localStorage.getItem("math-downhill-debug-perf") === "1";
const DEBUG_STORAGE_ENABLED = new URLSearchParams(location.search).get("debugStorage") === "1"
  || localStorage.getItem("math-downhill-debug-storage") === "1";
const ASSETS = {
  rider: "assets/sprites/rider.svg",
  riderBoost: "assets/sprites/rider_boost.svg",
  riderJump: "assets/sprites/rider_jump.svg",
  bikeShadow: "assets/sprites/bike_shadow.svg",
  boostFlame: "assets/sprites/boost_flame.svg",
  pineTree: "assets/environment/pine_tree.svg",
  snowBank: "assets/environment/snow_bank.svg",
  courseFlag: "assets/environment/course_flag.svg",
  rock: "assets/environment/rock.svg",
  icePatch: "assets/environment/ice_patch.svg",
  jumpRamp: "assets/environment/jump_ramp.svg",
  speedometerPanel: "assets/ui/speedometer_panel.svg",
  boostIcon: "assets/ui/boost_icon.svg",
  tempIcon: "assets/ui/temp_icon.svg",
  starFull: "assets/ui/star_full.svg",
  starEmpty: "assets/ui/star_empty.svg",
  logoBadge: "assets/ui/logo_badge.svg",
  buttonStart: "assets/ui/button_start.svg",
  buttonBlue: "assets/ui/button_blue.svg",
  buttonDark: "assets/ui/button_dark.svg",
  mathGateFrame: "assets/ui/math_gate_frame.svg",
  problemBanner: "assets/ui/problem_banner.svg",
  jumpButtonArt: "assets/ui/jump_button.svg",
  courseArrow: "assets/environment/course_arrow.svg",
  courseFence: "assets/environment/course_fence.svg",
  mountainLayer: "assets/environment/mountain_layer.svg",
  boostSpark: "assets/effects/boost_spark.svg"
};

const state = {
  operations: loadOperations(),
  performance: loadPerformanceSettings(),
  progress: loadProgress(),
  learningStats: loadLearningStats(),
  tutorial: loadTutorialState(),
  stage: STAGES[0],
  mode: "race",
  tutorialStep: 0,
  tutorialMoves: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  wrongStreak: 0,
  distance: 0,
  speed: 64,
  speedKick: 0,
  boost: 0,
  grillTemp: 62,
  jumping: false,
  airBonusReady: false,
  hudMode: "normal",
  hudPulse: 0,
  warningPulse: 0,
  flashPulse: 0,
  boostPulse: 0
};

const settingsPanel = document.querySelector("#settings-panel");
const resetLearningButton = document.querySelector("#reset-learning");
const feedbackControls = {
  sound: document.querySelector("#feedback-sound"),
  haptic: document.querySelector("#feedback-haptic")
};
const performanceControls = {
  lowEffects: document.querySelector("#low-effects"),
  testSound: document.querySelector("#test-sound"),
  testHaptic: document.querySelector("#test-haptic")
};
const controls = {
  add: document.querySelector("#op-add"),
  sub: document.querySelector("#op-sub"),
  mul: document.querySelector("#op-mul"),
  div: document.querySelector("#op-div")
};
const feedback = createAudioFeedback({ settings: loadFeedbackSettings() });

function loadOperations() {
  const saved = localStorage.getItem("math-downhill-operations");
  if (!saved) return { ...OPS_DEFAULT };
  try {
    const parsed = JSON.parse(saved);
    return {
      add: Boolean(parsed.add),
      sub: Boolean(parsed.sub),
      mul: Boolean(parsed.mul),
      div: Boolean(parsed.div)
    };
  } catch {
    return { ...OPS_DEFAULT };
  }
}

function saveOperations() {
  const next = {
    add: controls.add.checked,
    sub: controls.sub.checked,
    mul: controls.mul.checked,
    div: controls.div.checked
  };
  if (!Object.values(next).some(Boolean)) {
    next.add = true;
    next.sub = true;
    controls.add.checked = true;
    controls.sub.checked = true;
  }
  Object.assign(state.operations, next);
  localStorage.setItem("math-downhill-operations", JSON.stringify(next));
  updateDebugStorageOverlay();
}

function loadPerformanceSettings() {
  const defaults = { lowEffectsMode: false };
  const saved = localStorage.getItem(PERFORMANCE_SETTINGS_KEY);
  if (!saved) return defaults;
  try {
    const parsed = JSON.parse(saved);
    return { lowEffectsMode: typeof parsed.lowEffectsMode === "boolean" ? parsed.lowEffectsMode : false };
  } catch {
    return defaults;
  }
}

function savePerformanceSettings() {
  state.performance = { lowEffectsMode: Boolean(performanceControls.lowEffects.checked) };
  localStorage.setItem(PERFORMANCE_SETTINGS_KEY, JSON.stringify(state.performance));
  window.dispatchEvent(new Event("math-downhill-performance-settings-changed"));
  updateDebugStorageOverlay();
}

function loadProgress() {
  const saved = localStorage.getItem(PROGRESS_KEY);
  if (!saved) return createInitialProgress();
  try {
    return normalizeProgress(JSON.parse(saved));
  } catch {
    return createInitialProgress();
  }
}

function saveProgress(progress) {
  state.progress = normalizeProgress(progress);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
}

function loadLearningStats() {
  const saved = localStorage.getItem(LEARNING_STATS_KEY);
  if (!saved) return createInitialLearningStats();
  try {
    return normalizeLearningStats(JSON.parse(saved));
  } catch {
    return createInitialLearningStats();
  }
}

function saveLearningStats(stats) {
  state.learningStats = normalizeLearningStats(stats);
  localStorage.setItem(LEARNING_STATS_KEY, JSON.stringify(state.learningStats));
}

function loadFeedbackSettings() {
  const saved = localStorage.getItem(FEEDBACK_SETTINGS_KEY);
  if (!saved) return normalizeFeedbackSettings();
  try {
    return normalizeFeedbackSettings(JSON.parse(saved));
  } catch {
    return normalizeFeedbackSettings();
  }
}

function saveFeedbackSettings() {
  const next = normalizeFeedbackSettings({
    sound: feedbackControls.sound.checked,
    haptic: feedbackControls.haptic.checked
  });
  feedback.setSettings(next);
  localStorage.setItem(FEEDBACK_SETTINGS_KEY, JSON.stringify(next));
  updateDebugStorageOverlay();
}

function loadTutorialState() {
  const saved = localStorage.getItem(TUTORIAL_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return parsed?.completed ? parsed : null;
  } catch {
    return null;
  }
}

function saveTutorialState(value) {
  state.tutorial = value;
  localStorage.setItem(TUTORIAL_KEY, JSON.stringify(value));
}

function resetRun(stage) {
  state.stage = stage;
  state.mode = "race";
  state.tutorialStep = 0;
  state.tutorialMoves = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.correctAnswers = 0;
  state.totalQuestions = 0;
  state.wrongStreak = 0;
  state.distance = 0;
  state.speed = stage.baseSpeed + 22;
  state.speedKick = 0;
  state.boost = 0;
  state.grillTemp = 62;
  state.jumping = false;
  state.airBonusReady = false;
  state.hudMode = "normal";
  state.hudPulse = 0;
  state.warningPulse = 0;
  state.flashPulse = 0;
  state.boostPulse = 0;
}

function resetTutorialRun() {
  resetRun(STAGES[0]);
  state.mode = "tutorial";
  state.tutorialStep = 1;
  state.tutorialMoves = 0;
  state.grillTemp = 70;
  state.speed = 48;
}

for (const [key, input] of Object.entries(controls)) {
  input.checked = state.operations[key];
  input.addEventListener("change", saveOperations);
}
performanceControls.lowEffects.checked = state.performance.lowEffectsMode;
performanceControls.lowEffects.addEventListener("change", savePerformanceSettings);

const savedFeedbackSettings = feedback.getSettings();
feedbackControls.sound.checked = savedFeedbackSettings.sound;
feedbackControls.haptic.checked = savedFeedbackSettings.haptic;
feedbackControls.sound.addEventListener("change", saveFeedbackSettings);
feedbackControls.haptic.addEventListener("change", saveFeedbackSettings);
performanceControls.testSound.addEventListener("click", async () => {
  await feedback.unlock();
  feedback.play("correct");
});
performanceControls.testHaptic.addEventListener("click", () => {
  feedback.haptic("correct");
});

window.addEventListener("pointerdown", () => feedback.unlock(), { passive: true });
window.addEventListener("keydown", () => feedback.unlock());
window.addEventListener("storage", () => updateDebugStorageOverlay());

document.querySelector("#close-settings").addEventListener("click", () => {
  settingsPanel.classList.remove("is-open");
  window.dispatchEvent(new Event("math-downhill-settings-closed"));
});

resetLearningButton.addEventListener("click", () => {
  localStorage.removeItem(LEARNING_STATS_KEY);
  state.learningStats = createInitialLearningStats();
  resetLearningButton.textContent = "Learning reset";
  window.setTimeout(() => {
    resetLearningButton.textContent = "Reset learning data";
  }, 1200);
  updateDebugStorageOverlay();
});

let debugStoragePanel = null;
function createDebugStorageOverlay() {
  if (!DEBUG_STORAGE_ENABLED || debugStoragePanel) return;
  debugStoragePanel = document.createElement("pre");
  debugStoragePanel.className = "debug-storage-panel";
  document.body.append(debugStoragePanel);
  updateDebugStorageOverlay();
}

function updateDebugStorageOverlay() {
  if (!debugStoragePanel) return;
  const progress = loadProgress();
  const learning = loadLearningStats();
  const feedbackSettings = feedback.getSettings();
  const performanceSettings = loadPerformanceSettings();
  debugStoragePanel.textContent = [
    "debugStorage=1",
    `tutorial: ${Boolean(loadTutorialState())}`,
    `unlockedStage: ${progress.unlockedStage}`,
    `math: add=${state.operations.add} sub=${state.operations.sub} mul=${state.operations.mul} div=${state.operations.div}`,
    `feedback: sound=${feedbackSettings.sound} haptic=${feedbackSettings.haptic}`,
    `lowEffectsMode: ${performanceSettings.lowEffectsMode}`,
    `learning totalAnswered: ${learning.totalAnswered}`
  ].join("\n");
}

createDebugStorageOverlay();

class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.svg("rider", ASSETS.rider);
    this.load.svg("riderBoost", ASSETS.riderBoost);
    this.load.svg("riderJump", ASSETS.riderJump);
    this.load.svg("bikeShadow", ASSETS.bikeShadow);
    this.load.svg("boostFlame", ASSETS.boostFlame);
    this.load.svg("pineTree", ASSETS.pineTree);
    this.load.svg("snowBank", ASSETS.snowBank);
    this.load.svg("courseFlag", ASSETS.courseFlag);
    this.load.svg("rock", ASSETS.rock);
    this.load.svg("icePatch", ASSETS.icePatch);
    this.load.svg("jumpRamp", ASSETS.jumpRamp);
    this.load.svg("speedometerPanel", ASSETS.speedometerPanel);
    this.load.svg("boostIcon", ASSETS.boostIcon);
    this.load.svg("tempIcon", ASSETS.tempIcon);
    this.load.svg("starFull", ASSETS.starFull);
    this.load.svg("starEmpty", ASSETS.starEmpty);
    this.load.svg("logoBadge", ASSETS.logoBadge);
    this.load.svg("buttonStart", ASSETS.buttonStart);
    this.load.svg("buttonBlue", ASSETS.buttonBlue);
    this.load.svg("buttonDark", ASSETS.buttonDark);
    this.load.svg("mathGateFrame", ASSETS.mathGateFrame);
    this.load.svg("problemBanner", ASSETS.problemBanner);
    this.load.svg("jumpButtonArt", ASSETS.jumpButtonArt);
    this.load.svg("courseArrow", ASSETS.courseArrow);
    this.load.svg("courseFence", ASSETS.courseFence);
    this.load.svg("mountainLayer", ASSETS.mountainLayer);
    this.load.svg("boostSpark", ASSETS.boostSpark);
  }

  create() {
    this.scene.start(loadTutorialState() ? "menu" : "tutorialIntro");
  }
}

class TutorialIntroScene extends Phaser.Scene {
  constructor() {
    super("tutorialIntro");
  }

  create() {
    this.cameras.main.setBackgroundColor("#07111f");
    const { width, height } = this.scale;
    const centerX = Math.min(width, DESIGN.width) / 2;
    const g = this.add.graphics();
    g.fillGradientStyle(0x05284d, 0x06101e, 0x0b4776, 0x07111f, 1);
    g.fillRect(0, 0, width, height);
    if (this.textures.exists("mountainLayer")) {
      this.add.image(width / 2, height * 0.28, "mountainLayer").setDisplaySize(width * 1.2, 250).setAlpha(0.95);
    }
    g.fillStyle(0x0a2034, 0.74);
    g.fillTriangle(width * 0.5, height * 0.34, width + 95, height, -95, height);
    g.fillStyle(0xff7a18, 0.24);
    g.fillCircle(width * 0.78, height * 0.38, 72);
    drawArcadeBadge(this, centerX, 104, Math.min(width, DESIGN.width) * 0.88, 154);
    this.add.text(centerX, 62, "GRILL", {
      fontFamily: "Arial Black, Arial",
      fontSize: "48px",
      color: "#f6fbff",
      stroke: "#020815",
      strokeThickness: 9
    }).setOrigin(0.5);
    this.add.text(centerX, 111, "MASTER", {
      fontFamily: "Arial Black, Arial",
      fontSize: "48px",
      color: "#ff9818",
      stroke: "#020815",
      strokeThickness: 9
    }).setOrigin(0.5);
    this.add.text(centerX, 151, "MOUNTAIN DOWNHILL", {
      fontFamily: "Arial Black, Arial",
      fontSize: "19px",
      color: "#dff8ff",
      stroke: "#020815",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(centerX, 180, "MATH  •  SPEED  •  BOOST", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9ee7ff"
    }).setOrigin(0.5);
    drawRiderSilhouette(this, centerX + 62, height * 0.42);
    this.add.text(centerX, height - 296, "Practice for 30 seconds,\nthen start the real race.", {
      fontFamily: "Arial Black, Arial",
      fontSize: "20px",
      color: "#dff8ff",
      stroke: "#020815",
      strokeThickness: 5,
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);
    this.createButton(centerX, height - 204, "START PRACTICE", () => this.scene.start("race", { mode: "tutorial" }), "buttonStart");
    this.createButton(centerX, height - 126, "SKIP", () => {
      feedback.trigger("uiClick");
      saveTutorialState(skipTutorial());
      this.scene.start("menu");
    }, "buttonDark");
  }

  createButton(x, y, label, action, textureKey = "buttonBlue") {
    drawArcadeButton(this, x, y, textureKey);
    return this.add.text(x, y, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: textureKey === "buttonStart" ? "22px" : "18px",
      color: "#ffffff",
      stroke: "#06101e",
      strokeThickness: 5
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      feedback.trigger("uiClick");
      action();
    });
  }
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    state.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#07111f");
    this.drawBackground();
    const { width, height } = this.scale;
    const centerX = Math.min(width, DESIGN.width) / 2;
    drawArcadeBadge(this, centerX, 104, Math.min(width, DESIGN.width) * 0.88, 154);
    this.add.text(centerX, 62, "GRILL", {
      fontFamily: "Arial Black, Arial",
      fontSize: "48px",
      color: "#f6fbff",
      stroke: "#020815",
      strokeThickness: 9
    }).setOrigin(0.5);
    this.add.text(centerX, 111, "MASTER", {
      fontFamily: "Arial Black, Arial",
      fontSize: "48px",
      color: "#ff9818",
      stroke: "#020815",
      strokeThickness: 9
    }).setOrigin(0.5);
    this.add.text(centerX, 151, "MOUNTAIN DOWNHILL", {
      fontFamily: "Arial Black, Arial",
      fontSize: "19px",
      color: "#dff8ff",
      stroke: "#020815",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(centerX, 179, "MATH  •  SPEED  •  BOOST", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9ee7ff"
    }).setOrigin(0.5);
    drawRiderSilhouette(this, centerX + 62, height * 0.42);
    this.createStageCards();
    this.createMenuButton(centerX, height - 210, "START", "buttonStart", () => {
      feedback.trigger("uiClick");
      this.scene.start("race", { stageId: Math.min(state.progress.unlockedStage, STAGES.length) });
    }, 30);
    this.createMenuButton(centerX, height - 134, "TUTORIAL RIDE", "buttonBlue", () => {
      feedback.trigger("uiClick");
      this.scene.start("race", { mode: "tutorial" });
    }, 22);
    this.createMenuButton(centerX, height - 68, "SETTINGS", "buttonDark", () => {
      feedback.trigger("uiClick");
      settingsPanel.classList.toggle("is-open");
    }, 22);
  }

  drawBackground() {
    const g = this.add.graphics();
    const { width, height } = this.scale;
    g.fillGradientStyle(0x05284d, 0x06101e, 0x0b4776, 0x07111f, 1);
    g.fillRect(0, 0, width, height);
    if (this.textures.exists("mountainLayer")) {
      this.add.image(width / 2, height * 0.28, "mountainLayer").setDisplaySize(width * 1.18, 250).setAlpha(0.94);
      this.add.image(width / 2, height * 0.53, "mountainLayer").setDisplaySize(width * 1.45, 300).setAlpha(0.36);
    }
    g.fillStyle(0x0a2034, 0.72);
    g.fillTriangle(width * 0.5, height * 0.34, width + 95, height, -95, height);
    g.lineStyle(5, 0x35d4ff, 0.5);
    g.lineBetween(width * 0.48, height * 0.36, 30, height);
    g.lineBetween(width * 0.52, height * 0.36, width - 30, height);
    g.fillStyle(0xff7a18, 0.26);
    g.fillCircle(width * 0.75, height * 0.38, 70);
    for (let i = 0; i < 60; i += 1) {
      g.fillStyle(0xdff8ff, 0.25 + (i % 4) * 0.08);
      g.fillCircle((i * 67) % width, (i * 97) % height, 1 + (i % 3));
    }
  }

  createStageCards() {
    const startY = 214;
    STAGES.forEach((stage, index) => {
      const unlocked = stage.id <= state.progress.unlockedStage;
      const best = state.progress.bestScores[stage.id];
      const y = startY + index * 92;
      if (index > 2) return;
      const card = this.add.graphics();
      card.fillStyle(unlocked ? 0x0a2034 : 0x07111f, unlocked ? 0.9 : 0.72);
      card.fillRoundedRect(24, y, this.scale.width - 48, 74, 8);
      card.lineStyle(2, unlocked ? 0x35d4ff : 0x2a3e52, unlocked ? 0.56 : 0.38);
      card.strokeRoundedRect(24, y, this.scale.width - 48, 74, 8);

      this.add.text(42, y + 12, `Stage ${stage.id}: ${stage.name}`, {
        fontFamily: "Arial Black, Arial",
        fontSize: "16px",
        color: unlocked ? "#f6fbff" : "#6b7f90"
      });
      this.add.text(42, y + 40, unlocked ? `${stage.targetDistance}m  ${stage.weather.toUpperCase()}` : "LOCKED", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: unlocked ? "#9ee7ff" : "#6b7f90"
      });
      this.add.text(this.scale.width - 42, y + 22, best ? starsText(best.stars) : "☆☆☆", {
        fontFamily: "Arial Black, Arial",
        fontSize: "18px",
        color: best ? "#ffcf54" : "#46576a"
      }).setOrigin(1, 0);

      if (unlocked) {
        const zone = this.add.zone(this.scale.width / 2, y + 37, this.scale.width - 48, 74).setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          feedback.trigger("uiClick");
          this.scene.start("race", { stageId: stage.id });
        });
      }
    });
  }

  createMenuButton(x, y, label, textureKey, action, fontSize) {
    drawArcadeButton(this, x, y, textureKey);
    const text = this.add.text(x + (textureKey === "buttonStart" ? 24 : 18), y, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: `${fontSize}px`,
      color: "#ffffff",
      stroke: "#06101e",
      strokeThickness: 5
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, 320, textureKey === "buttonStart" ? 72 : 64).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", action);
    return text;
  }
}

class ResultScene extends Phaser.Scene {
  constructor() {
    super("result");
  }

  init(data) {
    this.result = data;
  }

  create() {
    state.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#07111f");
    const { width, height } = this.scale;
    const cleared = this.result.cleared;
    const panel = this.add.graphics();
    panel.fillGradientStyle(0x06101e, 0x06101e, 0x123653, 0x07111f, 1);
    panel.fillRect(0, 0, width, height);
    panel.fillStyle(0x020815, 0.72);
    panel.fillRoundedRect(22, 104, width - 44, 430, 8);
    panel.lineStyle(2, cleared ? 0x42ff9b : 0xff375f, 0.55);
    panel.strokeRoundedRect(22, 104, width - 44, 430, 8);

    this.add.text(width / 2, 128, cleared ? "STAGE CLEAR" : "TRY AGAIN", {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: cleared ? "#42ff9b" : "#ff6b81"
    }).setOrigin(0.5);
    this.add.text(width / 2, 172, cleared ? starsText(this.result.stars) : this.result.reason, {
      fontFamily: "Arial Black, Arial",
      fontSize: cleared ? "34px" : "18px",
      color: cleared ? "#ffcf54" : "#f6fbff"
    }).setOrigin(0.5);

    const lines = [
      `Stage: ${this.result.stageName}`,
      `Score: ${this.result.score}`,
      `Answers: ${this.result.correctAnswers} / ${this.result.totalQuestions}`,
      `Accuracy: ${this.result.accuracy}%`,
      `Best Combo: ${this.result.bestCombo}`,
      `Temp Left: ${this.result.temp}C`,
      `Practice: ${this.result.learningSummary.recommendation}`
    ];
    lines.forEach((line, index) => {
      this.add.text(54, 232 + index * 34, line, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#dff8ff"
      });
    });
    this.add.text(54, 468, `Recent misses: ${this.result.learningSummary.recentWrongKeys.join(", ") || "None yet"}`, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9ee7ff"
    });

    if (cleared && this.result.nextStageId) {
      this.createButton(width / 2, 576, "NEXT STAGE", () => this.scene.start("race", { stageId: this.result.nextStageId }));
      this.createButton(width / 2, 638, "RETRY", () => this.scene.start("race", { stageId: this.result.stageId }));
    } else {
      this.createButton(width / 2, 576, "RETRY", () => this.scene.start("race", { stageId: this.result.stageId }));
    }
    this.createButton(width / 2, 700, "STAGE SELECT", () => this.scene.start("menu"));
  }

  createButton(x, y, label, action) {
    const button = this.add.text(x, y, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: "17px",
      color: "#04101d",
      backgroundColor: "#35d4ff",
      padding: { x: 24, y: 13 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => {
      feedback.trigger("uiClick");
      action();
    });
    return button;
  }
}

class TutorialCompleteScene extends Phaser.Scene {
  constructor() {
    super("tutorialComplete");
  }

  create() {
    this.cameras.main.setBackgroundColor("#07111f");
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x06101e, 0x06101e, 0x123653, 0x07111f, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0x020815, 0.72);
    g.fillRoundedRect(24, 128, width - 48, 360, 8);
    g.lineStyle(2, 0x42ff9b, 0.56);
    g.strokeRoundedRect(24, 128, width - 48, 360, 8);
    this.add.text(width / 2, 166, "Practice Complete!", {
      fontFamily: "Arial Black, Arial",
      fontSize: "27px",
      color: "#42ff9b"
    }).setOrigin(0.5);
    this.add.text(width / 2, 226, "Now try Stage 1.\nYou know how to move,\nsolve, boost, and jump.", {
      fontFamily: "Arial Black, Arial",
      fontSize: "19px",
      color: "#f6fbff",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);
    this.createButton(width / 2, 356, "START STAGE 1", () => this.scene.start("race", { stageId: 1 }));
    this.createButton(width / 2, 424, "PRACTICE AGAIN", () => this.scene.start("race", { mode: "tutorial" }), true);
    this.createButton(width / 2, 566, "STAGE SELECT", () => this.scene.start("menu"), true);
  }

  createButton(x, y, label, action, secondary = false) {
    return this.add.text(x, y, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: "16px",
      color: secondary ? "#dff8ff" : "#04101d",
      backgroundColor: secondary ? "rgba(4,12,24,0.76)" : "#35d4ff",
      padding: { x: 22, y: 13 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      feedback.trigger("uiClick");
      action();
    });
  }
}

class RaceScene extends Phaser.Scene {
  constructor() {
    super("race");
    this.lane = 1;
    this.gates = [];
    this.trackLines = [];
    this.snow = [];
    this.props = [];
    this.speedLines = [];
    this.spawnTimer = 0;
    this.jumpLocked = false;
    this.jumpCooldown = 0;
    this.jumpWasReady = true;
    this.inputMode = "race";
    this.activeTouches = {
      left: new Set(),
      right: new Set(),
      jump: new Set()
    };
    this.pointerZones = new Map();
    this.lastTouchMoveAt = 0;
    this.fpsSample = 60;
    this.lastFrameDelta = 16.7;
    this.swStatus = "checking";
    this.ended = false;
  }

  init(data) {
    if (data?.mode === "tutorial") {
      resetTutorialRun();
      this.ended = false;
      return;
    }
    const requested = Number(data?.stageId || 1);
    const unlocked = loadProgress().unlockedStage;
    const stageId = Math.min(Math.max(1, requested), unlocked);
    resetRun(STAGES.find((stage) => stage.id === stageId) || STAGES[0]);
    this.ended = false;
  }

  create() {
    this.cameras.main.setBackgroundColor("#07111f");
    this.setInputMode(state.mode === "tutorial" ? "tutorial" : "race");
    this.createWorld();
    this.createRider();
    this.createHud();
    this.createTutorialHud();
    this.createInput();
    this.createDebugTouchOverlay();
    this.createDebugPerfOverlay();
    this.createGatePair(true);
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      if (this.settingsClosedHandler) window.removeEventListener("math-downhill-settings-closed", this.settingsClosedHandler);
      if (this.performanceChangedHandler) window.removeEventListener("math-downhill-performance-settings-changed", this.performanceChangedHandler);
    });
    this.registerPwa();
  }

  createWorld() {
    this.trackLines = [];
    this.snow = [];
    this.props = [];
    this.speedLines = [];
    this.sky = this.add.graphics();
    this.mountainBack = this.add.graphics();
    this.track = this.add.graphics();
    this.trackFx = this.add.graphics();
    this.riderFx = this.add.graphics().setDepth(16);
    this.feedbackFx = this.add.graphics().setDepth(70);
    this.speedFx = this.add.graphics().setDepth(18);

    for (let i = 0; i < 30; i += 1) {
      const line = this.add.rectangle(0, 0, 86, 2, 0xe8f6ff, 0.2).setOrigin(0.5).setDepth(4);
      this.trackLines.push(line);
    }

    const lowEffects = state.performance.lowEffectsMode;
    const snowCount = lowEffects ? 22 : 46;
    const propCount = lowEffects ? 10 : 18;
    const speedLineCount = lowEffects ? 8 : 18;

    for (let i = 0; i < snowCount; i += 1) {
      const flake = this.add.circle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.FloatBetween(1, 2.8),
        0xdff8ff,
        Phaser.Math.FloatBetween(0.18, 0.72)
      ).setDepth(3);
      this.snow.push(flake);
    }

    for (let i = 0; i < propCount; i += 1) {
      const prop = this.hasTexture("pineTree") ? this.add.image(0, 0, "pineTree").setDepth(7) : this.add.graphics().setDepth(7);
      prop.setData("side", i % 2 === 0 ? -1 : 1);
      prop.setData("offset", i * 82);
      prop.setData("kind", i % 6);
      this.props.push(prop);
    }

    for (let i = 0; i < speedLineCount; i += 1) {
      const speedLine = this.add.rectangle(0, 0, 3, 96, 0xffffff, 0).setDepth(65);
      speedLine.setData("side", i % 2 === 0 ? -1 : 1);
      speedLine.setData("offset", i * 57);
      this.speedLines.push(speedLine);
    }

    this.drawWorld();
    this.applyLowEffectsVisibility();
  }

  applyLowEffectsVisibility() {
    const lowEffects = state.performance.lowEffectsMode;
    this.snow.forEach((item, index) => item.setVisible(!lowEffects || index < 22));
    this.props.forEach((item, index) => item.setVisible(!lowEffects || index < 10));
    this.speedLines.forEach((item, index) => item.setVisible(!lowEffects || index < 8));
  }

  drawWorld() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.sky.clear();
    this.sky.fillGradientStyle(0x06101e, 0x06101e, 0x0d2845, 0x07111f, 1);
    this.sky.fillRect(0, 0, width, height);
    this.sky.fillStyle(0xbcefff, 0.8);
    this.sky.fillCircle(width * 0.76, height * 0.12, 32);

    this.mountainBack.clear();
    this.mountainBack.fillStyle(0x183a57, 0.88);
    this.mountainBack.fillTriangle(-40, height * 0.48, width * 0.28, height * 0.14, width * 0.68, height * 0.48);
    this.mountainBack.fillStyle(0x245d78, 0.8);
    this.mountainBack.fillTriangle(width * 0.1, height * 0.5, width * 0.7, height * 0.1, width + 70, height * 0.5);
    this.mountainBack.fillStyle(0xe8f6ff, 0.92);
    this.mountainBack.fillTriangle(width * 0.22, height * 0.2, width * 0.28, height * 0.14, width * 0.37, height * 0.24);
    this.mountainBack.fillTriangle(width * 0.62, height * 0.16, width * 0.7, height * 0.1, width * 0.8, height * 0.22);

    this.track.clear();
    this.track.fillStyle(0x11263a, 1);
    this.track.beginPath();
    this.track.moveTo(cx - 52, height * 0.42);
    this.track.lineTo(cx + 52, height * 0.42);
    this.track.lineTo(width + 76, height);
    this.track.lineTo(-76, height);
    this.track.closePath();
    this.track.fillPath();

    this.track.lineStyle(2, 0x7ee8ff, 0.26);
    for (let i = -1; i <= 1; i += 1) {
      this.track.lineBetween(cx + i * 34, height * 0.43, cx + i * 116, height);
    }

    this.track.lineStyle(4, 0xfff4b8, 0.44);
    this.track.lineBetween(cx - 74, height * 0.47, -20, height * 0.85);
    this.track.lineBetween(cx + 74, height * 0.47, width + 20, height * 0.85);
  }

  createRider() {
    const { width, height } = this.scale;
    this.rider = this.add.container(width / 2, height * 0.76).setDepth(20);
    this.flame = this.hasTexture("boostFlame") ? this.add.image(-62, 28, "boostFlame").setDisplaySize(46, 72).setAlpha(0) : this.add.graphics();
    this.shadow = this.hasTexture("bikeShadow")
      ? this.add.image(0, 58, "bikeShadow").setDisplaySize(100, 25).setAlpha(0.78)
      : this.add.ellipse(0, 58, 92, 20, 0x000000, 0.34);
    this.riderSprite = this.hasTexture("rider") ? this.add.image(0, 0, "rider").setDisplaySize(146, 122) : null;
    this.bike = this.riderSprite ? null : this.add.graphics();
    this.body = this.riderSprite ? null : this.add.graphics();
    this.rider.add([this.flame, this.shadow, this.riderSprite, this.bike, this.body].filter(Boolean));
    this.drawRider(0);
  }

  drawRider(lean) {
    if (this.riderSprite) {
      const key = state.jumping ? "riderJump" : state.boost > 8 || state.boostPulse > 0 ? "riderBoost" : "rider";
      if (this.hasTexture(key) && this.riderSprite.texture.key !== key) this.riderSprite.setTexture(key);
      this.riderSprite.setAngle(lean * 5);
      return;
    }
    this.bike.clear();
    this.body.clear();
    const leanOffset = lean * 12;
    this.bike.lineStyle(5, 0xdff8ff, 1);
    this.bike.strokeCircle(-30, 36, 20);
    this.bike.strokeCircle(34, 36, 20);
    this.bike.lineBetween(-30, 36, 2, 4);
    this.bike.lineBetween(2, 4, 34, 36);
    this.bike.lineBetween(-30, 36, 34, 36);
    this.bike.lineStyle(4, 0x35d4ff, 1);
    this.bike.lineBetween(2, 4, 20, -16);

    this.body.fillStyle(0xffffff, 1);
    this.body.fillCircle(3 + leanOffset, -48, 15);
    this.body.fillStyle(0x101828, 1);
    this.body.fillRect(-14 + leanOffset, -51, 34, 10);
    this.body.fillStyle(0xff375f, 1);
    this.body.fillRoundedRect(-20 + leanOffset, -34, 42, 38, 10);
    this.body.fillStyle(0x2ee88f, 1);
    this.body.fillRect(-16 + leanOffset, -27, 34, 5);
    this.body.fillStyle(0xffd43b, 1);
    this.body.fillRect(-16 + leanOffset, -19, 34, 5);
    this.body.fillStyle(0x35d4ff, 1);
    this.body.fillRect(-16 + leanOffset, -11, 34, 5);
    this.body.lineStyle(6, 0xffffff, 1);
    this.body.lineBetween(-16 + leanOffset, -2, -44 + leanOffset, 20);
    this.body.lineBetween(16 + leanOffset, -2, 42 + leanOffset, 20);
    this.body.lineBetween(-8 + leanOffset, 2, -22 + leanOffset, 36);
    this.body.lineBetween(12 + leanOffset, 2, 24 + leanOffset, 36);
  }

  createHud() {
    this.hud = this.add.container(0, 0).setDepth(80);
    this.hudBg = this.add.graphics();
    this.rpm = this.add.graphics();
    this.dashCluster = this.add.graphics();
    this.problemPanel = this.hasTexture("problemBanner")
      ? this.add.image(this.scale.width / 2, 104, "problemBanner").setDisplaySize(this.scale.width - 24, 98).setAlpha(0.96)
      : null;
    this.hudPanel = this.hasTexture("speedometerPanel")
      ? this.add.image(this.scale.width / 2, this.scale.height - 104, "speedometerPanel").setDisplaySize(this.scale.width - 16, 132).setAlpha(0.92)
      : null;
    this.boostIcon = this.hasTexture("boostIcon") ? this.add.image(34, 142, "boostIcon").setDisplaySize(18, 18) : null;
    this.tempIcon = this.hasTexture("tempIcon") ? this.add.image(this.scale.width - 166, 105, "tempIcon").setDisplaySize(16, 16) : null;
    this.hud.add([this.problemPanel, this.hudPanel, this.hudBg, this.rpm, this.dashCluster, this.boostIcon, this.tempIcon].filter(Boolean));

    this.speedText = this.add.text(this.scale.width / 2, this.scale.height - 124, "064", {
      fontFamily: "Arial Black, Arial",
      fontSize: "54px",
      color: "#f6fbff"
    }).setOrigin(0.5);
    this.speedUnit = this.add.text(this.scale.width / 2, this.scale.height - 82, "KM/H", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#7ee8ff"
    }).setOrigin(0.5);
    this.questionText = this.add.text(this.scale.width / 2, 78, "PASS THE ANSWER GATE", {
      fontFamily: "Arial Black, Arial",
      fontSize: "25px",
      color: "#eef8ff",
      stroke: "#020815",
      strokeThickness: 6,
      align: "center"
    }).setOrigin(0.5, 0);
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height - 52, "BOOST READY", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#35d4ff"
    }).setOrigin(0.5, 0);
    this.scoreText = this.add.text(this.scale.width - 22, 24, "0", {
      fontFamily: "Arial Black, Arial",
      fontSize: "27px",
      color: "#ffffff"
    }).setOrigin(1, 0);
    this.comboText = this.add.text(22, this.scale.height - 146, "COMBO x0", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffcf54"
    }).setOrigin(0, 0);
    this.tempText = this.add.text(this.scale.width - 22, this.scale.height - 146, "TEMP 62C", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#9ee7ff"
    }).setOrigin(1, 0);
    this.clusterText = this.add.text(this.scale.width - 22, this.scale.height - 174, "RPM\nBOOST 00\nTEMP 62", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#dff8ff",
      align: "right"
    }).setOrigin(1, 0);
    this.settingsButton = this.add.text(22, this.scale.height - 48, "SET", {
      fontFamily: "Arial Black, Arial",
      fontSize: "13px",
      color: "#ffffff",
      backgroundColor: "rgba(4,12,24,0.76)",
      padding: { x: 12, y: 12 }
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    this.jumpButtonArt = this.hasTexture("jumpButtonArt")
      ? this.add.image(this.scale.width - 58, this.scale.height - 64, "jumpButtonArt").setDisplaySize(78, 78)
      : null;
    this.jumpButton = this.add.text(this.scale.width - 58, this.scale.height - 64, "JUMP", {
      fontFamily: "Arial Black, Arial",
      fontSize: "14px",
      color: "#07111f",
      stroke: "#fff4b8",
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.hud.add([
      this.speedText,
      this.speedUnit,
      this.questionText,
      this.statusText,
      this.scoreText,
      this.comboText,
      this.tempText,
      this.clusterText,
      this.settingsButton,
      this.jumpButtonArt,
      this.jumpButton
    ].filter(Boolean));

    this.settingsButton.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
      feedback.unlock();
      feedback.trigger("uiClick");
      settingsPanel.classList.toggle("is-open");
      this.setInputMode(settingsPanel.classList.contains("is-open") ? "menu" : state.mode === "tutorial" ? "tutorial" : "race");
      this.clearActiveTouches();
    });
    this.jumpButton.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
      this.handlePointerDown(pointer);
    });
    this.stageText = this.add.text(24, 156, `STAGE ${state.stage.id}  ${state.stage.name}`, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#dff8ff",
      backgroundColor: "rgba(2,8,21,0.5)",
      padding: { x: 8, y: 5 }
    }).setDepth(82);
    this.distanceText = this.add.text(this.scale.width - 24, 156, "0m", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#dff8ff",
      backgroundColor: "rgba(2,8,21,0.5)",
      padding: { x: 8, y: 5 }
    }).setOrigin(1, 0).setDepth(82);
    this.drawHud();
  }

  createTutorialHud() {
    this.tutorialText = this.add.text(this.scale.width / 2, 198, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "19px",
      color: "#ffffff",
      stroke: "#07111f",
      strokeThickness: 6,
      align: "center",
      wordWrap: { width: this.scale.width - 44 }
    }).setOrigin(0.5, 0).setDepth(92);
    if (state.mode === "tutorial") this.setTutorialStep(1);
  }

  drawHud() {
    const { width, height } = this.scale;
    const hudColor = this.getHudColor();
    const tempColor = this.getTempColor();
    const rpmValue = Phaser.Math.Clamp((state.speed - 50) / 160, 0, 1);

    this.hudBg.clear();
    this.hudBg.fillStyle(0x020815, 0.42);
    this.hudBg.fillRoundedRect(18, 54, width - 36, 96, 8);
    this.hudBg.lineStyle(2, hudColor, 0.45 + state.hudPulse * 0.28);
    this.hudBg.strokeRoundedRect(18, 54, width - 36, 96, 8);
    this.hudBg.fillStyle(0x020815, 0.7);
    this.hudBg.fillRoundedRect(10, height - 164, width - 20, 142, 10);
    this.hudBg.lineStyle(2, hudColor, 0.42);
    this.hudBg.strokeRoundedRect(10, height - 164, width - 20, 142, 10);

    this.hudBg.fillStyle(0x0a2034, 0.94);
    this.hudBg.fillRoundedRect(24, height - 44, width - 48, 6, 3);
    this.hudBg.fillStyle(hudColor, 0.95);
    this.hudBg.fillRoundedRect(24, height - 44, Math.max(12, (width - 48) * (state.boost / 100)), 6, 3);

    this.hudBg.fillStyle(0x0a2034, 0.9);
    this.hudBg.fillRoundedRect(width - 156, height - 126, 132, 7, 3);
    this.hudBg.fillStyle(tempColor, 0.92);
    this.hudBg.fillRoundedRect(width - 156, height - 126, 132 * Phaser.Math.Clamp(state.grillTemp / 100, 0, 1), 7, 3);

    this.rpm.clear();
    const rpmX = width / 2;
    const rpmY = height - 88;
    this.rpm.lineStyle(7, 0x17364b, 0.95);
    this.rpm.beginPath();
    this.rpm.arc(rpmX, rpmY, 36, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335), false);
    this.rpm.strokePath();
    this.rpm.lineStyle(7, hudColor, 0.95);
    this.rpm.beginPath();
    this.rpm.arc(rpmX, rpmY, 36, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(205 + 130 * rpmValue), false);
    this.rpm.strokePath();

    const clusterX = width - 78;
    const clusterY = height - 88;
    this.dashCluster.clear();
    this.dashCluster.fillStyle(0x020815, 0.62);
    this.dashCluster.fillRoundedRect(width - 142, height - 148, 120, 104, 8);
    this.dashCluster.lineStyle(2, hudColor, 0.36);
    this.dashCluster.strokeRoundedRect(width - 142, height - 148, 120, 104, 8);
    this.dashCluster.lineStyle(6, 0x17364b, 0.95);
    this.dashCluster.beginPath();
    this.dashCluster.arc(clusterX, clusterY, 40, Phaser.Math.DegToRad(198), Phaser.Math.DegToRad(342), false);
    this.dashCluster.strokePath();
    this.dashCluster.lineStyle(6, hudColor, 0.98);
    this.dashCluster.beginPath();
    this.dashCluster.arc(clusterX, clusterY, 40, Phaser.Math.DegToRad(198), Phaser.Math.DegToRad(198 + 144 * rpmValue), false);
    this.dashCluster.strokePath();
    this.dashCluster.fillStyle(0x0a2034, 0.95);
    this.dashCluster.fillRoundedRect(width - 126, height - 82, 88, 5, 3);
    this.dashCluster.fillStyle(0xff7a18, 0.95);
    this.dashCluster.fillRoundedRect(width - 126, height - 82, 88 * (state.boost / 100), 5, 3);
    this.dashCluster.fillStyle(0x0a2034, 0.95);
    this.dashCluster.fillRoundedRect(width - 126, height - 70, 88, 5, 3);
    this.dashCluster.fillStyle(tempColor, 0.95);
    this.dashCluster.fillRoundedRect(width - 126, height - 70, 88 * Phaser.Math.Clamp(state.grillTemp / 100, 0, 1), 5, 3);

    this.speedText.setPosition(width / 2, height - 124);
    this.speedUnit.setPosition(width / 2, height - 82);
    this.speedText.setColor(colorToCss(hudColor));
    this.speedUnit.setColor(colorToCss(hudColor));
    this.statusText.setColor(colorToCss(hudColor));
    this.tempText.setColor(colorToCss(tempColor));
    this.scoreText.setX(width - 22);
    this.comboText.setPosition(22, height - 146);
    this.tempText.setPosition(width - 22, height - 146);
    this.clusterText.setPosition(width - 32, height - 138);
    this.questionText.setX(width / 2);
    this.statusText.setPosition(width / 2, height - 52);
    this.settingsButton.setPosition(22, height - 48);
    const jumpPos = this.getJumpButtonPosition();
    const jumpReady = !state.jumping && !this.jumpLocked && this.jumpCooldown <= 0;
    if (jumpReady && !this.jumpWasReady) {
      const targets = [this.jumpButton, this.jumpButtonArt].filter(Boolean);
      this.tweens.add({ targets, scale: 1.08, duration: 150, yoyo: true, ease: "Sine.easeOut" });
    }
    this.jumpWasReady = jumpReady;
    this.jumpButtonArt?.setPosition(jumpPos.x, jumpPos.y).setDisplaySize(JUMP_ZONE_SIZE, JUMP_ZONE_SIZE);
    this.jumpButtonArt?.setAlpha(jumpReady ? 1 : 0.54);
    this.jumpButton.setPosition(jumpPos.x, jumpPos.y);
    this.jumpButton.setAlpha(jumpReady ? 1 : 0.58);
    this.jumpButton.setColor(jumpReady ? "#07111f" : "#9fb7c8");
    this.distanceText?.setX(width - 24);
    this.problemPanel?.setPosition(width / 2, 104).setDisplaySize(width - 24, 98);
    this.hudPanel?.setPosition(width / 2, height - 104).setDisplaySize(width - 16, 132);
    this.boostIcon?.setPosition(34, height - 42);
    this.tempIcon?.setPosition(width - 166, height - 123);
  }

  getHudColor() {
    if (state.hudMode === "correct") return 0x42ff9b;
    if (state.hudMode === "boost") return 0xff7a18;
    if (state.grillTemp < 28) return 0x9ee7ff;
    if (state.grillTemp > 86) return 0xff375f;
    return 0x35d4ff;
  }

  getTempColor() {
    if (state.grillTemp < 28) return 0x9ee7ff;
    if (state.grillTemp > 86) return 0xff375f;
    return 0xffcf54;
  }

  createInput() {
    this.settingsClosedHandler = () => this.setInputMode(state.mode === "tutorial" ? "tutorial" : "race");
    this.performanceChangedHandler = () => {
      this.applyLowEffectsVisibility();
      this.updateDebugPerfOverlay(this.lastFrameDelta);
    };
    window.addEventListener("math-downhill-settings-closed", this.settingsClosedHandler);
    window.addEventListener("math-downhill-performance-settings-changed", this.performanceChangedHandler);
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.input.on("pointerup", (pointer) => this.handlePointerUp(pointer));
    this.input.on("pointercancel", (pointer) => this.handlePointerCancel(pointer));
    this.input.on("pointerout", (pointer) => this.handlePointerCancel(pointer));
    this.input.keyboard?.on("keydown-LEFT", () => {
      feedback.unlock();
      if (this.isRaceInputEnabled()) this.setLane(this.lane - 1);
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      feedback.unlock();
      if (this.isRaceInputEnabled()) this.setLane(this.lane + 1);
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      feedback.unlock();
      if (this.isRaceInputEnabled()) this.triggerJump(false);
    });
    this.input.keyboard?.on("keyup", () => this.clearActiveTouches());
  }

  setInputMode(mode) {
    this.inputMode = mode;
    if (mode !== "race" && mode !== "tutorial") this.clearActiveTouches();
    this.updateDebugTouchOverlay?.();
  }

  isRaceInputEnabled() {
    return !this.ended
      && !settingsPanel.classList.contains("is-open")
      && (this.inputMode === "race" || this.inputMode === "tutorial");
  }

  handlePointerDown(pointer) {
    feedback.unlock();
    if (!this.isRaceInputEnabled()) return;
    const zone = this.getPointerZone(pointer);
    if (!zone) return;
    this.pointerZones.set(pointer.id, zone);
    this.activeTouches[zone]?.add(pointer.id);
    if (zone === "jump") {
      this.triggerJump(false);
    } else {
      this.moveFromTouchZone(zone, pointer.time || this.time.now, true);
    }
    this.updateDebugTouchOverlay();
  }

  handlePointerUp(pointer) {
    this.releasePointer(pointer.id);
  }

  handlePointerCancel(pointer) {
    this.releasePointer(pointer.id);
  }

  releasePointer(pointerId) {
    const zone = this.pointerZones.get(pointerId);
    if (zone) this.activeTouches[zone]?.delete(pointerId);
    this.pointerZones.delete(pointerId);
    this.updateDebugTouchOverlay();
  }

  clearActiveTouches() {
    this.activeTouches.left.clear();
    this.activeTouches.right.clear();
    this.activeTouches.jump.clear();
    this.pointerZones.clear();
    this.updateDebugTouchOverlay?.();
  }

  getPointerZone(pointer) {
    const { width, height } = this.scale;
    const bottomSafe = this.getSafeBottom();
    const jumpCenter = this.getJumpButtonPosition();
    const dx = pointer.x - jumpCenter.x;
    const dy = pointer.y - jumpCenter.y;
    if (Math.hypot(dx, dy) <= JUMP_ZONE_SIZE * 0.58 || (pointer.x > width - 124 && pointer.y > height - 156 - bottomSafe)) return "jump";
    if (pointer.y < TOUCH_TOP_DEAD_ZONE || pointer.y > height - 176 - bottomSafe) return null;
    if (pointer.x < width * 0.42) return "left";
    if (pointer.x > width * 0.58) return "right";
    return null;
  }

  moveFromTouchZone(zone, time, force = false) {
    if (!force && time - this.lastTouchMoveAt < TOUCH_REPEAT_MS) return;
    this.lastTouchMoveAt = time;
    this.setLane(this.lane + (zone === "left" ? -1 : 1));
  }

  updateTouchInput(time) {
    if (!this.isRaceInputEnabled()) return;
    if (this.activeTouches.left.size > 0 && this.activeTouches.right.size === 0) this.moveFromTouchZone("left", time);
    if (this.activeTouches.right.size > 0 && this.activeTouches.left.size === 0) this.moveFromTouchZone("right", time);
  }

  getSafeBottom() {
    return SAFE_BOTTOM_FALLBACK;
  }

  getJumpButtonPosition() {
    const bottomSafe = this.getSafeBottom();
    return {
      x: this.scale.width - 62,
      y: this.scale.height - 72 - bottomSafe
    };
  }

  createDebugTouchOverlay() {
    if (!DEBUG_TOUCH_ENABLED) return;
    this.debugTouchGraphics = this.add.graphics().setDepth(120);
    this.debugTouchText = this.add.text(12, this.scale.height - 220, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#dff8ff",
      backgroundColor: "rgba(2,8,21,0.72)",
      padding: { x: 8, y: 6 }
    }).setDepth(121);
    this.updateDebugTouchOverlay();
  }

  updateDebugTouchOverlay() {
    if (!this.debugTouchGraphics || !this.debugTouchText) return;
    const { width, height } = this.scale;
    const bottomSafe = this.getSafeBottom();
    const jumpPos = this.getJumpButtonPosition();
    const activeCount = this.activeTouches.left.size + this.activeTouches.right.size + this.activeTouches.jump.size;
    this.debugTouchGraphics.clear();
    this.debugTouchGraphics.fillStyle(0x35d4ff, 0.12);
    this.debugTouchGraphics.fillRect(0, TOUCH_TOP_DEAD_ZONE, width * 0.42, height - TOUCH_TOP_DEAD_ZONE - 176 - bottomSafe);
    this.debugTouchGraphics.fillStyle(0xffcf54, 0.12);
    this.debugTouchGraphics.fillRect(width * 0.58, TOUCH_TOP_DEAD_ZONE, width * 0.42, height - TOUCH_TOP_DEAD_ZONE - 176 - bottomSafe);
    this.debugTouchGraphics.lineStyle(3, 0xff7a18, 0.7);
    this.debugTouchGraphics.strokeCircle(jumpPos.x, jumpPos.y, JUMP_ZONE_SIZE * 0.58);
    this.debugTouchGraphics.lineStyle(1, 0xdff8ff, 0.35);
    this.debugTouchGraphics.lineBetween(width * 0.42, TOUCH_TOP_DEAD_ZONE, width * 0.42, height - 176 - bottomSafe);
    this.debugTouchGraphics.lineBetween(width * 0.58, TOUCH_TOP_DEAD_ZONE, width * 0.58, height - 176 - bottomSafe);
    this.debugTouchText
      .setPosition(12, height - 220 - bottomSafe)
      .setText(`debugTouch=1\nmode: ${this.inputMode}\nLEFT ${this.activeTouches.left.size}  RIGHT ${this.activeTouches.right.size}  JUMP ${this.activeTouches.jump.size}\nactive pointers: ${activeCount}`);
  }

  createDebugPerfOverlay() {
    if (!DEBUG_PERF_ENABLED) return;
    this.debugPerfText = this.add.text(this.scale.width - 12, DEBUG_TOUCH_ENABLED ? 180 : 12, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#fff4b8",
      backgroundColor: "rgba(2,8,21,0.72)",
      padding: { x: 8, y: 6 },
      align: "right"
    }).setOrigin(1, 0).setDepth(122);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration?.().then((registration) => {
        this.swStatus = registration ? "registered" : "not registered";
      }).catch(() => {
        this.swStatus = "unavailable";
      });
    } else {
      this.swStatus = "unsupported";
    }
    this.updateDebugPerfOverlay(0);
  }

  updateDebugPerfOverlay(delta) {
    if (!this.debugPerfText) return;
    this.lastFrameDelta = delta || this.lastFrameDelta;
    const instantFps = delta > 0 ? 1000 / delta : this.fpsSample;
    this.fpsSample = Phaser.Math.Linear(this.fpsSample, instantFps, 0.12);
    const activeObjects = this.children?.list?.length || 0;
    const assetMode = this.riderSprite ? "sprite" : "fallback";
    this.debugPerfText
      .setPosition(this.scale.width - 12, DEBUG_TOUCH_ENABLED ? 180 : 12)
      .setText([
        "debugPerf=1",
        `FPS ${Math.round(this.fpsSample)}`,
        `delta ${this.lastFrameDelta.toFixed(1)}ms`,
        `objects ${activeObjects}`,
        `input ${this.inputMode}`,
        `assets ${assetMode}`,
        `lowFx ${state.performance.lowEffectsMode}`,
        `sw ${this.swStatus}`
      ].join("\n"));
  }

  setLane(nextLane) {
    this.lane = Phaser.Math.Clamp(nextLane, 0, DESIGN.laneCount - 1);
    this.tweens.add({
      targets: this.rider,
      x: this.laneToX(this.lane),
      duration: 140,
      ease: "Sine.easeOut"
    });
    this.drawRider(this.lane - 1);
    if (state.mode === "tutorial" && state.tutorialStep === 1) {
      state.tutorialMoves += 1;
      this.flashText("Good!", 0x42ff9b);
      if (state.tutorialMoves >= 2) {
        this.setTutorialStep(2);
        this.gates.forEach((gate) => gate.destroy());
        this.gates = [];
        this.createGatePair(true);
      }
    }
  }

  laneToX(lane) {
    return this.scale.width / 2 + (lane - 1) * Math.min(DESIGN.laneWidth, this.scale.width * 0.24);
  }

  createGatePair(initial = false) {
    state.learningStats = loadLearningStats();
    const problem = state.mode === "tutorial"
      ? createTutorialProblem(state.tutorialStep)
      : generateProblem({
      operations: state.operations,
      stageId: state.stage.id,
      learningStats: state.learningStats
    });
    this.currentProblem = problem;
    this.questionText.setText(problem.text);

    for (let lane = 0; lane < 3; lane += 1) {
      const isAnswerLane = lane === 0 || lane === 2;
      const value = isAnswerLane ? problem.choices[lane === 0 ? 0 : 1] : "BOOST";
      const gate = this.add.container(this.laneToX(lane), initial ? this.scale.height * 0.45 : -90).setDepth(12);
      gate.setData("lane", lane);
      gate.setData("value", value);
      gate.setData("isBoost", value === "BOOST");
      gate.setData("isCorrect", value === problem.answer);
      gate.setSize(78, 82);
      const gateArt = this.hasTexture("mathGateFrame") ? this.add.image(0, 0, "mathGateFrame").setDisplaySize(98, 108) : null;
      const frame = this.add.graphics();
      const label = this.add.text(0, 0, String(value), {
        fontFamily: "Arial Black, Arial",
        fontSize: value === "BOOST" ? "15px" : "25px",
        color: value === "BOOST" ? "#04101d" : "#eef8ff"
      }).setOrigin(0.5);
      gate.add([gateArt, frame, label].filter(Boolean));
      gate.gateArt = gateArt;
      gate.frame = frame;
      gate.label = label;
      this.gates.push(gate);
      this.drawGate(gate, value === "BOOST");
    }
  }

  drawGate(gate, isBoost) {
    gate.frame.clear();
    const color = isBoost ? 0xffcf54 : gate.getData("isCorrect") ? 0x35d4ff : 0xff7a18;
    if (gate.gateArt) gate.gateArt.setTint(color).setAlpha(isBoost ? 0.92 : 0.78);
    gate.frame.lineStyle(5, color, 0.9);
    gate.frame.strokeRoundedRect(-44, -48, 88, 96, 10);
    gate.frame.fillStyle(isBoost ? 0xffcf54 : 0x020815, isBoost ? 0.2 : 0.34);
    gate.frame.fillRoundedRect(-38, -40, 76, 80, 8);
    gate.frame.lineStyle(1, 0xffffff, 0.28);
    gate.frame.lineBetween(-26, 0, 26, 0);
  }

  update(time, delta) {
    if (this.ended) return;
    const dt = delta / 1000;
    this.updateTouchInput(time);
    state.boost = Math.max(0, state.boost - delta * (state.mode === "tutorial" ? 0.004 : 0.0085));
    this.jumpCooldown = Math.max(0, this.jumpCooldown - delta);
    state.speedKick = Math.max(0, state.speedKick - delta * 0.05);
    state.hudPulse = Math.max(0, state.hudPulse - dt * 2.6);
    state.warningPulse = Math.max(0, state.warningPulse - dt * 2.2);
    state.flashPulse = Math.max(0, state.flashPulse - dt * 3.6);
    state.boostPulse = Math.max(0, state.boostPulse - dt * 1.4);
    if (state.hudPulse <= 0 && state.boostPulse <= 0) state.hudMode = "normal";

    const speedFactor = state.mode === "tutorial" ? 0.74 + state.boost / 120 : 1 + state.boost / 82 + state.speedKick / 110 + (state.stage.id - 1) * 0.035;
    const targetSpeed = state.mode === "tutorial" ? 48 + state.boost * 0.45 : state.stage.baseSpeed + 22 + state.combo * 5 + state.boost * 0.92 + state.speedKick;
    state.speed = Phaser.Math.Linear(state.speed, targetSpeed, 0.055);
    state.distance = Math.min(state.stage.targetDistance, state.distance + delta * 0.036 * speedFactor);

    this.updateTerrain(time, delta, speedFactor);
    this.updateGates(delta, speedFactor);
    this.updateEffects(time, delta, speedFactor);
    this.updateHud();
    this.updateDebugTouchOverlay();
    this.updateDebugPerfOverlay(delta);

    if (state.mode === "tutorial") {
      return;
    }

    if (state.distance >= state.stage.targetDistance) {
      this.finishRun(true, "Stage complete");
    } else if (state.grillTemp <= 0) {
      this.finishRun(false, "Temperature dropped too low");
    } else if (state.grillTemp >= OVERHEAT_LIMIT) {
      this.finishRun(false, "Grill overheated");
    }
  }

  updateTerrain(time, delta, speedFactor) {
    const { width, height } = this.scale;
    this.trackLines.forEach((line, index) => {
      const phase = (time * 0.16 * speedFactor + index * 66) % (height * 0.62);
      const y = height * 0.42 + phase;
      const depth = Phaser.Math.Clamp((y - height * 0.42) / (height * 0.58), 0, 1);
      line.setPosition(width / 2 + Math.sin(index * 1.7) * depth * 90, y);
      line.setScale(0.28 + depth * 2.05, 1);
      line.setAlpha(0.08 + depth * 0.36 + state.boost / 360);
    });

    this.snow.forEach((flake, index) => {
      if (!flake.visible) return;
      flake.y += delta * (0.035 + index * 0.0015) * speedFactor;
      flake.x += Math.sin(time * 0.002 + index) * 0.45;
      if (flake.y > height + 12) {
        flake.y = -12;
        flake.x = Phaser.Math.Between(0, width);
      }
      flake.setAlpha(0.2 + Math.min(0.65, speedFactor * 0.12));
    });

    this.props.forEach((prop, index) => {
      if (!prop.visible) return;
      const side = prop.getData("side");
      const phase = (time * 0.13 * speedFactor + prop.getData("offset")) % (height * 0.74);
      const y = height * 0.36 + phase;
      const depth = Phaser.Math.Clamp((y - height * 0.36) / (height * 0.64), 0, 1);
      const x = width / 2 + side * (62 + depth * width * 0.66);
      this.drawCourseProp(prop, x, y, depth, side, index);
    });
  }

  drawCourseProp(prop, x, y, depth, side, index) {
    prop.setPosition(x, y);
    const kind = prop.getData("kind");
    if (prop.setTexture && this.hasTexture("pineTree")) {
      const keys = ["pineTree", "courseFlag", "snowBank", "rock", "courseArrow", "courseFence"];
      const key = keys[kind] || "pineTree";
      prop.setTexture(key);
      prop.setScale((key === "courseFence" ? 0.18 : 0.25) + depth * (key === "courseFence" ? 0.62 : 0.92));
      prop.setAlpha(0.82 + depth * 0.18);
      prop.setFlipX(side < 0);
      return;
    }

    prop.clear();
    prop.setScale(0.35 + depth * 1.35);
    if (kind === 0) {
      prop.fillStyle(0x0b3a2c, 0.92);
      prop.fillTriangle(0, -36, -18, 16, 18, 16);
      prop.fillStyle(0x5c3b1f, 0.95);
      prop.fillRect(-4, 12, 8, 30);
    } else if (kind === 1) {
      prop.lineStyle(4, 0xf8fbff, 0.92);
      prop.lineBetween(0, -30, 0, 30);
      prop.fillStyle(index % 2 === 0 ? 0xff375f : 0x35d4ff, 0.92);
      prop.fillTriangle(0, -30, side * 30, -20, 0, -8);
    } else {
      prop.lineStyle(4, 0xfff4b8, 0.7);
      prop.lineBetween(side * -52, 0, side * 42, 18);
      prop.lineStyle(2, 0xff375f, 0.55);
      prop.lineBetween(side * -52, -8, side * 42, 10);
    }
  }

  updateGates(delta, speedFactor) {
    for (let i = this.gates.length - 1; i >= 0; i -= 1) {
      const gate = this.gates[i];
      gate.y += delta * 0.285 * speedFactor;
      const depth = Phaser.Math.Clamp(gate.y / this.scale.height, 0.2, 1.2);
      gate.setScale(depth);

      if (this.isGateInCatchWindow(gate)) {
        this.resolveGate(gate);
        return;
      }

      if (gate.y > this.scale.height + 120) {
        if (state.jumping && gate.getData("isBoost")) this.applyAirBonus();
        gate.destroy();
        this.gates.splice(i, 1);
      }
    }

    this.spawnTimer -= delta;
    if (this.gates.length === 0 || this.spawnTimer <= 0) {
      this.createGatePair();
      this.spawnTimer = Math.max(940, (1650 - state.combo * 45 - state.boost * 4) / state.stage.gateRate);
    }
  }

  isGateInCatchWindow(gate) {
    const { width, height } = this.scale;
    const yMin = height * 0.68;
    const yMax = height * 0.88;
    if (gate.y < yMin || gate.y > yMax) return false;
    const targetX = this.laneToX(gate.getData("lane"));
    const riderX = this.rider?.x ?? this.laneToX(this.lane);
    const forgivingWidth = Math.min(DESIGN.laneWidth * 0.72, width * 0.24);
    return Math.abs(riderX - targetX) <= forgivingWidth || gate.getData("lane") === this.lane;
  }

  resolveGate(gate) {
    const value = gate.getData("value");
    if (gate.getData("isBoost")) {
      this.applyBoostReward("BOOST");
    } else if (value === this.currentProblem.answer) {
      this.applyCorrectReward();
    } else {
      this.applyMissPenalty();
    }
    this.gates.forEach((item) => item.destroy());
    this.gates = [];
    this.spawnTimer = 360;
  }

  applyCorrectReward() {
    if (shouldRecordLearningResult(this.currentProblem)) {
      saveLearningStats(updateLearningStats(loadLearningStats(), this.currentProblem, true, state.stage.id));
    }
    state.totalQuestions += 1;
    state.correctAnswers += 1;
    state.score += 120 + state.combo * 28;
    state.combo += 1;
    state.wrongStreak = 0;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.boost = Math.min(100, state.boost + 25);
    state.grillTemp = Math.min(OVERHEAT_LIMIT + 8, state.grillTemp + 5);
    state.speedKick = Math.min(70, state.speedKick + 20);
    state.hudMode = "correct";
    state.hudPulse = 1;
    state.flashPulse = 1;
    feedback.trigger("correct");
    this.flashText("CORRECT!", 0x42ff9b);
    this.bumpCombo();
    this.cameras.main.shake(115, state.performance.lowEffectsMode ? 0.0025 : 0.0045);
    if (state.mode === "tutorial" && state.tutorialStep === 2) {
      this.setTutorialStep(3);
      this.applyBoostReward("BOOST START");
      this.time.delayedCall(1000, () => this.setTutorialStep(4));
    }
    if (state.combo > 0 && state.combo % 3 === 0) this.triggerJump(true);
  }

  applyMissPenalty() {
    if (shouldRecordLearningResult(this.currentProblem)) {
      saveLearningStats(updateLearningStats(loadLearningStats(), this.currentProblem, false, state.stage.id));
    }
    if (state.mode === "tutorial") {
      feedback.trigger("wrong");
      this.flashText("Try again!", 0xffcf54);
      this.gates.forEach((gate) => gate.destroy());
      this.gates = [];
      this.time.delayedCall(420, () => this.createGatePair(true));
      return;
    }
    state.totalQuestions += 1;
    state.combo = 0;
    state.wrongStreak += 1;
    state.boost = Math.max(0, state.boost - 24);
    state.grillTemp = Math.max(0, state.grillTemp - 18);
    state.speed = Math.max(42, state.speed - 24);
    state.speedKick = 0;
    state.hudMode = "cold";
    state.hudPulse = 0.7;
    state.warningPulse = 1;
    feedback.trigger("wrong");
    this.flashText(state.wrongStreak >= 3 ? "CAREFUL!" : "MISS!", 0xff6b81);
    this.cameras.main.shake(170, state.performance.lowEffectsMode ? 0.006 : 0.012);
  }

  applyBoostReward(label) {
    state.boost = Math.min(100, state.boost + 42);
    state.wrongStreak = 0;
    state.grillTemp = Math.min(OVERHEAT_LIMIT + 8, state.grillTemp + 4);
    state.speedKick = Math.min(90, state.speedKick + 34);
    state.hudMode = "boost";
    state.hudPulse = 1;
    state.boostPulse = 1;
    feedback.trigger("boost");
    this.drawRider(this.lane - 1);
    this.flashText(label, 0xffcf54);
    this.cameras.main.shake(150, state.performance.lowEffectsMode ? 0.003 : 0.006);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.045,
      duration: 130,
      yoyo: true,
      ease: "Quad.easeOut"
    });
  }

  applyAirBonus() {
    if (!state.airBonusReady) return;
    state.airBonusReady = false;
    state.score += 75;
    state.boost = Math.min(100, state.boost + 10);
    this.flashText("AIR BONUS", 0xffcf54);
  }

  triggerJump(autoReward) {
    if (!this.isRaceInputEnabled() || state.jumping || this.jumpLocked || this.jumpCooldown > 0) return;
    this.jumpLocked = true;
    this.jumpCooldown = 920;
    state.jumping = true;
    state.airBonusReady = true;
    feedback.trigger("jump");
    this.drawRider(this.lane - 1);
    this.flashText(autoReward ? "COMBO JUMP" : "AIR TIME", 0xffffff);
    if (state.mode === "tutorial" && state.tutorialStep === 4) {
      this.time.delayedCall(420, () => {
        this.flashText("Nice jump!", 0x42ff9b);
        this.finishTutorial();
      });
    }
    this.tweens.add({
      targets: this.rider,
      y: this.scale.height * 0.62,
      scale: 1.14,
      duration: 235,
      ease: "Quad.easeOut",
      onUpdate: () => {
        const lift = Phaser.Math.Clamp((this.scale.height * 0.76 - this.rider.y) / (this.scale.height * 0.14), 0, 1);
        this.shadow.setScale(1 - lift * 0.46, 1 - lift * 0.62);
        this.shadow.setAlpha(0.34 - lift * 0.19);
      },
      onComplete: () => {
        this.tweens.add({
          targets: this.rider,
          y: this.scale.height * 0.76,
          scale: 1,
          duration: 245,
          ease: "Quad.easeIn",
          onUpdate: () => {
            const lift = Phaser.Math.Clamp((this.scale.height * 0.76 - this.rider.y) / (this.scale.height * 0.14), 0, 1);
            this.shadow.setScale(1 - lift * 0.46, 1 - lift * 0.62);
            this.shadow.setAlpha(0.34 - lift * 0.19);
          },
          onComplete: () => this.landJump()
        });
      }
    });
  }

  landJump() {
    state.jumping = false;
    state.airBonusReady = false;
    this.jumpLocked = false;
    this.shadow.setScale(1, 1);
    this.shadow.setAlpha(this.shadow.texture ? 0.78 : 0.34);
    this.drawRider(this.lane - 1);
    feedback.trigger("land");
    this.cameras.main.shake(115, state.performance.lowEffectsMode ? 0.003 : 0.006);
    const ring = this.add.circle(this.rider.x, this.rider.y + 54, 10, 0xffffff, 0).setStrokeStyle(4, 0xdff8ff, 0.8).setDepth(19);
    this.tweens.add({
      targets: ring,
      radius: 72,
      alpha: 0,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => ring.destroy()
    });
  }

  updateEffects(time, delta, speedFactor) {
    const { width, height } = this.scale;
    this.feedbackFx.clear();
    this.speedFx.clear();
    if (this.flame.clear) this.flame.clear();

    if (state.flashPulse > 0) {
      this.feedbackFx.fillStyle(0xffffff, 0.18 * state.flashPulse);
      this.feedbackFx.fillRect(0, 0, width, height);
    }

    if (state.warningPulse > 0) {
      this.feedbackFx.lineStyle(14, 0xff294d, 0.55 * state.warningPulse);
      this.feedbackFx.strokeRect(6, 6, width - 12, height - 12);
    }

    if (state.boost > 5 || state.boostPulse > 0) {
      const flamePower = Math.max(state.boost / 100, state.boostPulse);
      if (this.flame.setAlpha) {
        this.flame.setAlpha(0.55 + flamePower * 0.4);
        this.flame.setScale(0.82 + flamePower * 0.35, 0.9 + Math.sin(time * 0.025) * 0.08);
      } else {
        this.flame.fillStyle(0x35d4ff, 0.45 + flamePower * 0.28);
        this.flame.fillTriangle(-18, 38, 18, 38, 0, 84 + Math.sin(time * 0.02) * 8);
        this.flame.fillStyle(0xff7a18, 0.42 + flamePower * 0.25);
        this.flame.fillTriangle(-10, 40, 10, 40, 0, 70 + Math.cos(time * 0.025) * 8);
      }

      this.speedFx.fillStyle(0x35d4ff, 0.08 + flamePower * 0.12);
      this.speedFx.fillTriangle(width / 2 - 58, height * 0.78, width / 2 + 58, height * 0.78, width / 2, height);
      this.speedFx.fillStyle(0xff7a18, 0.28 * flamePower);
      for (let i = 0; i < (state.performance.lowEffectsMode ? 3 : 8); i += 1) {
        const x = width / 2 + Math.sin(time * 0.01 + i) * (38 + i * 11);
        const y = height * 0.58 + i * 24;
        this.speedFx.fillCircle(x, y, 2 + (i % 3));
      }
    } else if (this.flame.setAlpha) {
      this.flame.setAlpha(0);
    }

    this.speedLines.forEach((line, index) => {
      if (!line.visible) return;
      const side = line.getData("side");
      const phase = (time * 0.45 * speedFactor + line.getData("offset")) % (height + 180);
      const visible = state.boost > 8 || speedFactor > 1.45;
      const alpha = visible ? Phaser.Math.Clamp((state.boost + state.speedKick) / 130, 0.08, 0.6) : 0;
      line.setPosition(side < 0 ? 18 + (index % 4) * 12 : width - 18 - (index % 4) * 12, phase - 90);
      line.setRotation(side * 0.1);
      line.setScale(1, 0.8 + speedFactor * 0.45);
      line.setAlpha(alpha);
      line.setFillStyle(index % 2 === 0 ? 0x35d4ff : 0xffcf54, alpha);
    });
  }

  updateHud() {
    this.speedText.setText(String(Math.round(state.speed)).padStart(3, "0"));
    this.scoreText.setText(String(state.score));
    this.comboText.setText(`COMBO x${state.combo}`);
    this.tempText.setText(`TEMP ${Math.round(state.grillTemp)}C`);
    this.clusterText.setText(`RPM ${Math.round(Phaser.Math.Clamp((state.speed - 50) / 1.6, 0, 100))}\nBOOST ${Math.round(state.boost)}\nTEMP ${Math.round(state.grillTemp)}`);
    this.distanceText?.setText(`${Math.round(state.distance)} / ${state.stage.targetDistance}m`);
    const status = state.boost > 70 ? "BOOST ACTIVE" : state.boost > 28 ? "BOOST CHARGING" : "BOOST READY";
    this.statusText.setText(status);
    this.drawHud();
  }

  finishRun(cleared, reason) {
    if (this.ended) return;
    this.ended = true;
    this.setInputMode("result");
    this.clearActiveTouches();
    const accuracy = state.totalQuestions ? Math.round((state.correctAnswers / state.totalQuestions) * 100) : 0;
    const stars = calculateStars({ cleared, accuracy, bestCombo: state.bestCombo });
    const result = {
      cleared,
      reason,
      stageId: state.stage.id,
      stageName: state.stage.name,
      nextStageId: cleared && state.stage.id < STAGES.length ? state.stage.id + 1 : null,
      score: state.score,
      correctAnswers: state.correctAnswers,
      totalQuestions: state.totalQuestions,
      accuracy,
      bestCombo: state.bestCombo,
      temp: Math.max(0, Math.round(state.grillTemp)),
      stars,
      learningSummary: summarizeLearningStats(loadLearningStats())
    };

    if (cleared) {
      saveProgress(mergeStageResult(loadProgress(), state.stage.id, result));
    }
    feedback.trigger(cleared ? "stageClear" : "gameOver");

    this.time.delayedCall(450, () => this.scene.start("result", result));
  }

  bumpCombo() {
    this.tweens.killTweensOf(this.comboText);
    this.comboText.setScale(1.45);
    this.tweens.add({
      targets: this.comboText,
      scale: 1,
      duration: 280,
      ease: "Back.easeOut"
    });
  }

  flashText(text, color) {
    const flash = this.add.text(this.scale.width / 2, this.scale.height * 0.34, text, {
      fontFamily: "Arial Black, Arial",
      fontSize: "29px",
      color: colorToCss(color),
      stroke: "#07111f",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({
      targets: flash,
      y: flash.y - 46,
      scale: 1.08,
      alpha: 0,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy()
    });
  }

  handleResize() {
    this.drawWorld();
    this.drawHud();
    this.rider.setPosition(this.laneToX(this.lane), this.scale.height * 0.76);
    this.tutorialText?.setX(this.scale.width / 2);
  }

  setTutorialStep(step) {
    state.tutorialStep = step;
    const messages = {
      1: "Move left and right twice!",
      2: "Ride through the answer gate!",
      3: "Correct! BOOST is on!",
      4: "Press JUMP to hop over!"
    };
    this.tutorialText?.setText(messages[step] || "");
    if (step === 4) {
      this.jumpButton.setScale(1.12);
      this.tweens.add({ targets: this.jumpButton, scale: 1, duration: 360, yoyo: true, repeat: 2 });
    }
  }

  finishTutorial() {
    if (this.ended) return;
    this.ended = true;
    this.setInputMode("result");
    this.clearActiveTouches();
    saveTutorialState(createTutorialCompletion());
    this.time.delayedCall(650, () => this.scene.start("tutorialComplete"));
  }

  registerPwa() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js");
    }
  }

  hasTexture(key) {
    return this.textures?.exists(key);
  }
}

function colorToCss(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function drawArcadeBadge(scene, x, y, width, height) {
  const g = scene.add.graphics();
  const left = x - width / 2;
  const top = y - height / 2;
  g.fillStyle(0x020815, 0.76);
  g.fillRoundedRect(left + 10, top + 24, width - 20, height - 44, 10);
  g.lineStyle(6, 0x35d4ff, 0.75);
  g.strokeRoundedRect(left + 12, top + 26, width - 24, height - 48, 10);
  g.lineStyle(3, 0xff7a18, 0.75);
  g.lineBetween(left + 40, top + height - 28, left + width - 40, top + height - 28);
  g.fillStyle(0xe8fbff, 0.9);
  g.fillTriangle(x - 92, top + 48, x - 48, top + 8, x - 12, top + 48);
  g.fillTriangle(x - 16, top + 48, x + 44, top, x + 96, top + 48);
}

function drawArcadeButton(scene, x, y, textureKey) {
  const g = scene.add.graphics();
  const isStart = textureKey === "buttonStart";
  const isBlue = textureKey === "buttonBlue";
  const width = 318;
  const height = isStart ? 68 : 60;
  const left = x - width / 2;
  const top = y - height / 2;
  const fill = isStart ? 0xff7a18 : isBlue ? 0x0875d9 : 0x06101e;
  const inner = isStart ? 0xff9818 : isBlue ? 0x064b9b : 0x0a2034;
  const stroke = isStart ? 0xfff4b8 : isBlue ? 0x35d4ff : 0x617386;
  g.fillStyle(fill, 0.98);
  g.fillRoundedRect(left, top, width, height, 16);
  g.fillStyle(inner, 0.92);
  g.fillRoundedRect(left + 8, top + 8, width - 16, height - 16, 12);
  g.lineStyle(4, stroke, 0.95);
  g.strokeRoundedRect(left, top, width, height, 16);
  if (isStart) {
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(left + 44, y - 16, left + 44, y + 16, left + 76, y);
  }
}

function drawRiderSilhouette(scene, x, y) {
  const g = scene.add.graphics();
  g.fillStyle(0x020815, 0.5);
  g.fillCircle(x + 44, y + 86, 42);
  g.lineStyle(8, 0xdff8ff, 0.9);
  g.strokeCircle(x - 22, y + 72, 22);
  g.strokeCircle(x + 64, y + 72, 27);
  g.lineBetween(x - 22, y + 72, x + 20, y + 30);
  g.lineBetween(x + 20, y + 30, x + 64, y + 72);
  g.fillStyle(0xff7a18, 0.95);
  g.fillRoundedRect(x + 34, y - 24, 44, 38, 8);
  g.fillStyle(0xf6fbff, 0.95);
  g.fillCircle(x + 10, y - 40, 16);
  g.fillStyle(0x07111f, 1);
  g.fillRect(x + 1, y - 45, 34, 10);
  g.fillStyle(0x35d4ff, 0.82);
  g.fillTriangle(x + 82, y - 4, x + 150, y + 22, x + 82, y + 42);
  g.fillStyle(0xff7a18, 0.78);
  g.fillTriangle(x + 76, y + 8, x + 126, y + 26, x + 76, y + 34);
}

function starsText(stars) {
  return `${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#07111f",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN.width,
    height: DESIGN.height
  },
  input: {
    activePointers: 3
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  scene: [BootScene, TutorialIntroScene, MenuScene, RaceScene, ResultScene, TutorialCompleteScene]
});

window.addEventListener("resize", () => {
  game.scale.refresh();
});
