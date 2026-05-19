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
const GAME_CONCEPT = "sky-math-tower";
const ACTIVE_GAME_MODE = "tower";
const PROGRESS_KEY = "math-downhill-progress";
const PERFORMANCE_SETTINGS_KEY = "math-downhill-performance-settings";
const SKY_TOWER_TUTORIAL_KEY = "sky-math-tower-tutorial-complete";
const URL_PARAMS = new URLSearchParams(location.search);
const EASY_PLAYTEST_ENABLED = URL_PARAMS.get("easyPlaytest") === "1";
const QUICK_STAGE_CLEAR_ENABLED = URL_PARAMS.get("quickStageClear") === "1";
const OVERHEAT_LIMIT = 112;
const JUMP_ZONE_SIZE = 88;
const SAFE_BOTTOM_FALLBACK = 16;
const TOUCH_REPEAT_MS = 230;
const TOUCH_TOP_DEAD_ZONE = 172;
const FIRST_PERSON_MTB_VIEW = true;
const FIRST_PERSON_SIMPLIFIED_TRACK = true;
const COCKPIT_SCREEN_HEIGHT_RATIO = 0.27;
const COCKPIT_FALLBACK_PRIORITY = "cockpit-png > cockpit-svg > rider-svg > graphics";
const MATH_GATE_MIN_INTERVAL_MS = 7000;
const MATH_GATE_MIN_DISTANCE = 260;
const MATH_GATE_MAX_INTERVAL_MS = 13000;
const MATH_GATE_STAGE_DENSITY = {
  1: 0.76,
  2: 0.92,
  3: 0.82,
  4: 0.96,
  5: 0.9
};
const SKY_TOWER_STAGES = [
  { id: 1, name: "Cloud Steps", targetHeight: 8, blockCount: 2, blockSpeed: 0.08 },
  { id: 2, name: "Windy Blocks", targetHeight: 12, blockCount: 2, blockSpeed: 0.3 },
  { id: 3, name: "Sky Bridge", targetHeight: 14, blockCount: 3, blockSpeed: 0.35 },
  { id: 4, name: "Star Tower", targetHeight: 16, blockCount: 3, blockSpeed: 0.45 },
  { id: 5, name: "Storm Top", targetHeight: 18, blockCount: 3, blockSpeed: 0.55 }
];
const SKY_TOWER_TUTORIAL_STEPS = [
  {
    id: 1,
    title: "Pick the correct block!",
    detail: "Look at 3 + 2. Tap 5.",
    moving: false
  },
  {
    id: 2,
    title: "Correct answer = jump up!",
    detail: "Reach the next floor.",
    moving: false
  },
  {
    id: 3,
    title: "Tap moving blocks carefully.",
    detail: "Watch the number, then tap.",
    moving: true
  },
  {
    id: 4,
    title: "Wrong block costs a heart.",
    detail: "Protect your hearts. Reach the top.",
    moving: true
  }
];
const TOWER_JUMP_DURATION_MS = 450;
const TOWER_LANDING_FEEDBACK_MS = 180;
const TOWER_FLOOR_TRANSITION_MS = 450;
const TOWER_BLOCK_SPAWN_MS = 320;
const TOWER_BLOCK_VISUAL_WIDTH = 142;
const TOWER_BLOCK_VISUAL_HEIGHT = 88;
const TOWER_BLOCK_TOUCH_WIDTH = 168;
const TOWER_BLOCK_TOUCH_HEIGHT = 112;
const UI_SAFE_ZONES = {
  problemBanner: { topRatio: 0.055, bottomRatio: 0.16 },
  hud: { topFromBottom: 124 },
  jumpButton: { right: 126, bottom: 160 },
  riderFocus: { topRatio: 0.66, bottomRatio: 0.96 },
  cockpitFocus: { topRatio: 0.68, bottomRatio: 1.0 }
};
const DEBUG_TOUCH_ENABLED = URL_PARAMS.get("debugTouch") === "1"
  || localStorage.getItem("math-downhill-debug-touch") === "1";
const DEBUG_PERF_ENABLED = URL_PARAMS.get("debugPerf") === "1"
  || localStorage.getItem("math-downhill-debug-perf") === "1";
const DEBUG_STORAGE_ENABLED = URL_PARAMS.get("debugStorage") === "1"
  || localStorage.getItem("math-downhill-debug-storage") === "1";
const DEBUG_MTB_READ_ENABLED = URL_PARAMS.get("debugMtbRead") === "1"
  || localStorage.getItem("math-downhill-debug-mtb-read") === "1";
const DEBUG_RACE_FEEL_ENABLED = URL_PARAMS.get("debugRaceFeel") === "1"
  || localStorage.getItem("math-downhill-debug-race-feel") === "1";
const DEBUG_TOWER_STATE_ENABLED = URL_PARAMS.get("debugTowerState") === "1"
  || localStorage.getItem("sky-math-tower-debug-state") === "1";
const ASSETS = {
  mtbCockpitSvg: "assets/sprites/mtb_cockpit.svg",
  mtbCockpitNormal: "assets/sprites/generated/mtb_cockpit_normal.png",
  mtbCockpitLeft: "assets/sprites/generated/mtb_cockpit_left.png",
  mtbCockpitRight: "assets/sprites/generated/mtb_cockpit_right.png",
  mtbCockpitBoost: "assets/sprites/generated/mtb_cockpit_boost.png",
  mtbCockpitJump: "assets/sprites/generated/mtb_cockpit_jump.png",
  mtbCockpitLand: "assets/sprites/generated/mtb_cockpit_land.png",
  rider: "assets/sprites/rider.svg",
  riderBoost: "assets/sprites/rider_boost.svg",
  riderJump: "assets/sprites/rider_jump.svg",
  riderMtb: "assets/sprites/rider_mtb_large.svg",
  riderMtbLarge: "assets/sprites/rider_mtb_large.svg",
  riderMtbLeanLeft: "assets/sprites/rider_mtb_lean_left.svg",
  riderMtbLeanRight: "assets/sprites/rider_mtb_lean_right.svg",
  riderMtbBoostState: "assets/sprites/rider_mtb_boost.svg",
  riderMtbJumpState: "assets/sprites/rider_mtb_jump.svg",
  riderMtbLand: "assets/sprites/rider_mtb_land.svg",
  riderMtbSlide: "assets/sprites/rider_mtb_slide.svg",
  riderMtbBoost: "assets/sprites/rider_mtb_boost_large.svg",
  riderMtbJump: "assets/sprites/rider_mtb_jump_large.svg",
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
  mtbTrackTape: "assets/environment/mtb_track_tape.svg",
  mtbTrackTapeLeft: "assets/environment/mtb_track_tape_left.svg",
  mtbTrackTapeRight: "assets/environment/mtb_track_tape_right.svg",
  mtbCoursePole: "assets/environment/mtb_course_pole.svg",
  mtbCourseArrowBlue: "assets/environment/mtb_course_arrow_blue.svg",
  mtbCourseArrowOrange: "assets/environment/mtb_course_arrow_orange.svg",
  mtbJumpRamp: "assets/environment/mtb_jump_ramp.svg",
  mtbTireTracks: "assets/environment/mtb_tire_tracks.svg",
  mtbBankCurve: "assets/environment/mtb_bank_curve.svg",
  mtbCourseMarker: "assets/environment/mtb_course_marker.svg",
  mtbPineNear: "assets/environment/mtb_pine_near.svg",
  mtbPineFar: "assets/environment/mtb_pine_far.svg",
  mtbSnowBankLarge: "assets/environment/mtb_snow_bank_large.svg",
  mtbSnowBankSmall: "assets/environment/mtb_snow_bank_small.svg",
  mtbRockTrackside: "assets/environment/mtb_rock_trackside.svg",
  mtbIcePatchTrackside: "assets/environment/mtb_ice_patch_trackside.svg",
  mtbBannerMathSpeed: "assets/environment/mtb_banner_math_speed.svg",
  mtbCheckpointFlag: "assets/environment/mtb_checkpoint_flag.svg",
  mtbSpectatorFlag: "assets/environment/mtb_spectator_flag.svg",
  boostSpark: "assets/effects/boost_spark.svg",
  towerBlockNormal: "assets/tower/blocks/block_normal.svg",
  towerBlockSelected: "assets/tower/blocks/block_selected.svg",
  towerBlockCorrect: "assets/tower/blocks/block_correct.svg",
  towerBlockWrong: "assets/tower/blocks/block_wrong.svg",
  towerBlockCracked: "assets/tower/blocks/block_cracked.svg",
  towerBlockLocked: "assets/tower/blocks/block_locked.svg",
  towerBlockGlassNormal: "assets/tower/blocks/block_glass_normal.svg",
  towerBlockGlassSelected: "assets/tower/blocks/block_glass_selected.svg",
  towerBlockGlassCorrect: "assets/tower/blocks/block_glass_correct.svg",
  towerBlockGlassWrong: "assets/tower/blocks/block_glass_wrong.svg",
  towerBlockGlassCracked: "assets/tower/blocks/block_glass_cracked.svg",
  towerBlockGlassLocked: "assets/tower/blocks/block_glass_locked.svg",
  towerPlayerIdle: "assets/tower/character/player_idle.svg",
  towerPlayerJump: "assets/tower/character/player_jump.svg",
  towerPlayerLand: "assets/tower/character/player_land.svg",
  towerPlayerWrong: "assets/tower/character/player_wrong.svg",
  towerPlayerCelebrate: "assets/tower/character/player_celebrate.svg",
  towerCloudFar: "assets/tower/background/cloud_far.svg",
  towerCloudNear: "assets/tower/background/cloud_near.svg",
  towerDistantTower: "assets/tower/background/distant_tower.svg",
  towerFloatingIsland: "assets/tower/background/floating_island.svg",
  towerDepthFog: "assets/tower/background/depth_fog.svg",
  towerGroundHills: "assets/tower/background/ground_hills.svg",
  towerCloudBand: "assets/tower/background/cloud_band.svg",
  towerUpperSkyGlow: "assets/tower/background/upper_sky_glow.svg",
  towerStarField: "assets/tower/background/star_field.svg",
  towerMoonOrPlanetFar: "assets/tower/background/moon_or_planet_far.svg",
  towerLandingDust: "assets/tower/effects/landing_dust.svg",
  towerCorrectSparkle: "assets/tower/effects/correct_sparkle.svg",
  towerWrongCrackFlash: "assets/tower/effects/wrong_crack_flash.svg",
  towerFloorUpGlow: "assets/tower/effects/floor_up_glow.svg",
  towerStarGlow: "assets/tower/ui/star_glow.svg"
};

const towerState = {
  currentHeight: 0,
  targetHeight: 20,
  lives: 3,
  maxLives: 3,
  combo: 0,
  bestCombo: 0,
  score: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  currentProblem: null,
  currentBlocks: [],
  selectedBlockId: null,
  isJumping: false,
  jumpProgress: 0,
  stageId: 1,
  blockSpeed: 0.25,
  blockMoveTime: 0,
  floorIndex: 0,
  cameraOffsetY: 0,
  floorTransition: false,
  floorTransitionProgress: 0,
  previousFloorBlocks: [],
  currentFloorBlocks: [],
  nextFloorBlocks: [],
  lastAnswerResult: null,
  roundState: "waitingForAnswer"
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
  boostPulse: 0,
  riderLandPulse: 0,
  riderSlidePulse: 0,
  raceFeel: createInitialRaceFeel()
};

function createInitialRaceFeel() {
  return {
    speed: 0,
    targetSpeed: 0,
    lateralVelocity: 0,
    steering: 0,
    traction: 1,
    jumpY: 0,
    jumpVelocity: 0,
    jumpGravity: 2200,
    jumpImpulse: 760,
    isAirborne: false,
    boostTime: 0,
    slideTime: 0,
    edgeSlowTime: 0,
    landingTime: 0,
    collisionTime: 0,
    nextMathGateAt: 0,
    lastMathGateDistance: 0,
    pureRacingUntil: 0,
    lastIceSegment: -1
  };
}

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

function loadSkyTowerTutorialState() {
  const saved = localStorage.getItem(SKY_TOWER_TUTORIAL_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return parsed?.completed ? parsed : null;
  } catch {
    return null;
  }
}

function saveSkyTowerTutorialState(value = createTutorialCompletion()) {
  localStorage.setItem(SKY_TOWER_TUTORIAL_KEY, JSON.stringify(value));
  return value;
}

function skipSkyTowerTutorial(timestamp = Date.now()) {
  return saveSkyTowerTutorialState(createTutorialCompletion(timestamp));
}

function isTowerMode() {
  return ACTIVE_GAME_MODE === "tower" && GAME_CONCEPT === "sky-math-tower";
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
  state.riderLandPulse = 0;
  state.riderSlidePulse = 0;
  state.raceFeel = createInitialRaceFeel();
  state.raceFeel.speed = state.speed;
  state.raceFeel.targetSpeed = state.speed;
}

function resetTowerRun(stage) {
  towerState.currentHeight = 0;
  towerState.targetHeight = stage.targetHeight;
  towerState.maxLives = EASY_PLAYTEST_ENABLED ? 5 : 3;
  towerState.lives = towerState.maxLives;
  towerState.combo = 0;
  towerState.bestCombo = 0;
  towerState.score = 0;
  towerState.correctAnswers = 0;
  towerState.totalQuestions = 0;
  towerState.currentProblem = null;
  towerState.currentBlocks = [];
  towerState.selectedBlockId = null;
  towerState.isJumping = false;
  towerState.jumpProgress = 0;
  towerState.stageId = stage.id;
  towerState.blockSpeed = stage.blockSpeed;
  towerState.blockMoveTime = 0;
  towerState.floorIndex = 0;
  towerState.cameraOffsetY = 0;
  towerState.floorTransition = false;
  towerState.floorTransitionProgress = 0;
  towerState.previousFloorBlocks = [];
  towerState.currentFloorBlocks = [];
  towerState.nextFloorBlocks = [];
  towerState.lastAnswerResult = null;
  towerState.roundState = "waitingForAnswer";
}

function createPlayableTowerStage(stage) {
  const playable = { ...stage };
  if (QUICK_STAGE_CLEAR_ENABLED) {
    playable.targetHeight = Math.min(playable.targetHeight, 3);
  }
  if (EASY_PLAYTEST_ENABLED) {
    playable.targetHeight = Math.min(playable.targetHeight, QUICK_STAGE_CLEAR_ENABLED ? 3 : 5);
    playable.blockCount = Math.min(playable.blockCount, 2);
    playable.blockSpeed = Math.min(playable.blockSpeed, 0.06);
  }
  return playable;
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

function applyTowerQaUrlParams() {
  if (!isTowerMode()) return;
  const resetTutorial = URL_PARAMS.get("resetTowerTutorial") === "1";
  const resetProgress = URL_PARAMS.get("resetTowerProgress") === "1";
  const resetAll = URL_PARAMS.get("resetTowerAll") === "1";
  if (resetTutorial || resetAll) {
    localStorage.removeItem(SKY_TOWER_TUTORIAL_KEY);
  }
  if (resetProgress || resetAll) {
    localStorage.removeItem(PROGRESS_KEY);
    state.progress = createInitialProgress();
  }
  updateDebugStorageOverlay();
}

applyTowerQaUrlParams();

class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.image("mtbCockpitNormal", ASSETS.mtbCockpitNormal);
    this.load.image("mtbCockpitLeft", ASSETS.mtbCockpitLeft);
    this.load.image("mtbCockpitRight", ASSETS.mtbCockpitRight);
    this.load.image("mtbCockpitBoost", ASSETS.mtbCockpitBoost);
    this.load.image("mtbCockpitJump", ASSETS.mtbCockpitJump);
    this.load.image("mtbCockpitLand", ASSETS.mtbCockpitLand);
    this.load.svg("mtbCockpitSvg", ASSETS.mtbCockpitSvg);
    this.load.svg("rider", ASSETS.rider);
    this.load.svg("riderBoost", ASSETS.riderBoost);
    this.load.svg("riderJump", ASSETS.riderJump);
    this.load.svg("riderMtb", ASSETS.riderMtb);
    this.load.svg("riderMtbLarge", ASSETS.riderMtbLarge);
    this.load.svg("riderMtbLeanLeft", ASSETS.riderMtbLeanLeft);
    this.load.svg("riderMtbLeanRight", ASSETS.riderMtbLeanRight);
    this.load.svg("riderMtbBoostState", ASSETS.riderMtbBoostState);
    this.load.svg("riderMtbJumpState", ASSETS.riderMtbJumpState);
    this.load.svg("riderMtbLand", ASSETS.riderMtbLand);
    this.load.svg("riderMtbSlide", ASSETS.riderMtbSlide);
    this.load.svg("riderMtbBoost", ASSETS.riderMtbBoost);
    this.load.svg("riderMtbJump", ASSETS.riderMtbJump);
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
    this.load.svg("mtbTrackTape", ASSETS.mtbTrackTape);
    this.load.svg("mtbTrackTapeLeft", ASSETS.mtbTrackTapeLeft);
    this.load.svg("mtbTrackTapeRight", ASSETS.mtbTrackTapeRight);
    this.load.svg("mtbCoursePole", ASSETS.mtbCoursePole);
    this.load.svg("mtbCourseArrowBlue", ASSETS.mtbCourseArrowBlue);
    this.load.svg("mtbCourseArrowOrange", ASSETS.mtbCourseArrowOrange);
    this.load.svg("mtbJumpRamp", ASSETS.mtbJumpRamp);
    this.load.svg("mtbTireTracks", ASSETS.mtbTireTracks);
    this.load.svg("mtbBankCurve", ASSETS.mtbBankCurve);
    this.load.svg("mtbCourseMarker", ASSETS.mtbCourseMarker);
    this.load.svg("mtbPineNear", ASSETS.mtbPineNear);
    this.load.svg("mtbPineFar", ASSETS.mtbPineFar);
    this.load.svg("mtbSnowBankLarge", ASSETS.mtbSnowBankLarge);
    this.load.svg("mtbSnowBankSmall", ASSETS.mtbSnowBankSmall);
    this.load.svg("mtbRockTrackside", ASSETS.mtbRockTrackside);
    this.load.svg("mtbIcePatchTrackside", ASSETS.mtbIcePatchTrackside);
    this.load.svg("mtbBannerMathSpeed", ASSETS.mtbBannerMathSpeed);
    this.load.svg("mtbCheckpointFlag", ASSETS.mtbCheckpointFlag);
    this.load.svg("mtbSpectatorFlag", ASSETS.mtbSpectatorFlag);
    this.load.svg("boostSpark", ASSETS.boostSpark);
    this.load.svg("towerBlockNormal", ASSETS.towerBlockNormal);
    this.load.svg("towerBlockSelected", ASSETS.towerBlockSelected);
    this.load.svg("towerBlockCorrect", ASSETS.towerBlockCorrect);
    this.load.svg("towerBlockWrong", ASSETS.towerBlockWrong);
    this.load.svg("towerBlockCracked", ASSETS.towerBlockCracked);
    this.load.svg("towerBlockLocked", ASSETS.towerBlockLocked);
    this.load.svg("towerBlockGlassNormal", ASSETS.towerBlockGlassNormal);
    this.load.svg("towerBlockGlassSelected", ASSETS.towerBlockGlassSelected);
    this.load.svg("towerBlockGlassCorrect", ASSETS.towerBlockGlassCorrect);
    this.load.svg("towerBlockGlassWrong", ASSETS.towerBlockGlassWrong);
    this.load.svg("towerBlockGlassCracked", ASSETS.towerBlockGlassCracked);
    this.load.svg("towerBlockGlassLocked", ASSETS.towerBlockGlassLocked);
    this.load.svg("towerPlayerIdle", ASSETS.towerPlayerIdle);
    this.load.svg("towerPlayerJump", ASSETS.towerPlayerJump);
    this.load.svg("towerPlayerLand", ASSETS.towerPlayerLand);
    this.load.svg("towerPlayerWrong", ASSETS.towerPlayerWrong);
    this.load.svg("towerPlayerCelebrate", ASSETS.towerPlayerCelebrate);
    this.load.svg("towerCloudFar", ASSETS.towerCloudFar);
    this.load.svg("towerCloudNear", ASSETS.towerCloudNear);
    this.load.svg("towerDistantTower", ASSETS.towerDistantTower);
    this.load.svg("towerFloatingIsland", ASSETS.towerFloatingIsland);
    this.load.svg("towerDepthFog", ASSETS.towerDepthFog);
    this.load.svg("towerGroundHills", ASSETS.towerGroundHills);
    this.load.svg("towerCloudBand", ASSETS.towerCloudBand);
    this.load.svg("towerUpperSkyGlow", ASSETS.towerUpperSkyGlow);
    this.load.svg("towerStarField", ASSETS.towerStarField);
    this.load.svg("towerMoonOrPlanetFar", ASSETS.towerMoonOrPlanetFar);
    this.load.svg("towerLandingDust", ASSETS.towerLandingDust);
    this.load.svg("towerCorrectSparkle", ASSETS.towerCorrectSparkle);
    this.load.svg("towerWrongCrackFlash", ASSETS.towerWrongCrackFlash);
    this.load.svg("towerFloorUpGlow", ASSETS.towerFloorUpGlow);
    this.load.svg("towerStarGlow", ASSETS.towerStarGlow);
  }

  create() {
    if (isTowerMode()) {
      this.scene.start(loadSkyTowerTutorialState() ? "menu" : "tutorialIntro");
      return;
    }
    this.scene.start(loadTutorialState() ? "menu" : "tutorialIntro");
  }
}

class TutorialIntroScene extends Phaser.Scene {
  constructor() {
    super("tutorialIntro");
  }

  create() {
    if (isTowerMode()) {
      this.createTowerIntro();
      return;
    }
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
    this.add.text(centerX, 180, "MATH  \u2022  SPEED  \u2022  BOOST", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9ee7ff"
    }).setOrigin(0.5);
    drawMtbTitleHero(this, centerX, height * 0.39);
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

  createTowerIntro() {
    this.cameras.main.setBackgroundColor("#8bdcff");
    const { width, height } = this.scale;
    const centerX = width / 2;
    const g = this.add.graphics();
    g.fillGradientStyle(0x6bd4ff, 0xc7f2ff, 0xf5fdff, 0x8bb7ff, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 7; i += 1) {
      const x = (i * 83) % (width + 90) - 35;
      const y = height * 0.16 + (i % 4) * 92;
      g.fillCircle(x, y, 24);
      g.fillCircle(x + 28, y + 6, 18);
      g.fillCircle(x - 26, y + 8, 16);
    }
    g.fillStyle(0x5d7bea, 0.16);
    g.fillRoundedRect(width * 0.66, height * 0.34, 38, height * 0.28, 8);
    g.fillTriangle(width * 0.66, height * 0.34, width * 0.71, height * 0.26, width * 0.76, height * 0.34);
    g.fillStyle(0xffffff, 0.82);
    g.fillRoundedRect(24, 112, width - 48, 360, 14);
    g.lineStyle(3, 0x6bd4ff, 0.9);
    g.strokeRoundedRect(24, 112, width - 48, 360, 14);
    this.add.text(centerX, 150, "SKY MATH TOWER", {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: "#17345f",
      stroke: "#ffffff",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(centerX, 220, "Look at the problem.\nTap the correct block.\nJump higher and protect your hearts!", {
      fontFamily: "Arial Black, Arial",
      fontSize: "20px",
      color: "#1d3c68",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);
    this.add.text(centerX, 352, "3 + 2 = ?", {
      fontFamily: "Arial Black, Arial",
      fontSize: "34px",
      color: "#7b5cff",
      stroke: "#ffffff",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.createButton(centerX, height - 214, "START PRACTICE", () => this.scene.start("tower", { mode: "tutorial" }), "buttonStart");
    this.createButton(centerX, height - 138, "SKIP", () => {
      feedback.trigger("uiClick");
      skipSkyTowerTutorial();
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
    if (isTowerMode()) {
      this.createTowerMenu();
      return;
    }
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
    this.add.text(centerX, 179, "MATH  \u2022  SPEED  \u2022  BOOST", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9ee7ff"
    }).setOrigin(0.5);
    drawMtbTitleHero(this, centerX, height * 0.39);
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

  createTowerMenu() {
    state.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#8bdcff");
    this.drawTowerMenuBackground();
    const { width, height } = this.scale;
    const centerX = width / 2;
    this.add.text(centerX, 64, "SKY", {
      fontFamily: "Arial Black, Arial",
      fontSize: "48px",
      color: "#ffffff",
      stroke: "#17345f",
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(centerX, 112, "MATH TOWER", {
      fontFamily: "Arial Black, Arial",
      fontSize: "34px",
      color: "#7b5cff",
      stroke: "#ffffff",
      strokeThickness: 7
    }).setOrigin(0.5);
    this.add.text(centerX, 146, "PICK  -  JUMP  -  CLIMB", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#17345f"
    }).setOrigin(0.5);
    this.createTowerStageCards();
    this.createMenuButton(centerX, height - 248, "START", "buttonStart", () => {
      feedback.trigger("uiClick");
      if (!loadSkyTowerTutorialState()) {
        this.scene.start("tutorialIntro");
        return;
      }
      this.scene.start("tower", { stageId: Math.min(state.progress.unlockedStage, SKY_TOWER_STAGES.length) });
    }, 30);
    this.createMenuButton(centerX, height - 178, "TUTORIAL", "buttonBlue", () => {
      feedback.trigger("uiClick");
      this.scene.start("tower", { mode: "tutorial" });
    }, 22);
    this.createMenuButton(centerX, height - 112, "STAGE SELECT", "buttonBlue", () => {
      feedback.trigger("uiClick");
    }, 18);
    this.createMenuButton(centerX, height - 50, "SETTINGS", "buttonDark", () => {
      feedback.trigger("uiClick");
      settingsPanel.classList.toggle("is-open");
    }, 20);
  }

  drawTowerMenuBackground() {
    const g = this.add.graphics();
    const { width, height } = this.scale;
    g.fillGradientStyle(0x6bd4ff, 0xc7f2ff, 0xf5fdff, 0x8bb7ff, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xffffff, 0.48);
    for (let i = 0; i < 9; i += 1) {
      const x = (i * 71) % (width + 80) - 30;
      const y = 84 + (i % 5) * 102;
      g.fillCircle(x, y, 22);
      g.fillCircle(x + 26, y + 5, 18);
      g.fillCircle(x - 22, y + 8, 14);
    }
    g.fillStyle(0x203d79, 0.16);
    g.fillRect(0, height * 0.82, width, height * 0.18);
  }

  createTowerStageCards() {
    const startY = 178;
    SKY_TOWER_STAGES.forEach((stage, index) => {
      const unlocked = stage.id <= state.progress.unlockedStage;
      const best = state.progress.bestScores[stage.id];
      const y = startY + index * 66;
      const card = this.add.graphics();
      card.fillStyle(unlocked ? 0xffffff : 0xc9dcf8, unlocked ? 0.86 : 0.58);
      card.fillRoundedRect(24, y, this.scale.width - 48, 56, 10);
      card.lineStyle(2, unlocked ? 0x6bd4ff : 0x8799b5, unlocked ? 0.9 : 0.55);
      card.strokeRoundedRect(24, y, this.scale.width - 48, 56, 10);
      this.add.text(42, y + 9, `Stage ${stage.id}: ${stage.name}`, {
        fontFamily: "Arial Black, Arial",
        fontSize: "15px",
        color: unlocked ? "#17345f" : "#6b7f90"
      });
      this.add.text(42, y + 33, unlocked ? `Height ${stage.targetHeight}` : "LOCKED", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: unlocked ? "#4e77c9" : "#6b7f90"
      });
      this.add.text(this.scale.width - 42, y + 18, best ? starsText(best.stars) : starsText(0), {
        fontFamily: "Arial Black, Arial",
        fontSize: "17px",
        color: best ? "#ffb300" : "#8799b5"
      }).setOrigin(1, 0);
      if (unlocked) {
        const zone = this.add.zone(this.scale.width / 2, y + 28, this.scale.width - 48, 56).setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          feedback.trigger("uiClick");
          this.scene.start("tower", { stageId: stage.id });
        });
      }
    });
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
      this.add.text(this.scale.width - 42, y + 22, best ? starsText(best.stars) : starsText(0), {
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
    const towerMode = isTowerMode();
    this.cameras.main.setBackgroundColor(towerMode ? "#8bdcff" : "#07111f");
    const { width, height } = this.scale;
    const cleared = this.result.cleared;
    const panel = this.add.graphics();
    panel.fillGradientStyle(
      towerMode ? 0x72d3ff : 0x06101e,
      towerMode ? 0xc6f3ff : 0x06101e,
      towerMode ? 0xf5fdff : 0x123653,
      towerMode ? 0x8bb7ff : 0x07111f,
      1
    );
    panel.fillRect(0, 0, width, height);
    if (towerMode) {
      if (this.textures.exists("towerDistantTower")) {
        this.add.image(width * 0.78, height * 0.57, "towerDistantTower").setAlpha(0.28).setDisplaySize(68, height * 0.32);
      }
      if (this.textures.exists("towerStarGlow")) {
        this.add.image(width / 2, 174, "towerStarGlow").setAlpha(cleared ? 0.82 : 0.22).setDisplaySize(96, 96);
      }
      if (this.textures.exists(cleared ? "towerPlayerCelebrate" : "towerPlayerWrong")) {
        this.add.image(width / 2, 94, cleared ? "towerPlayerCelebrate" : "towerPlayerWrong").setDisplaySize(74, 86);
      }
      panel.fillStyle(0xffffff, 0.4);
      panel.fillCircle(width * 0.2, 94, 28);
      panel.fillCircle(width * 0.28, 104, 22);
      panel.fillCircle(width * 0.76, 78, 34);
      panel.fillStyle(0x203d79, 0.18);
      panel.fillRect(0, height * 0.82, width, height * 0.18);
    }
    panel.fillStyle(towerMode ? 0xffffff : 0x020815, towerMode ? 0.78 : 0.72);
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
    if (towerMode && cleared && this.result.nextStageId) {
      const nextStage = SKY_TOWER_STAGES.find((stage) => stage.id === this.result.nextStageId);
      const unlockText = this.result.nextStageId === 2
        ? `Stage 2 Unlocked! ${nextStage?.name || ""}`.trim()
        : `${nextStage?.name || `Stage ${this.result.nextStageId}`} Unlocked!`;
      this.add.text(width / 2, 204, unlockText, {
        fontFamily: "Arial Black, Arial",
        fontSize: "15px",
        color: "#17345f",
        backgroundColor: "#ffcf54",
        padding: { x: 12, y: 5 }
      }).setOrigin(0.5);
    }

    const lines = [
      `Stage: ${this.result.stageName}`,
      `Score: ${this.result.score}`,
      `Answers: ${this.result.correctAnswers} / ${this.result.totalQuestions}`,
      `Accuracy: ${this.result.accuracy}%`,
      `Best Combo: ${this.result.bestCombo}`,
      towerMode ? `Height: ${this.result.heightReached || 0} / ${this.result.targetHeight || "?"}` : `Temp Left: ${this.result.temp}C`,
      `Practice: ${this.result.learningSummary.recommendation}`
    ];
    lines.forEach((line, index) => {
      this.add.text(54, 232 + index * 34, line, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: towerMode ? "#17345f" : "#dff8ff"
      });
    });
    this.add.text(54, 468, `Recent misses: ${this.result.learningSummary.recentWrongKeys.join(", ") || "None yet"}`, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: towerMode ? "#4e77c9" : "#9ee7ff"
    });

    const playScene = isTowerMode() ? "tower" : "race";
    const selectScene = isTowerMode() ? "tower" : "menu";
    if (cleared && this.result.nextStageId) {
      this.createButton(width / 2, 576, "NEXT STAGE", () => this.scene.start(playScene, { stageId: this.result.nextStageId }));
      this.createButton(width / 2, 638, "RETRY", () => this.scene.start(playScene, { stageId: this.result.stageId }));
    } else {
      this.createButton(width / 2, 576, "RETRY", () => this.scene.start(playScene, { stageId: this.result.stageId }));
    }
    this.createButton(width / 2, 700, isTowerMode() ? "KEEP CLIMBING" : "STAGE SELECT", () => this.scene.start(selectScene));
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
    if (isTowerMode()) {
      this.createTowerComplete();
      return;
    }
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

  createTowerComplete() {
    saveSkyTowerTutorialState();
    this.cameras.main.setBackgroundColor("#8bdcff");
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x6bd4ff, 0xc7f2ff, 0xf5fdff, 0x8bb7ff, 1);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xffffff, 0.84);
    g.fillRoundedRect(24, 128, width - 48, 360, 14);
    g.lineStyle(3, 0x57e389, 0.86);
    g.strokeRoundedRect(24, 128, width - 48, 360, 14);
    this.add.text(width / 2, 168, "Practice Complete!", {
      fontFamily: "Arial Black, Arial",
      fontSize: "28px",
      color: "#57a338",
      stroke: "#ffffff",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(width / 2, 238, "Ready to climb\nthe Sky Tower?", {
      fontFamily: "Arial Black, Arial",
      fontSize: "23px",
      color: "#17345f",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);
    this.createButton(width / 2, 356, "START STAGE 1", () => this.scene.start("tower", { stageId: 1 }));
    this.createButton(width / 2, 424, "PRACTICE AGAIN", () => this.scene.start("tower", { mode: "tutorial" }), true);
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

class SkyTowerScene extends Phaser.Scene {
  constructor() {
    super("tower");
  }

  init(data = {}) {
    this.isTutorial = data.mode === "tutorial";
    this.tutorialStep = Number(data.tutorialStep || 1);
    this.stageId = this.isTutorial ? 1 : data.stageId || Math.min(state.progress.unlockedStage, SKY_TOWER_STAGES.length);
  }

  create() {
    const baseStage = SKY_TOWER_STAGES.find((stage) => stage.id === this.stageId) || SKY_TOWER_STAGES[0];
    this.stage = createPlayableTowerStage(baseStage);
    resetTowerRun(this.stage);
    if (this.isTutorial) {
      towerState.targetHeight = SKY_TOWER_TUTORIAL_STEPS.length;
      towerState.maxLives = 3;
      towerState.lives = towerState.maxLives;
      towerState.roundState = "waitingForAnswer";
    }
    this.cameras.main.setBackgroundColor("#87d9ff");
    this.world = this.add.graphics();
    this.backgroundArtLayer = this.add.container(0, 0).setDepth(3);
    this.depthFog = this.add.graphics().setDepth(4);
    this.cloudLayer = this.add.container(0, 0).setDepth(5);
    this.blockLayer = this.add.container(0, 0).setDepth(20);
    this.fxLayer = this.add.container(0, 0).setDepth(60);
    this.drawSkyTowerBackground();
    this.createTowerBackgroundArt();
    this.createCloudLayer();
    this.createTowerHud();
    this.createTowerPlayer();
    this.createCurrentBlock();
    this.createRound();
    this.createDebugTowerStateOverlay();
    this.input.on("pointerdown", () => feedback.unlock());
    this.scale.on("resize", () => {
      this.drawSkyTowerBackground();
      this.createTowerBackgroundArt();
      this.createCloudLayer();
      this.layoutTowerHud();
      this.updateDebugTowerStateOverlay();
    });
  }

  update(_time, delta) {
    this.updateCloudLayer(delta);
    this.updateDebugTowerStateOverlay();
    if (towerState.roundState !== "waitingForAnswer") return;
    towerState.blockMoveTime += delta / 1000;
    for (const block of towerState.currentBlocks) {
      block.x = block.baseX + Math.sin(towerState.blockMoveTime * block.moveSpeed * Math.PI * 2 + block.id.length) * block.moveAmplitude;
      block.container?.setPosition(block.x, block.y);
    }
  }

  drawSkyWorld() {
    this.drawSkyTowerBackground();
  }

  hasTexture(key) {
    return this.textures?.exists(key);
  }

  getAltitudeProgress() {
    const target = Math.max(1, towerState.targetHeight || 1);
    const transitionLift = towerState.floorTransition ? towerState.floorTransitionProgress * 0.35 : 0;
    return Phaser.Math.Clamp((towerState.currentHeight + transitionLift) / target, 0, 1);
  }

  getBackgroundZone(progress = this.getAltitudeProgress()) {
    if (progress < 0.2) return "Ground / Low Sky";
    if (progress < 0.45) return "Bright Sky";
    if (progress < 0.7) return "Cloud Layer";
    if (progress < 0.9) return "Upper Sky / Stratosphere";
    return "Space Edge";
  }

  mixColor(from, to, t) {
    const clamped = Phaser.Math.Clamp(t, 0, 1);
    const fr = (from >> 16) & 255;
    const fg = (from >> 8) & 255;
    const fb = from & 255;
    const tr = (to >> 16) & 255;
    const tg = (to >> 8) & 255;
    const tb = to & 255;
    const r = Math.round(Phaser.Math.Linear(fr, tr, clamped));
    const g = Math.round(Phaser.Math.Linear(fg, tg, clamped));
    const b = Math.round(Phaser.Math.Linear(fb, tb, clamped));
    return (r << 16) | (g << 8) | b;
  }

  updateAltitudeBackground(progress = this.getAltitudeProgress()) {
    return {
      progress,
      zone: this.getBackgroundZone(progress),
      top: this.mixColor(0x7ed9ff, 0x20124d, Math.max(0, progress - 0.52) / 0.48),
      middle: this.mixColor(0xc8f4ff, 0x4158d0, Math.max(0, progress - 0.42) / 0.58),
      bottom: this.mixColor(0xf7fff8, 0x140f34, Math.max(0, progress - 0.72) / 0.28)
    };
  }

  drawSkyTowerBackground() {
    const { width, height } = this.scale;
    const climbShift = towerState.cameraOffsetY || 0;
    const altitude = this.updateAltitudeBackground();
    const progress = altitude.progress;
    this.world.clear();
    // ground-to-space altitude background progression: Ground / Low Sky -> Bright Sky -> Cloud Layer -> Upper Sky / Stratosphere -> Space Edge.
    this.world.fillGradientStyle(altitude.top, altitude.top, altitude.bottom, altitude.middle, 1);
    this.world.fillRect(0, 0, width, height);

    const sunAlpha = Phaser.Math.Linear(0.38, 0.1, Math.min(progress, 0.8));
    this.world.fillStyle(0xffffff, sunAlpha);
    this.world.fillCircle(width * 0.84, height * 0.13 + climbShift * 0.08, 44);

    const groundAlpha = Phaser.Math.Clamp(1 - progress * 4, 0, 0.34);
    if (groundAlpha > 0) {
      this.world.fillStyle(0x3f7e6f, groundAlpha);
      this.world.fillTriangle(width * 0.04, height * 0.86 + climbShift * 0.16, width * 0.2, height * 0.58 + climbShift * 0.16, width * 0.4, height * 0.86 + climbShift * 0.16);
      this.world.fillTriangle(width * 0.58, height * 0.87 + climbShift * 0.16, width * 0.82, height * 0.5 + climbShift * 0.16, width * 1.08, height * 0.87 + climbShift * 0.16);
    }

    const cloudBandAlpha = Phaser.Math.Clamp(1 - Math.abs(progress - 0.56) * 2.8, 0, 0.48);
    if (cloudBandAlpha > 0) {
      this.world.fillStyle(0xffffff, cloudBandAlpha);
      this.world.fillEllipse(width * 0.5, height * 0.62 + climbShift * 0.28, width * 0.96, 58);
      this.world.fillEllipse(width * 0.12, height * 0.7 + climbShift * 0.24, 180, 44);
      this.world.fillEllipse(width * 0.9, height * 0.69 + climbShift * 0.24, 170, 42);
    }

    const spaceAlpha = Phaser.Math.Clamp((progress - 0.72) / 0.28, 0, 1);
    if (spaceAlpha > 0) {
      this.world.fillStyle(0xfff6b8, spaceAlpha * 0.8);
      for (let i = 0; i < 18; i += 1) {
        const x = (i * 73 + towerState.currentHeight * 19) % width;
        const y = 34 + ((i * 47) % Math.floor(height * 0.54));
        this.world.fillCircle(x, y, i % 4 === 0 ? 2.1 : 1.25);
      }
      this.world.fillStyle(0xd8e5ff, spaceAlpha * 0.26);
      this.world.fillCircle(width * 0.18, height * 0.18 + climbShift * 0.05, 32);
    }

    this.world.fillStyle(0x7157c9, Phaser.Math.Linear(0.18, 0.08, progress));
    this.world.fillRoundedRect(width * 0.69, height * 0.47 + climbShift * 0.2, 34, height * 0.22, 7);
    this.world.fillTriangle(width * 0.69, height * 0.47 + climbShift * 0.2, width * 0.735, height * 0.39 + climbShift * 0.2, width * 0.78, height * 0.47 + climbShift * 0.2);
    this.world.fillStyle(0xffffff, Phaser.Math.Linear(0.5, 0.28, progress));
    this.world.fillEllipse(width * 0.75, height * 0.7 + climbShift * 0.28, 132, 32);
    this.drawDepthFog();
  }

  createTowerBackgroundArt() {
    if (!this.backgroundArtLayer) return;
    const { width, height } = this.scale;
    this.backgroundArtLayer.removeAll(true);
    if (this.hasTexture("towerDistantTower")) {
      const tower = this.add.image(width * 0.76, height * 0.55, "towerDistantTower")
        .setAlpha(0.38)
        .setDisplaySize(74, height * 0.34);
      this.backgroundArtLayer.add(tower);
    }
    if (this.hasTexture("towerFloatingIsland")) {
      const leftIsland = this.add.image(width * 0.22, height * 0.64, "towerFloatingIsland")
        .setAlpha(0.42)
        .setDisplaySize(132, 82);
      const rightIsland = this.add.image(width * 0.86, height * 0.72, "towerFloatingIsland")
        .setAlpha(0.3)
        .setDisplaySize(96, 58);
      this.backgroundArtLayer.add([leftIsland, rightIsland]);
    }
  }

  createCloudLayer() {
    const { width, height } = this.scale;
    this.cloudLayer.removeAll(true);
    const count = state.performance.lowEffectsMode ? 4 : 7;
    this.cloudSprites = [];
    for (let i = 0; i < count; i += 1) {
      const useArt = this.hasTexture(i % 2 ? "towerCloudNear" : "towerCloudFar");
      const cloud = useArt ? this.add.image(0, 0, i % 2 ? "towerCloudNear" : "towerCloudFar") : this.add.graphics();
      const x = (i * 89) % (width + 120) - 50;
      const y = height * 0.16 + (i % 4) * 88;
      cloud.setPosition(x, y);
      cloud.setData("baseY", y);
      cloud.setData("speed", 5 + (i % 3) * 2);
      if (useArt) {
        cloud.setAlpha(0.62);
        cloud.setDisplaySize(i % 2 ? 118 : 92, i % 2 ? 52 : 40);
      } else {
        cloud.fillStyle(0xffffff, 0.58);
        cloud.fillCircle(0, 0, 20 + (i % 2) * 5);
        cloud.fillCircle(24, 5, 17);
        cloud.fillCircle(-24, 7, 15);
        cloud.fillEllipse(4, 12, 78, 24);
      }
      this.cloudLayer.add(cloud);
      this.cloudSprites.push(cloud);
    }
  }

  updateCloudLayer(delta) {
    if (!this.cloudSprites?.length) return;
    const { width } = this.scale;
    const seconds = delta / 1000;
    for (const cloud of this.cloudSprites) {
      cloud.x += cloud.getData("speed") * seconds;
      cloud.y = cloud.getData("baseY") + towerState.cameraOffsetY * 0.35 + Math.sin((cloud.x + towerState.currentHeight * 12) * 0.01) * 3;
      if (cloud.x > width + 72) cloud.x = -86;
    }
  }

  drawDepthFog() {
    const { width, height } = this.scale;
    this.depthFog.clear();
    this.depthFog.fillGradientStyle(0xffffff, 0xffffff, 0x203d79, 0x132750, 0.0, 0.0, 0.34, 0.58);
    this.depthFog.fillRect(0, height * 0.73, width, height * 0.27);
  }

  createTowerHud() {
    const { width } = this.scale;
    this.problemBanner = this.add.graphics().setDepth(50);
    this.problemText = this.add.text(width / 2, 54, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#17345f",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(51);
    this.livesText = this.add.text(18, 102, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "20px",
      color: "#ff4f7b",
      stroke: "#ffffff",
      strokeThickness: 3
    }).setDepth(51);
    this.heightText = this.add.text(width - 18, 102, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "16px",
      color: "#17345f"
    }).setOrigin(1, 0).setDepth(51);
    this.comboText = this.add.text(width / 2, 110, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "15px",
      color: "#ff8a1f",
      stroke: "#ffffff",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(51);
    this.scoreText = this.add.text(18, 132, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "13px",
      color: "#17345f",
      backgroundColor: "rgba(255,255,255,0.58)",
      padding: { x: 8, y: 5 }
    }).setDepth(51);
    this.towerHintText = this.add.text(width / 2, 154, "Choose the correct block!\nTap the answer block.\nCorrect answer makes you jump higher.", {
      fontFamily: "Arial Black, Arial",
      fontSize: "13px",
      color: "#1d3c68",
      align: "center",
      lineSpacing: 3
    }).setOrigin(0.5).setDepth(51).setAlpha(0.84);
    this.floorFeedbackText = this.add.text(width / 2, 198, "", {
      fontFamily: "Arial Black, Arial",
      fontSize: "24px",
      color: "#ffcf54",
      stroke: "#17345f",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(72).setAlpha(0);
    this.settingsButton = this.add.text(width - 18, 18, "SET", {
      fontFamily: "Arial Black, Arial",
      fontSize: "13px",
      color: "#17345f",
      backgroundColor: "#ffffff",
      padding: { x: 10, y: 8 }
    }).setOrigin(1, 0).setDepth(70).setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      feedback.trigger("uiClick");
      settingsPanel.classList.toggle("is-open");
    });
    this.layoutTowerHud();
  }

  layoutTowerHud() {
    const { width } = this.scale;
    this.problemBanner.clear();
    this.problemBanner.fillStyle(0x17345f, 0.88);
    this.problemBanner.fillRoundedRect(24, 22, width - 48, 68, 10);
    this.problemBanner.lineStyle(3, 0xffffff, 0.82);
    this.problemBanner.strokeRoundedRect(24, 22, width - 48, 68, 10);
    this.problemText?.setX(width / 2);
    this.heightText?.setX(width - 18);
    this.comboText?.setX(width / 2);
    this.towerHintText?.setX(width / 2);
    this.floorFeedbackText?.setX(width / 2);
    this.settingsButton?.setX(width - 18);
  }

  createPlayer() {
    this.createTowerPlayer();
  }

  createTowerPlayer() {
    const { width, height } = this.scale;
    this.player = this.add.container(width / 2, height * 0.76).setDepth(42);
    const shadow = this.add.ellipse(0, 26, 62, 16, 0x17345f, 0.18);
    const sprite = this.createTowerCharacterSprite("towerPlayerIdle");
    if (sprite) {
      this.playerParts = { shadow, sprite };
      this.player.add([shadow, sprite]);
      this.updateTowerPlayerState("idle");
      return;
    }
    const body = this.add.circle(0, -2, 24, 0xffc84a, 1).setStrokeStyle(4, 0xffffff, 1);
    const face = this.add.circle(0, -9, 12, 0xfff1c7, 1);
    const hat = this.add.triangle(0, -30, -16, -12, 0, -42, 16, -12, 0x35a7ff, 1);
    const leftArm = this.add.rectangle(-20, 3, 8, 28, 0x3d7cff, 1).setAngle(-24);
    const rightArm = this.add.rectangle(20, 3, 8, 28, 0x3d7cff, 1).setAngle(24);
    this.playerParts = { shadow, body, face, hat, leftArm, rightArm };
    this.player.add([shadow, leftArm, rightArm, body, face, hat]);
    this.updateTowerPlayerState("idle");
  }

  createTowerCharacterSprite(key) {
    if (!this.hasTexture(key)) return null;
    return this.add.image(0, -10, key).setDisplaySize(86, 101);
  }

  updateTowerPlayerState(stateName) {
    if (!this.player || !this.playerParts) return;
    this.towerPlayerState = stateName;
    if (this.playerParts.sprite) {
      const key = stateName === "jump" ? "towerPlayerJump"
        : stateName === "land" ? "towerPlayerLand"
          : stateName === "wrong" ? "towerPlayerWrong"
            : stateName === "celebrate" ? "towerPlayerCelebrate"
              : "towerPlayerIdle";
      this.playerParts.sprite.setTexture(this.hasTexture(key) ? key : "towerPlayerIdle");
      this.player.setScale(stateName === "land" ? 1.08 : stateName === "jump" ? 1.04 : 1);
      this.player.setAngle(stateName === "wrong" ? -6 : 0);
      this.playerParts.shadow.setScale(stateName === "jump" ? 0.64 : stateName === "land" ? 1.2 : 1);
      return;
    }
    const { body, hat, leftArm, rightArm, shadow } = this.playerParts;
    this.player.setScale(1);
    this.player.setAngle(0);
    body.setFillStyle(stateName === "wrong" ? 0xff6b81 : stateName === "celebrate" ? 0x57e389 : 0xffc84a, 1);
    hat.setFillStyle(stateName === "land" ? 0x7b5cff : 0x35a7ff, 1);
    leftArm.setAngle(stateName === "jump" || stateName === "celebrate" ? -58 : -24);
    rightArm.setAngle(stateName === "jump" || stateName === "celebrate" ? 58 : 24);
    shadow.setScale(stateName === "jump" ? 0.64 : stateName === "land" ? 1.18 : 1);
    if (stateName === "wrong") this.player.setAngle(-6);
    if (stateName === "land") this.player.setScale(1.08, 0.9);
  }

  createCurrentBlock() {
    const { width, height } = this.scale;
    this.currentBlock = this.add.graphics().setDepth(18);
    this.drawBlockGraphic(this.currentBlock, width / 2, height * 0.81, 130, 42, 0x7b5cff, 0xffffff);
  }

  createRound() {
    towerState.roundState = "spawningNextFloor";
    towerState.floorTransition = false;
    towerState.floorTransitionProgress = 0;
    towerState.cameraOffsetY = 0;
    towerState.selectedBlockId = null;
    towerState.currentProblem = this.isTutorial
      ? { ...createTutorialProblem(this.tutorialStep === 4 ? 4 : 2), source: "tutorial" }
      : generateProblem({
        operations: state.operations,
        stageId: towerState.stageId,
        learningStats: loadLearningStats()
      });
    this.problemText.setText(`${towerState.currentProblem.question} = ?`);
    this.updateTutorialCopy();
    this.createAnswerBlocks();
    this.updateTowerHud();
    this.time.delayedCall(TOWER_BLOCK_SPAWN_MS + 40, () => {
      if (towerState.roundState === "spawningNextFloor") {
        towerState.roundState = "waitingForAnswer";
        this.setBlockInputEnabled(true);
      }
      this.updateDebugTowerStateOverlay();
    });
  }

  updateTutorialCopy(message) {
    if (!this.towerHintText) return;
    if (!this.isTutorial) {
      this.towerHintText.setText("Pick the correct block!\nCorrect answer = jump up!\nReach the top!");
      return;
    }
    const step = SKY_TOWER_TUTORIAL_STEPS[this.tutorialStep - 1] || SKY_TOWER_TUTORIAL_STEPS[0];
    this.towerHintText.setText(message || `${step.title}\n${step.detail}`);
    this.towerHintText.setAlpha(0.92);
  }

  createAnswerBlocks() {
    this.blockLayer.removeAll(true);
    towerState.currentBlocks = [];
    towerState.currentFloorBlocks = towerState.currentBlocks;
    towerState.nextFloorBlocks = [];
    const { width, height } = this.scale;
    const blockCount = this.isTutorial ? 2 : this.stage.blockCount;
    const choices = this.getTowerChoices(towerState.currentProblem, blockCount);
    const spread = blockCount === 2 ? width * 0.28 : width * 0.24;
    const startX = width / 2 - spread * (blockCount - 1) / 2;
    choices.forEach((answer, index) => {
      const block = {
        id: `block-${index + 1}`,
        answer,
        isCorrect: answer === towerState.currentProblem.answer,
        x: startX + spread * index,
        y: height * 0.42 + (index % 2) * 34,
        baseX: startX + spread * index,
        moveAmplitude: this.isTutorial && !SKY_TOWER_TUTORIAL_STEPS[this.tutorialStep - 1]?.moving ? 0 : 12 + this.stage.id * 2,
        moveSpeed: this.stage.blockSpeed + index * 0.07,
        visualState: "normal"
      };
      block.container = this.createAnswerBlock(block);
      towerState.currentBlocks.push(block);
    });
    towerState.currentFloorBlocks = towerState.currentBlocks;
    this.setBlockInputEnabled(false);
  }

  getTowerChoices(problem, blockCount) {
    const choices = [...problem.choices];
    while (choices.length < blockCount) {
      const offset = 2 + choices.length * 2;
      const wrong = Math.max(1, problem.answer + (choices.length % 2 ? -offset : offset));
      if (!choices.includes(wrong) && wrong !== problem.answer) choices.push(wrong);
      else choices.push(problem.answer + offset + 1);
    }
    return Phaser.Utils.Array.Shuffle(choices).slice(0, blockCount);
  }

  createAnswerBlock(block) {
    const container = this.add.container(block.x, block.y).setDepth(24);
    const g = this.add.graphics();
    const artKey = this.getTowerBlockTextureKey(block.visualState);
    const art = this.hasTexture(artKey) ? this.add.image(0, 0, artKey).setDisplaySize(TOWER_BLOCK_VISUAL_WIDTH, TOWER_BLOCK_VISUAL_HEIGHT) : null;
    const shadow = this.createBlockShadow(block);
    if (art) {
      g.setVisible(false);
    } else {
      this.drawFloatingBlock(g, block);
    }
    const label = this.add.text(0, -5, String(block.answer), {
      fontFamily: "Arial Black, Arial",
      fontSize: "36px",
      color: "#17345f",
      stroke: "#ffffff",
      strokeThickness: 6
    }).setOrigin(0.5);
    const zone = this.createBlockHitZone(block);
    zone.on("pointerdown", () => this.handleBlockSelection(block.id));
    zone.on("pointerover", () => {
      if (towerState.roundState === "waitingForAnswer" && block.visualState === "normal") {
        this.setBlockVisualState(block.id, "hover");
      }
    });
    zone.on("pointerout", () => {
      if (towerState.roundState === "waitingForAnswer" && block.visualState === "hover") {
        this.setBlockVisualState(block.id, "normal");
      }
    });
    container.add(art ? [shadow, art, g, label, zone] : [shadow, g, label, zone]);
    block.shadow = shadow;
    block.art = art;
    block.graphic = g;
    block.label = label;
    block.hitZone = zone;
    container.setAlpha(0);
    container.y = block.y - 80;
    this.tweens.add({
      targets: container,
      y: block.y,
      alpha: 1,
      duration: TOWER_BLOCK_SPAWN_MS,
      ease: "Back.easeOut"
    });
    return container;
  }

  createBlockShadow(block) {
    const shadow = this.add.graphics();
    block.shadow = shadow;
    this.updateBlockShadow(block);
    return shadow;
  }

  updateBlockShadow(block) {
    if (!block?.shadow) return;
    const progress = this.getAltitudeProgress();
    const glowColor = progress > 0.72 ? 0x8c7cff : progress > 0.45 ? 0x68d8ff : 0x3f79d8;
    const alpha = block.visualState === "correct" ? 0.34 : block.visualState === "selected" ? 0.3 : 0.2;
    block.shadow.clear();
    block.shadow.fillStyle(glowColor, alpha);
    block.shadow.fillEllipse(0, 43, TOWER_BLOCK_VISUAL_WIDTH * 0.82, 20);
    block.shadow.fillStyle(0xffffff, block.visualState === "correct" ? 0.18 : 0.08);
    block.shadow.fillEllipse(0, 38, TOWER_BLOCK_VISUAL_WIDTH * 0.56, 10);
  }

  createBlockHitZone(block) {
    const zone = this.add.zone(0, 0, TOWER_BLOCK_TOUCH_WIDTH, TOWER_BLOCK_TOUCH_HEIGHT).setInteractive({ useHandCursor: true });
    zone.setData("touchTarget", "answer-block");
    zone.setData("blockId", block.id);
    return zone;
  }

  updateBlockHitZone(block) {
    if (!block?.hitZone) return;
    block.hitZone.setSize(TOWER_BLOCK_TOUCH_WIDTH, TOWER_BLOCK_TOUCH_HEIGHT);
  }

  setBlockInputEnabled(enabled) {
    towerState.currentBlocks.forEach((block) => {
      if (block.hitZone?.input) block.hitZone.input.enabled = enabled;
    });
  }

  getTowerBlockTextureKey(visualState) {
    const glassKey = {
      hover: "towerBlockGlassSelected",
      selected: "towerBlockGlassSelected",
      correct: "towerBlockGlassCorrect",
      wrong: "towerBlockGlassWrong",
      crack: "towerBlockGlassCracked",
      locked: "towerBlockGlassLocked",
      normal: "towerBlockGlassNormal"
    }[visualState || "normal"];
    if (this.hasTexture(glassKey)) return glassKey;
    if (visualState === "selected" || visualState === "hover") return "towerBlockSelected";
    if (visualState === "correct") return "towerBlockCorrect";
    if (visualState === "wrong") return "towerBlockWrong";
    if (visualState === "crack") return "towerBlockCracked";
    if (visualState === "locked") return "towerBlockLocked";
    return "towerBlockNormal";
  }

  drawFloatingBlock(g, block) {
    g.clear();
    const color = block.visualState === "wrong" || block.visualState === "crack" ? 0xff5d73
      : block.visualState === "correct" ? 0x57e389
        : block.visualState === "selected" ? 0xffcf54
          : block.visualState === "hover" ? 0xf4fbff
            : 0xffffff;
    const stroke = block.visualState === "selected" ? 0xffcf54 : block.visualState === "correct" ? 0x47ff9f : 0x6bd4ff;
    this.drawBlockGraphic(g, 0, 0, 112, 58, color, stroke);
    if (block.visualState === "correct") {
      g.lineStyle(4, 0xffcf54, 0.68);
      g.strokeRoundedRect(-62, -34, 124, 68, 12);
    }
    if (block.visualState === "crack") {
      g.lineStyle(4, 0x8a1630, 0.9);
      g.lineBetween(-12, -22, 6, -4);
      g.lineBetween(6, -4, -4, 20);
      g.lineBetween(8, -18, 24, 8);
    }
  }

  updateAnswerBlockVisual(block) {
    if (!block?.container) return;
    if (block.art) {
      const key = this.getTowerBlockTextureKey(block.visualState);
      if (this.hasTexture(key)) block.art.setTexture(key);
    } else {
      this.drawFloatingBlock(block.graphic, block);
    }
    this.updateBlockShadow(block);
    block.label?.setColor(block.visualState === "wrong" || block.visualState === "crack" ? "#ffffff" : "#17345f");
    block.label?.setStroke(block.visualState === "wrong" || block.visualState === "crack" ? "#17345f" : "#ffffff", 6);
    block.label?.setScale(block.visualState === "selected" ? 1.08 : 1);
  }

  setBlockVisualState(blockId, visualState) {
    const block = towerState.currentBlocks.find((item) => item.id === blockId);
    if (!block) return;
    block.visualState = visualState;
    this.updateAnswerBlockVisual(block);
  }

  drawBlockGraphic(g, x, y, width, height, fill, stroke) {
    g.fillStyle(fill, 0.96);
    g.fillRoundedRect(x - width / 2, y - height / 2, width, height, 10);
    g.fillStyle(0x5d7bea, 0.22);
    g.fillRoundedRect(x - width / 2 + 8, y + height / 2 - 12, width - 16, 14, 6);
    g.lineStyle(3, stroke, 0.88);
    g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 10);
  }

  handleBlockSelection(blockId) {
    if (towerState.roundState !== "waitingForAnswer") return;
    const block = towerState.currentBlocks.find((item) => item.id === blockId);
    if (!block) return;
    this.setBlockInputEnabled(false);
    towerState.selectedBlockId = block.id;
    towerState.totalQuestions += 1;
    feedback.trigger("uiClick");
    this.setBlockVisualState(block.id, "selected");
    if (block.isCorrect) {
      this.jumpToCorrectBlock(block);
    } else {
      this.handleWrongBlock(block);
    }
  }

  jumpToCorrectBlock(block) {
    towerState.roundState = "jumping";
    towerState.isJumping = true;
    towerState.lastAnswerResult = "correct";
    towerState.combo += 1;
    towerState.bestCombo = Math.max(towerState.bestCombo, towerState.combo);
    towerState.correctAnswers += 1;
    towerState.score += 100 + towerState.combo * 20;
    if (shouldRecordLearningResult(towerState.currentProblem)) {
      saveLearningStats(updateLearningStats(loadLearningStats(), towerState.currentProblem, true, towerState.stageId));
    }
    this.setBlockVisualState(block.id, "correct");
    feedback.trigger("jump");
    this.playTowerJumpAnimation(null, block, () => {
      feedback.trigger("land");
      feedback.trigger("correct");
      towerState.currentHeight += 1;
      towerState.floorIndex += 1;
      towerState.isJumping = false;
      towerState.roundState = "landing";
      this.updateTowerPlayerState("land");
      this.updateTowerHud();
      this.showFloorUpFeedback();
      this.cameras.main.shake(90, 0.003);
      this.createLandingBurst(block.x, block.y);
      if (towerState.currentHeight >= towerState.targetHeight) {
        if (this.isTutorial) {
          this.completeTowerTutorial();
        } else {
          this.finishTowerRun(true, "Tower complete");
        }
      } else {
        this.time.delayedCall(TOWER_LANDING_FEEDBACK_MS, () => this.startFloorTransition(block));
      }
    });
  }

  showFloorUpFeedback() {
    if (!this.floorFeedbackText) return;
    if (this.hasTexture("towerFloorUpGlow")) {
      const glow = this.add.image(this.scale.width / 2, 196, "towerFloorUpGlow")
        .setDepth(61)
        .setAlpha(0.88)
        .setDisplaySize(170, 112);
      this.fxLayer.add(glow);
      this.tweens.add({
        targets: glow,
        y: 154,
        alpha: 0,
        scale: 1.22,
        duration: 620,
        ease: "Sine.easeOut",
        onComplete: () => glow.destroy()
      });
    }
    const message = towerState.currentHeight % 2 === 0 ? "FLOOR UP!" : "+1 STEP!";
    this.floorFeedbackText
      .setText(message)
      .setPosition(this.scale.width / 2, 198)
      .setAlpha(1)
      .setScale(0.82);
    this.tweens.add({
      targets: this.floorFeedbackText,
      y: 164,
      alpha: 0,
      scale: 1.14,
      duration: 680,
      ease: "Sine.easeOut",
      onComplete: () => this.floorFeedbackText?.setPosition(this.scale.width / 2, 198)
    });
    this.heightText?.setScale(1);
    this.tweens.add({
      targets: this.heightText,
      scale: 1.28,
      duration: 130,
      yoyo: true,
      ease: "Sine.easeOut"
    });
  }

  startFloorTransition(landedBlock) {
    towerState.roundState = "floorTransition";
    towerState.floorTransition = true;
    towerState.floorTransitionProgress = 0;
    towerState.cameraOffsetY = 0;
    towerState.previousFloorBlocks = towerState.currentBlocks.slice();
    const { width, height } = this.scale;
    const transition = { progress: 0 };
    const previousBlocks = towerState.previousFloorBlocks
      .filter((block) => block.id !== landedBlock.id)
      .map((block) => block.container)
      .filter(Boolean);
    this.tweens.add({
      targets: previousBlocks,
      y: "+=180",
      alpha: 0,
      duration: 450,
      ease: "Sine.easeIn"
    });
    this.tweens.add({
      targets: landedBlock.container,
      x: width / 2,
      y: height * 0.81,
      duration: TOWER_FLOOR_TRANSITION_MS,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: this.player,
      x: width / 2,
      y: height * 0.76,
      duration: TOWER_FLOOR_TRANSITION_MS,
      ease: "Sine.easeInOut"
    });
    this.tweens.add({
      targets: transition,
      progress: 1,
      duration: TOWER_FLOOR_TRANSITION_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        towerState.floorTransitionProgress = transition.progress;
        towerState.cameraOffsetY = transition.progress * 72;
        this.drawSkyTowerBackground();
        this.updateDebugTowerStateOverlay();
      },
      onComplete: () => {
        towerState.floorTransition = false;
        towerState.floorTransitionProgress = 1;
        towerState.cameraOffsetY = 0;
        towerState.roundState = "spawningNextFloor";
        this.drawSkyTowerBackground();
        this.player.setPosition(width / 2, height * 0.76);
        this.updateTowerPlayerState("idle");
        if (this.isTutorial) this.tutorialStep = Math.min(this.tutorialStep + 1, SKY_TOWER_TUTORIAL_STEPS.length);
        this.spawnNextFloor();
      }
    });
  }

  spawnNextFloor() {
    towerState.nextFloorBlocks = [];
    this.createRound();
  }

  completeTowerTutorial() {
    saveSkyTowerTutorialState();
    this.time.delayedCall(420, () => this.scene.start("tutorialComplete"));
  }

  playTowerJumpAnimation(_fromBlock, toBlock, onComplete) {
    this.updateTowerPlayerState("jump");
    const start = { x: this.player.x, y: this.player.y };
    const target = { x: toBlock.x, y: toBlock.y - 58 };
    const jump = { t: 0 };
    this.tweens.add({
      targets: jump,
      t: 1,
      duration: TOWER_JUMP_DURATION_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const t = jump.t;
        this.player.x = Phaser.Math.Linear(start.x, target.x, t);
        this.player.y = Phaser.Math.Linear(start.y, target.y, t) - Math.sin(t * Math.PI) * 78;
        this.player.setAngle(Math.sin(t * Math.PI * 2) * 7);
        this.player.setScale(1 + Math.sin(t * Math.PI) * 0.08);
      },
      onComplete: () => {
        this.player.setAngle(0);
        this.player.setScale(1);
        onComplete?.();
      }
    });
  }

  createLandingBurst(x, y) {
    if (this.hasTexture("towerLandingDust")) {
      const dust = this.add.image(x, y + 24, "towerLandingDust").setDepth(61).setAlpha(0.84).setDisplaySize(112, 56);
      this.fxLayer.add(dust);
      this.tweens.add({
        targets: dust,
        alpha: 0,
        scale: 1.35,
        duration: 360,
        ease: "Sine.easeOut",
        onComplete: () => dust.destroy()
      });
    }
    if (this.hasTexture("towerCorrectSparkle")) {
      const sparkle = this.add.image(x + 44, y - 42, "towerCorrectSparkle").setDepth(63).setAlpha(0.96).setDisplaySize(42, 42);
      this.fxLayer.add(sparkle);
      this.tweens.add({
        targets: sparkle,
        y: y - 72,
        alpha: 0,
        angle: 80,
        scale: 1.4,
        duration: 520,
        ease: "Sine.easeOut",
        onComplete: () => sparkle.destroy()
      });
    }
    for (let i = 0; i < 8; i += 1) {
      const particle = this.add.circle(x, y + 12, 4, i % 2 ? 0xffcf54 : 0xffffff, 0.9).setDepth(62);
      this.fxLayer.add(particle);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(i / 8 * Math.PI * 2) * 34,
        y: y + 12 + Math.sin(i / 8 * Math.PI * 2) * 18,
        alpha: 0,
        scale: 0.3,
        duration: 360,
        ease: "Sine.easeOut",
        onComplete: () => particle.destroy()
      });
    }
  }

  handleWrongBlock(block) {
    towerState.roundState = "feedback";
    towerState.lastAnswerResult = "wrong";
    towerState.isJumping = false;
    towerState.floorTransition = false;
    towerState.floorTransitionProgress = 0;
    towerState.combo = 0;
    this.applyWrongAnswerPenalty();
    if (shouldRecordLearningResult(towerState.currentProblem)) {
      saveLearningStats(updateLearningStats(loadLearningStats(), towerState.currentProblem, false, towerState.stageId));
    }
    this.setBlockVisualState(block.id, "crack");
    this.createWrongFlash(block.x, block.y);
    this.showStepDownFeedback();
    this.updateTowerPlayerState("wrong");
    feedback.trigger("wrong");
    this.cameras.main.shake(120, 0.004);
    this.tweens.add({
      targets: block.container,
      x: { from: block.x - 10, to: block.x + 10 },
      duration: 55,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        block.container.x = block.x;
        this.updateTowerHud();
        if (towerState.lives <= 0) {
          this.finishTowerRun(false, "No hearts left");
        } else {
          this.continueAfterWrongAnswer({ retrySameRound: this.isTutorial });
        }
      }
    });
  }

  applyWrongAnswerPenalty() {
    if (this.isTutorial) return;
    towerState.lives = Math.max(0, towerState.lives - 1);
    towerState.currentHeight = Math.max(0, towerState.currentHeight - 1);
    towerState.floorIndex = Math.max(0, towerState.floorIndex - 1);
  }

  showStepDownFeedback() {
    if (!this.floorFeedbackText) return;
    this.floorFeedbackText
      .setText("-1 STEP")
      .setPosition(this.scale.width / 2, 214)
      .setAlpha(1)
      .setScale(0.76);
    this.tweens.add({
      targets: this.floorFeedbackText,
      y: 248,
      alpha: 0,
      scale: 1.03,
      duration: 560,
      ease: "Sine.easeOut",
      onComplete: () => this.floorFeedbackText?.setPosition(this.scale.width / 2, 198)
    });
    this.heightText?.setAngle(0);
    this.tweens.add({
      targets: this.heightText,
      angle: { from: -3, to: 3 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onComplete: () => this.heightText?.setAngle(0)
    });
  }

  continueAfterWrongAnswer({ retrySameRound = false } = {}) {
    towerState.selectedBlockId = null;
    towerState.isJumping = false;
    towerState.floorTransition = false;
    towerState.floorTransitionProgress = 0;
    towerState.cameraOffsetY = 0;
    this.updateTowerPlayerState("idle");

    if (retrySameRound) {
      this.updateTutorialCopy("It's okay! Try again.\nPick the safe answer block.");
      towerState.currentBlocks.forEach((block) => {
        block.visualState = "normal";
        this.updateAnswerBlockVisual(block);
      });
      this.updateTowerHud();
      towerState.roundState = "waitingForAnswer";
      this.setBlockInputEnabled(true);
      this.updateDebugTowerStateOverlay();
      return;
    }

    towerState.roundState = "spawningNextFloor";
    this.time.delayedCall(180, () => this.spawnNextFloor());
  }

  updateTowerHud() {
    const fullHeart = "\u2665";
    const emptyHeart = "\u2661";
    const maxLives = towerState.maxLives || 3;
    this.livesText.setText(`${fullHeart.repeat(towerState.lives)}${emptyHeart.repeat(Math.max(0, maxLives - towerState.lives))}`);
    this.heightText.setText(`${towerState.currentHeight} / ${towerState.targetHeight}`);
    this.comboText.setText(towerState.combo ? `COMBO x${towerState.combo}` : this.isTutorial ? `Practice ${this.tutorialStep} / ${SKY_TOWER_TUTORIAL_STEPS.length}` : this.stage.name);
    this.scoreText?.setText(`Score ${towerState.score}`);
    this.towerHintText?.setAlpha(this.isTutorial || towerState.currentHeight < 2 ? 0.84 : 0);
  }

  createWrongFlash(x, y) {
    if (!this.hasTexture("towerWrongCrackFlash")) return;
    const flash = this.add.image(x, y - 6, "towerWrongCrackFlash").setDepth(63).setAlpha(0.92).setDisplaySize(120, 80);
    this.fxLayer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.18,
      duration: 320,
      ease: "Sine.easeOut",
      onComplete: () => flash.destroy()
    });
  }

  createDebugTowerStateOverlay() {
    if (!DEBUG_TOWER_STATE_ENABLED) return;
    this.debugTowerStateText = this.add.text(12, 238, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ffffff",
      backgroundColor: "rgba(23,52,95,0.72)",
      padding: { x: 7, y: 6 }
    }).setDepth(120);
    this.updateDebugTowerStateOverlay();
  }

  updateDebugTowerStateOverlay() {
    if (!this.debugTowerStateText) return;
    const progress = loadProgress();
    const currentAnswers = towerState.currentBlocks
      .map((block) => `${block.answer}${block.isCorrect ? "*" : ""}`)
      .join(", ");
    this.debugTowerStateText.setText([
      "debugTowerState=1",
      `tutorialComplete: ${Boolean(loadSkyTowerTutorialState())}`,
      `activeStageId: ${towerState.stageId}`,
      `unlockedStage: ${progress.unlockedStage}`,
      `floorIndex: ${towerState.floorIndex}`,
      `floorTransition: ${towerState.floorTransition}`,
      `floorTransitionProgress: ${towerState.floorTransitionProgress.toFixed(2)}`,
      `cameraOffsetY: ${Math.round(towerState.cameraOffsetY)}`,
      `roundState: ${towerState.roundState}`,
      `selectedBlockId: ${towerState.selectedBlockId || "-"}`,
      `isJumping: ${towerState.isJumping}`,
      `currentHeight: ${towerState.currentHeight}`,
      `targetHeight: ${towerState.targetHeight}`,
      `height: ${towerState.currentHeight}/${towerState.targetHeight}`,
      `lives: ${towerState.lives}/${towerState.maxLives || 3}`,
      `blockCount: ${towerState.currentBlocks.length || this.stage?.blockCount || 0}`,
      `blockSpeed: ${(towerState.blockSpeed || 0).toFixed(2)}`,
      `easyPlaytest: ${EASY_PLAYTEST_ENABLED}`,
      `lastAnswerResult: ${towerState.lastAnswerResult || "-"}`,
      `currentProblem: ${towerState.currentProblem?.question || "-"}`,
      `currentBlocks answers: ${currentAnswers || "-"}`
    ].join("\n"));
  }

  finishTowerRun(cleared, reason) {
    if (towerState.roundState === "stageClear" || towerState.roundState === "gameOver") return;
    towerState.roundState = cleared ? "stageClear" : "gameOver";
    this.updateTowerPlayerState(cleared ? "celebrate" : "wrong");
    const accuracy = towerState.totalQuestions ? Math.round((towerState.correctAnswers / towerState.totalQuestions) * 100) : 0;
    const stars = calculateStars({ cleared, accuracy, bestCombo: towerState.bestCombo });
    const result = {
      cleared,
      reason,
      stageId: towerState.stageId,
      stageName: this.stage.name,
      nextStageId: cleared && towerState.stageId < SKY_TOWER_STAGES.length ? towerState.stageId + 1 : null,
      score: towerState.score,
      correctAnswers: towerState.correctAnswers,
      totalQuestions: towerState.totalQuestions,
      accuracy,
      bestCombo: towerState.bestCombo,
      temp: towerState.lives,
      lives: towerState.lives,
      heightReached: towerState.currentHeight,
      targetHeight: towerState.targetHeight,
      stars,
      learningSummary: summarizeLearningStats(loadLearningStats())
    };
    if (cleared) saveProgress(mergeStageResult(loadProgress(), towerState.stageId, result));
    feedback.trigger(cleared ? "stageClear" : "gameOver");
    this.time.delayedCall(500, () => this.scene.start("result", result));
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
    this.createDebugMtbReadOverlay();
    this.createDebugRaceFeelOverlay();
    if (state.mode === "tutorial") {
      this.createGatePair(true);
    } else {
      this.scheduleNextMathGate(this.time.now, true);
    }
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
    this.courseTape = [];
    this.coursePoles = [];
    this.courseArrows = [];
    this.rampProps = [];
    this.decorativeCourseObjects = [];
    this.parallaxScroll = 0;
    this.createParallaxLayers();
    this.sky = this.add.graphics();
    this.mountainBack = this.add.graphics();
    this.track = this.add.graphics();
    this.trackTapeFx = this.add.graphics().setDepth(6);
    this.trackFx = this.add.graphics().setDepth(5);
    this.riderFx = this.add.graphics().setDepth(16);
    this.feedbackFx = this.add.graphics().setDepth(70);
    this.speedFx = this.add.graphics().setDepth(18);

    for (let i = 0; i < 34; i += 1) {
      const line = this.add.rectangle(0, 0, 92, 3, 0xe8f6ff, 0.2).setOrigin(0.5).setDepth(4);
      this.trackLines.push(line);
    }

    const lowEffects = state.performance.lowEffectsMode;
    const densityScale = this.getDecorativeDensityScale();
    const snowCount = Math.max(14, Math.round((lowEffects ? 22 : 46) * densityScale));
    const propCount = Math.max(8, Math.round((lowEffects ? 12 : 24) * densityScale));
    const speedLineCount = Math.max(6, Math.round((lowEffects ? 8 : 18) * densityScale));

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
      prop.setData("kind", i % 10);
      this.props.push(prop);
    }

    for (let i = 0; i < 8; i += 1) {
      const tape = this.hasTexture("mtbTrackTape") ? this.add.image(0, 0, "mtbTrackTape").setDepth(8) : this.add.graphics().setDepth(8);
      tape.setData("side", i % 2 === 0 ? -1 : 1);
      tape.setData("offset", i * 118);
      this.courseTape.push(tape);
    }

    for (let i = 0; i < 12; i += 1) {
      const pole = this.hasTexture("mtbCoursePole") ? this.add.image(0, 0, "mtbCoursePole").setDepth(8) : this.add.graphics().setDepth(8);
      pole.setData("side", i % 2 === 0 ? -1 : 1);
      pole.setData("offset", i * 72 + 28);
      this.coursePoles.push(pole);
    }

    for (let i = 0; i < 8; i += 1) {
      const arrow = this.hasTexture("mtbCourseArrowBlue") ? this.add.image(0, 0, "mtbCourseArrowBlue").setDepth(7) : this.add.graphics().setDepth(7);
      arrow.setData("side", i % 2 === 0 ? -1 : 1);
      arrow.setData("offset", i * 136 + 82);
      arrow.setData("variant", i % 2);
      this.courseArrows.push(arrow);
    }

    for (let i = 0; i < 3; i += 1) {
      const ramp = this.hasTexture("mtbJumpRamp") ? this.add.image(0, 0, "mtbJumpRamp").setDepth(9) : this.add.graphics().setDepth(9);
      ramp.setData("offset", i * 320 + 210);
      this.rampProps.push(ramp);
    }

    this.createCourseObjectPool();

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
    const densityScale = this.getDecorativeDensityScale();
    this.snow.forEach((item, index) => item.setVisible(!lowEffects || index < 22));
    this.props.forEach((item, index) => item.setVisible(!lowEffects || index < 10));
    this.speedLines.forEach((item, index) => item.setVisible(!lowEffects || index < 8));
    this.courseTape.forEach((item, index) => item.setVisible(index < Math.ceil(this.courseTape.length * densityScale) && (!lowEffects || index < 4)));
    this.coursePoles.forEach((item, index) => item.setVisible(index < Math.ceil(this.coursePoles.length * densityScale) && (!lowEffects || index < 6)));
    this.courseArrows.forEach((item, index) => item.setVisible(index < Math.ceil(this.courseArrows.length * densityScale) && (!lowEffects || index < 4)));
    this.decorativeCourseObjects.forEach((item, index) => item.setVisible(index < Math.ceil(this.decorativeCourseObjects.length * densityScale) && (!lowEffects || index < Math.ceil(this.decorativeCourseObjects.length * 0.55))));
    this.rampProps.forEach((item, index) => item.setVisible(!lowEffects || index < 1));
  }

  getDecorativeDensityScale() {
    const simplified = FIRST_PERSON_SIMPLIFIED_TRACK ? 0.62 : 1;
    const lowEffects = state.performance.lowEffectsMode ? 0.72 : 1;
    return simplified * lowEffects;
  }

  getStageDecorationProfile() {
    const profiles = {
      // Stage 1 Snow Trail: snow banks first, light trees.
      1: { key: "snowTrail", count: 16, pine: 2, snow: 6, rock: 2, ice: 1, banner: 1, flag: 4, speed: 0.92 },
      // Stage 2 Forest Rush: more pines and tape-side flags.
      2: { key: "forestRush", count: 22, pine: 8, snow: 3, rock: 3, ice: 1, banner: 2, flag: 5, speed: 1.0 },
      // Stage 3 Ice Bridge: ice and cold trackside objects read first.
      3: { key: "iceBridge", count: 22, pine: 3, snow: 4, rock: 2, ice: 7, banner: 2, flag: 4, speed: 1.04 },
      // Stage 4 Alpine Jump: checkpoint flags and banners around ramps.
      4: { key: "alpineJump", count: 24, pine: 3, snow: 4, rock: 4, ice: 2, banner: 4, flag: 7, speed: 1.08 },
      // Stage 5 Storm Descent: dense race dressing without changing gameplay.
      5: { key: "stormDescent", count: 26, pine: 5, snow: 4, rock: 4, ice: 3, banner: 5, flag: 5, speed: 1.14 }
    };
    return profiles[state.stage.id] || profiles[1];
  }

  createParallaxLayers() {
    this.parallaxLayers = {
      farMountains: this.add.graphics().setDepth(1),
      midForest: this.add.graphics().setDepth(2),
      nearCourse: this.add.graphics().setDepth(6)
    };
  }

  updateParallaxLayers(delta, speedFactor) {
    this.parallaxScroll = (this.parallaxScroll + delta * 0.026 * speedFactor) % 1000;
    this.drawFarMountains(this.parallaxScroll * 0.12);
    this.drawMidForest(this.parallaxScroll * 0.36);
    this.drawNearCourseDecorations(this.parallaxScroll * 0.82);
  }

  drawFarMountains(scroll = 0) {
    const { width, height } = this.scale;
    const g = this.parallaxLayers?.farMountains || this.mountainBack;
    if (!g) return;
    const offset = (scroll % 36) - 18;
    g.clear();
    g.fillStyle(0x183a57, 0.88);
    g.fillTriangle(-58 + offset, height * 0.48, width * 0.28 + offset, height * 0.14, width * 0.68 + offset, height * 0.48);
    g.fillStyle(0x245d78, 0.8);
    g.fillTriangle(width * 0.1 - offset, height * 0.5, width * 0.7 - offset, height * 0.1, width + 70 - offset, height * 0.5);
    g.fillStyle(0xe8f6ff, 0.92);
    g.fillTriangle(width * 0.22 + offset, height * 0.2, width * 0.28 + offset, height * 0.14, width * 0.37 + offset, height * 0.24);
    g.fillTriangle(width * 0.62 - offset, height * 0.16, width * 0.7 - offset, height * 0.1, width * 0.8 - offset, height * 0.22);
  }

  drawMidForest(scroll = 0) {
    const { width, height } = this.scale;
    const g = this.parallaxLayers?.midForest;
    if (!g) return;
    const count = Math.max(4, Math.round((state.performance.lowEffectsMode ? 7 : 13) * this.getDecorativeDensityScale()));
    g.clear();
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const y = height * 0.28 + ((scroll + i * 57) % (height * 0.3));
      const scale = this.getPerspectiveScale(y) * 0.72;
      const x = this.getTrackEdgeX(y, side, width * 0.18 + scale * 24);
      g.fillStyle(0x0b312d, 0.62);
      g.fillTriangle(x, y - 38 * scale, x - 18 * scale, y + 16 * scale, x + 18 * scale, y + 16 * scale);
      g.fillStyle(0xdff6ff, 0.24);
      g.fillRect(x - 12 * scale, y - 2 * scale, 24 * scale, 5 * scale);
    }
  }

  drawNearCourseDecorations(scroll = 0) {
    const { height } = this.scale;
    const g = this.parallaxLayers?.nearCourse;
    if (!g) return;
    g.clear();
    const count = Math.max(3, Math.round((state.performance.lowEffectsMode ? 4 : 9) * this.getDecorativeDensityScale()));
    for (let i = 0; i < count; i += 1) {
      const y = height * 0.42 + ((scroll + i * 92) % (height * 0.48));
      const scale = this.getPerspectiveScale(y);
      const center = this.getTrackCenterAtY(y);
      const widthAtY = this.getTrackWidthAtY(y);
      g.lineStyle(Math.max(1, 2 * scale), i % 2 ? 0x35d4ff : 0xff8b20, 0.18);
      g.lineBetween(center - widthAtY * 0.38, y, center - widthAtY * 0.16, y + 26 * scale);
      g.lineBetween(center + widthAtY * 0.38, y, center + widthAtY * 0.16, y + 26 * scale);
    }
  }

  createCourseObjectPool() {
    this.decorativeCourseObjects = [];
    const profile = this.getStageDecorationProfile();
    const count = Math.max(8, Math.ceil((state.performance.lowEffectsMode ? profile.count * 0.58 : profile.count) * this.getDecorativeDensityScale()));
    const types = [
      ...Array(profile.pine).fill("pine"),
      ...Array(profile.snow).fill("snow-bank"),
      ...Array(profile.rock).fill("rock"),
      ...Array(profile.ice).fill("ice-patch"),
      ...Array(profile.banner).fill("banner"),
      ...Array(profile.flag).fill("checkpoint-flag")
    ];
    for (let i = 0; i < count; i += 1) {
      const type = types[i % types.length] || "snow-bank";
      const side = i % 2 === 0 ? -1 : 1;
      const object = this.spawnDecorativeCourseObject(type, side, i * 78 + 36);
      this.decorativeCourseObjects.push(object);
    }
  }

  spawnDecorativeCourseObject(type, laneOrSide, y) {
    const textureMap = {
      pine: laneOrSide < 0 ? "mtbPineNear" : "mtbPineFar",
      "snow-bank": y % 2 ? "mtbSnowBankLarge" : "mtbSnowBankSmall",
      rock: "mtbRockTrackside",
      "ice-patch": "mtbIcePatchTrackside",
      banner: "mtbBannerMathSpeed",
      "checkpoint-flag": y % 3 ? "mtbCheckpointFlag" : "mtbSpectatorFlag"
    };
    const key = textureMap[type] || "mtbSnowBankSmall";
    const object = this.hasTexture(key) ? this.add.image(0, 0, key).setDepth(7) : this.add.graphics().setDepth(7);
    object.setData("decorative", true);
    object.setData("type", type);
    object.setData("side", laneOrSide);
    object.setData("offset", y);
    object.setData("textureKey", key);
    return object;
  }

  recycleCourseObject(object) {
    const profile = this.getStageDecorationProfile();
    object.setData("offset", object.getData("offset") + profile.count * 78);
  }

  getPerspectiveScale(y) {
    const { height } = this.scale;
    const horizonY = height * 0.31;
    const t = Phaser.Math.Clamp((y - horizonY) / (height - horizonY), 0, 1);
    return Phaser.Math.Linear(0.35, 1.25, t);
  }

  getTrackCenterAtY(y) {
    const { width, height } = this.scale;
    const t = Phaser.Math.Clamp((y - height * 0.31) / (height * 0.69), 0, 1);
    return width / 2 + Math.sin(t * Math.PI * 1.05) * width * 0.035;
  }

  getTrackWidthAtY(y) {
    const { width, height } = this.scale;
    const topTrackWidth = width * 0.23;
    const bottomTrackWidth = width * 1.62;
    const t = Phaser.Math.Clamp((y - height * 0.31) / (height * 0.69), 0, 1);
    return Phaser.Math.Linear(topTrackWidth, bottomTrackWidth, t);
  }

  getTrackEdgeX(y, side, padding = 0) {
    return this.getTrackCenterAtY(y) + side * (this.getTrackWidthAtY(y) / 2 + padding);
  }

  drawPseudo3DTrack() {
    const { width, height } = this.scale;
    const horizonY = height * 0.31;
    const topY = horizonY + 5;
    const bottomY = height + 26;
    const topCenter = this.getTrackCenterAtY(topY);
    const bottomCenter = this.getTrackCenterAtY(bottomY);
    const topWidth = this.getTrackWidthAtY(topY);
    const bottomWidth = this.getTrackWidthAtY(bottomY);

    this.track.clear();
    this.track.fillStyle(0xe7f5ff, 0.5);
    this.track.beginPath();
    this.track.moveTo(topCenter - topWidth * 0.72, topY - 10);
    this.track.lineTo(topCenter + topWidth * 0.72, topY - 10);
    this.track.lineTo(bottomCenter + bottomWidth * 0.6, bottomY);
    this.track.lineTo(bottomCenter - bottomWidth * 0.6, bottomY);
    this.track.closePath();
    this.track.fillPath();

    this.track.fillGradientStyle(0x1a3b53, 0x1a3b53, 0x09131e, 0x09131e, 1);
    this.track.beginPath();
    this.track.moveTo(topCenter - topWidth * 0.5, topY);
    this.track.lineTo(topCenter + topWidth * 0.5, topY);
    this.track.lineTo(bottomCenter + bottomWidth * 0.5, bottomY);
    this.track.lineTo(bottomCenter - bottomWidth * 0.5, bottomY);
    this.track.closePath();
    this.track.fillPath();

    this.track.fillStyle(0xdaf2ff, 0.18);
    this.track.beginPath();
    this.track.moveTo(topCenter - topWidth * 0.1, topY + 4);
    this.track.lineTo(topCenter + topWidth * 0.1, topY + 4);
    this.track.lineTo(bottomCenter + bottomWidth * 0.18, bottomY);
    this.track.lineTo(bottomCenter - bottomWidth * 0.18, bottomY);
    this.track.closePath();
    this.track.fillPath();

    this.track.lineStyle(2, 0x7ee8ff, 0.25);
    for (let lane = -2; lane <= 2; lane += 1) {
      const topX = topCenter + lane * topWidth * 0.12;
      const bottomX = bottomCenter + lane * bottomWidth * 0.13;
      this.track.lineBetween(topX, topY + 6, bottomX, bottomY);
    }

    this.track.lineStyle(7, 0xf6fbff, 0.52);
    this.track.lineBetween(this.getTrackEdgeX(topY + 48, -1, 8), topY + 48, this.getTrackEdgeX(height * 0.88, -1, 20), height * 0.88);
    this.track.lineBetween(this.getTrackEdgeX(topY + 48, 1, 8), topY + 48, this.getTrackEdgeX(height * 0.88, 1, 20), height * 0.88);
    this.track.lineStyle(4, 0xff7a18, 0.62);
    this.track.lineBetween(this.getTrackEdgeX(topY + 62, -1, 14), topY + 62, this.getTrackEdgeX(height * 0.92, -1, 30), height * 0.92);
    this.track.lineBetween(this.getTrackEdgeX(topY + 62, 1, 14), topY + 62, this.getTrackEdgeX(height * 0.92, 1, 30), height * 0.92);

    this.trackFx.clear();
    for (let i = 0; i < 9; i += 1) {
      const y = Phaser.Math.Linear(topY + 18, height * 0.96, i / 8);
      const scale = this.getPerspectiveScale(y);
      const center = this.getTrackCenterAtY(y);
      const widthAtY = this.getTrackWidthAtY(y);
      this.trackFx.lineStyle(Math.max(1, scale * 2.2), 0x9ecbe0, 0.18 + scale * 0.08);
      this.trackFx.lineBetween(center - widthAtY * 0.08, y, center - widthAtY * 0.14, y + 18 * scale);
      this.trackFx.lineBetween(center + widthAtY * 0.08, y, center + widthAtY * 0.14, y + 18 * scale);
      if (i % 3 === 1) {
        this.trackFx.fillStyle(0x8be7ff, 0.16);
        this.trackFx.fillEllipse(center + widthAtY * 0.22, y + 4, 34 * scale, 10 * scale);
      }
    }

    if (this.hasTexture("mtbTireTracks")) {
      this.tireTrackLeft?.destroy();
      this.tireTrackRight?.destroy();
      const trackCenter = this.getTrackCenterAtY(height * 0.66);
      this.tireTrackLeft = this.add.image(trackCenter - width * 0.12, height * 0.66, "mtbTireTracks").setDisplaySize(width * 0.24, height * 0.52).setDepth(5).setAlpha(0.42);
      this.tireTrackRight = this.add.image(trackCenter + width * 0.12, height * 0.66, "mtbTireTracks").setDisplaySize(width * 0.24, height * 0.52).setDepth(5).setAlpha(0.42).setFlipX(true);
    }
  }

  drawWorld() {
    const { width, height } = this.scale;

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

    this.drawPseudo3DTrack();
  }

  createRider() {
    if (FIRST_PERSON_MTB_VIEW) {
      this.createMtbCockpit();
      return;
    }
    const { width, height } = this.scale;
    this.rider = this.add.container(width / 2, height * 0.79).setDepth(20);
    this.flame = this.hasTexture("boostFlame") ? this.add.image(-82, 18, "boostFlame").setDisplaySize(72, 104).setAlpha(0) : this.add.graphics();
    this.shadow = this.hasTexture("bikeShadow")
      ? this.add.image(0, 74, "bikeShadow").setDisplaySize(178, 38).setAlpha(0.78)
      : this.add.ellipse(0, 74, 166, 28, 0x000000, 0.34);
    const riderTexture = this.hasTexture("riderMtbLarge") ? "riderMtbLarge" : this.hasTexture("riderMtb") ? "riderMtb" : "rider";
    this.riderSprite = this.hasTexture(riderTexture) ? this.add.image(0, 0, riderTexture).setDisplaySize(232, 168) : null;
    this.bike = this.riderSprite ? null : this.add.graphics();
    this.body = this.riderSprite ? null : this.add.graphics();
    this.rider.add([this.flame, this.shadow, this.riderSprite, this.bike, this.body].filter(Boolean));
    this.drawRider(0);
  }

  createMtbCockpit() {
    const { width } = this.scale;
    this.visualMode = this.getFirstPersonVisualMode();
    this.rider = this.add.container(width / 2, this.getRiderBaseY()).setDepth(24);
    this.shadow = this.hasTexture("bikeShadow")
      ? this.add.image(0, -16, "bikeShadow").setDisplaySize(width * 0.46, 28).setAlpha(0.28)
      : this.add.ellipse(0, -16, width * 0.42, 24, 0x000000, 0.24);
    this.flame = this.hasTexture("boostFlame") ? this.add.image(-80, -82, "boostFlame").setDisplaySize(58, 96).setAlpha(0) : this.add.graphics();
    const cockpitKey = this.getCockpitTextureKey(0);
    this.cockpitSprite = this.hasTexture(cockpitKey) ? this.add.image(0, 0, cockpitKey).setOrigin(0.5, 1) : null;
    this.riderSprite = this.cockpitSprite || (this.hasTexture("riderMtbLarge") ? this.add.image(0, -38, "riderMtbLarge").setOrigin(0.5, 1) : null);
    this.cockpitGraphics = this.riderSprite ? null : this.add.graphics();
    this.bike = null;
    this.body = null;
    this.rider.add([this.shadow, this.flame, this.riderSprite, this.cockpitGraphics].filter(Boolean));
    this.drawRider(0);
  }

  createCockpitView() {
    return this.createMtbCockpit();
  }

  drawRider(lean) {
    if (FIRST_PERSON_MTB_VIEW) {
      this.updateMtbCockpit(lean);
      return;
    }
    if (this.riderSprite) {
      const textureGetter = this.getRiderTextureKey;
      const key = textureGetter.call(this, lean);
      if (this.hasTexture(key) && this.riderSprite.texture.key !== key) this.riderSprite.setTexture(key);
      const size = this.getRiderDisplaySize(key);
      this.riderSprite.setDisplaySize(size.width, size.height);
      this.riderSprite.setAngle(key === "riderMtbLeanLeft" || key === "riderMtbLeanRight" ? 0 : lean * 4);
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

  updateMtbCockpit(lean) {
    const { width, height } = this.scale;
    this.visualMode = this.getFirstPersonVisualMode();
    const key = this.getCockpitTextureKey(lean);
    const childX = width / 2 - this.rider.x + lean * 8;
    const liftRatio = Phaser.Math.Clamp((this.getRiderBaseY() - this.rider.y) / (height * 0.19), 0, 1);
    const displayHeight = height * this.getCockpitScreenHeightRatio();
    const displayWidth = Math.min(width * 1.14, displayHeight * 1.86);
    const leanAngle = Phaser.Math.Clamp(lean * 5.5, -7, 7);

    if (this.riderSprite) {
      this.setCockpitTexture(key);
      this.riderSprite
        .setPosition(childX, 8 - liftRatio * 22 + state.riderLandPulse * 8)
        .setDisplaySize(displayWidth, displayHeight)
        .setAngle(key === "mtbCockpitSvg" ? leanAngle : leanAngle * 0.7)
        .setAlpha(this.visualMode === "rider-svg" ? 0.84 : 1);
    } else {
      this.drawCockpitGraphics(childX, lean, displayWidth, displayHeight, liftRatio);
    }

    this.shadow
      ?.setPosition(childX, -18 + liftRatio * 20)
      .setScale(1 - liftRatio * 0.45 + state.riderLandPulse * 0.18, 1 - liftRatio * 0.5 + state.riderLandPulse * 0.12)
      .setAlpha(0.24 - liftRatio * 0.1 + state.riderLandPulse * 0.14);
    if (this.flame?.setAlpha) this.flame.setAlpha(state.boost > 8 || state.boostPulse > 0 ? 0.76 : 0);
    if (this.flame?.setPosition) this.flame.setPosition(childX - width * 0.18, -displayHeight * 0.42);
  }

  updateCockpitView(lean) {
    return this.updateMtbCockpit(lean);
  }

  setCockpitTexture(key) {
    if (!this.riderSprite || !this.hasTexture(key)) return;
    if (this.riderSprite.texture.key !== key) this.riderSprite.setTexture(key);
  }

  drawCockpitGraphics(x, lean, displayWidth, displayHeight, liftRatio) {
    const g = this.cockpitGraphics;
    if (!g) return;
    const y = -liftRatio * 20;
    const barWidth = displayWidth * 0.72;
    g.clear();
    g.setPosition(x, y);
    g.setRotation(Phaser.Math.DegToRad(lean * 5));
    g.lineStyle(9, 0xdff8ff, 1);
    g.lineBetween(-barWidth * 0.5, -displayHeight * 0.42, barWidth * 0.5, -displayHeight * 0.42);
    g.lineStyle(6, 0x06101e, 1);
    g.lineBetween(-barWidth * 0.38, -displayHeight * 0.38, -barWidth * 0.18, -displayHeight * 0.2);
    g.lineBetween(barWidth * 0.38, -displayHeight * 0.38, barWidth * 0.18, -displayHeight * 0.2);
    g.fillStyle(0x101828, 1);
    g.fillRoundedRect(-barWidth * 0.58, -displayHeight * 0.49, 70, 36, 14);
    g.fillRoundedRect(barWidth * 0.38, -displayHeight * 0.49, 70, 36, 14);
    g.fillStyle(0xff7a18, 1);
    g.fillRoundedRect(-barWidth * 0.2, -displayHeight * 0.58, barWidth * 0.4, 34, 12);
    g.lineStyle(12, 0x17253a, 0.9);
    g.lineBetween(-34, -displayHeight * 0.16, -18, 0);
    g.lineBetween(34, -displayHeight * 0.16, 18, 0);
    g.lineStyle(16, 0x07111f, 0.86);
    g.beginPath();
    g.arc(0, 8, displayWidth * 0.18, Math.PI * 1.08, Math.PI * 1.92);
    g.strokePath();
  }

  getRiderTextureKey(lean) {
    if (state.jumping) return this.firstTextureKey(["riderMtbJumpState", "riderMtbJump", "riderJump"]);
    if (state.riderLandPulse > 0) return this.firstTextureKey(["riderMtbLand", "riderMtbLarge", "riderMtb", "rider"]);
    if (state.riderSlidePulse > 0 || state.warningPulse > 0.45) return this.firstTextureKey(["riderMtbSlide", "riderMtbLarge", "riderMtb", "rider"]);
    if (state.boost > 8 || state.boostPulse > 0) return this.firstTextureKey(["riderMtbBoostState", "riderMtbBoost", "riderBoost"]);
    if (lean < -0.25) return this.firstTextureKey(["riderMtbLeanLeft", "riderMtbLarge", "riderMtb", "rider"]);
    if (lean > 0.25) return this.firstTextureKey(["riderMtbLeanRight", "riderMtbLarge", "riderMtb", "rider"]);
    return this.firstTextureKey(["riderMtbLarge", "riderMtb", "rider"]);
  }

  firstTextureKey(keys) {
    return keys.find((key) => this.hasTexture(key)) || "rider";
  }

  getCockpitTextureKey(lean) {
    const cockpitState = this.getCockpitState(lean);
    const pngStateKeys = {
      jump: ["mtbCockpitJump"],
      land: ["mtbCockpitLand"],
      boost: ["mtbCockpitBoost"],
      left: ["mtbCockpitLeft"],
      right: ["mtbCockpitRight"],
      slide: lean < -0.1 ? ["mtbCockpitLeft"] : lean > 0.1 ? ["mtbCockpitRight"] : ["mtbCockpitNormal"],
      normal: ["mtbCockpitNormal"]
    }[cockpitState] || ["mtbCockpitNormal"];
    return this.firstTextureKey([...pngStateKeys, "mtbCockpitSvg", "riderMtbLarge", "rider"]);
  }

  getCockpitState(lean = 0) {
    if (state.jumping || state.raceFeel.isAirborne) return "jump";
    if (state.riderLandPulse > 0 || state.raceFeel.landingTime > 0) return "land";
    if (state.riderSlidePulse > 0 || state.warningPulse > 0.45 || state.raceFeel.slideTime > 0 || state.raceFeel.collisionTime > 0) return "slide";
    if (state.boost > 8 || state.boostPulse > 0 || state.raceFeel.boostTime > 0.05) return "boost";
    if (lean < -0.25 || state.raceFeel.lateralVelocity < -35) return "left";
    if (lean > 0.25 || state.raceFeel.lateralVelocity > 35) return "right";
    return "normal";
  }

  getFirstPersonVisualMode() {
    if (this.isGeneratedCockpitLoaded()) return "cockpit-png";
    if (this.hasTexture("mtbCockpitSvg")) return "cockpit-svg";
    if (this.hasTexture("riderMtbLarge") || this.hasTexture("rider")) return "rider-svg";
    return "graphics";
  }

  isGeneratedCockpitLoaded() {
    return ["mtbCockpitNormal", "mtbCockpitLeft", "mtbCockpitRight", "mtbCockpitBoost", "mtbCockpitJump", "mtbCockpitLand"].some((key) => this.hasTexture(key));
  }

  getCockpitScreenHeightRatio() {
    if (!FIRST_PERSON_MTB_VIEW) return 0.2;
    const boostLift = state.boost > 8 || state.boostPulse > 0 ? 0.015 : 0;
    const jumpLift = state.jumping ? -0.018 : 0;
    return Phaser.Math.Clamp(COCKPIT_SCREEN_HEIGHT_RATIO + boostLift + jumpLift, 0.22, 0.3);
  }

  getRiderBaseY() {
    return FIRST_PERSON_MTB_VIEW ? this.getCockpitBaseY() : this.scale.height * 0.79;
  }

  getCockpitBaseY() {
    return this.scale.height - this.getSafeBottom() + 22;
  }

  getRiderDisplaySize(key) {
    if (key === "riderMtbBoostState" || key === "riderMtbBoost") return { width: 258, height: 170 };
    if (key === "riderMtbJumpState" || key === "riderMtbJump") return { width: 244, height: 178 };
    if (key === "riderMtbLand") return { width: 238, height: 162 };
    if (key === "riderMtbSlide") return { width: 248, height: 170 };
    if (key === "riderMtbLeanLeft" || key === "riderMtbLeanRight") return { width: 238, height: 170 };
    return { width: 232, height: 168 };
  }

  createHud() {
    this.hud = this.add.container(0, 0).setDepth(80);
    this.hudBg = this.add.graphics();
    this.rpm = this.add.graphics();
    this.dashCluster = this.add.graphics();
    this.problemPanel = this.hasTexture("problemBanner")
      ? this.add.image(this.scale.width / 2, 88, "problemBanner").setDisplaySize(this.scale.width - 34, 82).setAlpha(0.94)
      : null;
    this.hudPanel = this.hasTexture("speedometerPanel")
      ? this.add.image(this.scale.width / 2, this.scale.height - 86, "speedometerPanel").setDisplaySize(this.scale.width - 24, 108).setAlpha(0.86)
      : null;
    this.boostIcon = this.hasTexture("boostIcon") ? this.add.image(34, 142, "boostIcon").setDisplaySize(18, 18) : null;
    this.tempIcon = this.hasTexture("tempIcon") ? this.add.image(this.scale.width - 166, 105, "tempIcon").setDisplaySize(16, 16) : null;
    this.hud.add([this.problemPanel, this.hudPanel, this.hudBg, this.rpm, this.dashCluster, this.boostIcon, this.tempIcon].filter(Boolean));

    this.speedText = this.add.text(this.scale.width / 2, this.scale.height - 104, "064", {
      fontFamily: "Arial Black, Arial",
      fontSize: "44px",
      color: "#f6fbff"
    }).setOrigin(0.5);
    this.speedUnit = this.add.text(this.scale.width / 2, this.scale.height - 70, "KM/H", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#7ee8ff"
    }).setOrigin(0.5);
    this.questionText = this.add.text(this.scale.width / 2, 64, "PASS THE ANSWER GATE", {
      fontFamily: "Arial Black, Arial",
      fontSize: "23px",
      color: "#eef8ff",
      stroke: "#020815",
      strokeThickness: 6,
      align: "center"
    }).setOrigin(0.5, 0);
    this.statusText = this.add.text(this.scale.width / 2, this.scale.height - 43, "BOOST READY", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#35d4ff"
    }).setOrigin(0.5, 0);
    this.scoreText = this.add.text(this.scale.width - 22, 24, "0", {
      fontFamily: "Arial Black, Arial",
      fontSize: "27px",
      color: "#ffffff"
    }).setOrigin(1, 0);
    this.comboText = this.add.text(22, this.scale.height - 124, "COMBO x0", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffcf54"
    }).setOrigin(0, 0);
    this.tempText = this.add.text(this.scale.width - 22, this.scale.height - 124, "TEMP 62C", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#9ee7ff"
    }).setOrigin(1, 0);
    this.clusterText = this.add.text(this.scale.width - 22, this.scale.height - 148, "RPM\nBOOST 00\nTEMP 62", {
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
    this.createCompactHud();
    this.drawHud();
  }

  createCompactHud() {
    this.speedText.setFontSize(FIRST_PERSON_MTB_VIEW ? 24 : 34);
    this.speedUnit.setFontSize(FIRST_PERSON_MTB_VIEW ? 9 : 11);
    this.statusText.setFontSize(10);
    this.comboText.setFontSize(11);
    this.tempText.setFontSize(10);
    this.clusterText.setFontSize(FIRST_PERSON_MTB_VIEW ? 9 : 10);
    this.scoreText.setFontSize(22);
    this.questionText.setFontSize(state.mode === "tutorial" ? 23 : 21);
    this.questionText.setWordWrapWidth(this.scale.width - 72);
    this.problemPanel?.setAlpha(0.76);
    this.hudPanel?.setAlpha(FIRST_PERSON_MTB_VIEW ? 0.18 : 0.62);
    this.hudVisualStates = {
      normal: 0x35d4ff,
      correct: 0x42ff9b,
      wrong: 0xff375f,
      boost: 0xff7a18,
      cold: 0x9ee7ff,
      overheat: 0xff375f,
      stageClear: 0xffcf54
    };
  }

  updateCompactHud() {
    const { width, height } = this.scale;
    const layout = this.getProblemBannerLayout();
    const bottomSafe = this.getSafeBottom();
    const hudTop = FIRST_PERSON_MTB_VIEW ? height - 126 - bottomSafe : height - 112 - bottomSafe;
    this.questionText.setFontSize(state.mode === "tutorial" ? 23 : 21);
    this.questionText.setWordWrapWidth(width - 72);
    this.questionText.setPosition(width / 2, layout.y - layout.height * 0.32);
    this.problemPanel?.setPosition(width / 2, layout.y).setDisplaySize(layout.width, layout.height);
    if (FIRST_PERSON_MTB_VIEW) {
      this.hudPanel?.setVisible(false);
      this.speedText.setPosition(84, hudTop + 23);
      this.speedUnit.setPosition(84, hudTop + 43);
      this.statusText.setPosition(84, hudTop + 60);
      this.clusterText.setPosition(width - 118, hudTop + 10);
      this.tempText.setPosition(width - 118, hudTop + 34);
    } else {
      this.hudPanel?.setVisible(true).setPosition(width * 0.5, height - 72 - bottomSafe).setDisplaySize(Math.min(width - 108, 280), 80);
      this.speedText.setPosition(width * 0.5, hudTop + 26);
      this.speedUnit.setPosition(width * 0.5, hudTop + 52);
      this.statusText.setPosition(width * 0.5, hudTop + 72);
      this.tempText.setPosition(width - 22, hudTop + 8);
      this.clusterText.setPosition(width - 28, hudTop + 28);
    }
    this.comboText.setPosition(22, 38);
    this.scoreText.setX(width - 22);
    this.settingsButton.setPosition(22, height - 42 - bottomSafe);
  }

  setHudVisualState(nextState) {
    if (this.hudVisualStates?.[nextState]) state.hudMode = nextState;
  }

  getProblemBannerLayout() {
    const { width, height } = this.scale;
    return {
      x: width / 2,
      y: Math.max(58, height * 0.088),
      width: Math.min(width - 56, 334),
      height: Math.min(height * 0.095, 72)
    };
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
    const bottomSafe = this.getSafeBottom();
    const hudTop = FIRST_PERSON_MTB_VIEW ? height - 126 - bottomSafe : height - 112 - bottomSafe;
    const compactPanelWidth = FIRST_PERSON_MTB_VIEW ? 126 : Math.min(width - 108, 280);
    const panelX = FIRST_PERSON_MTB_VIEW ? 22 : (width - compactPanelWidth) / 2;

    this.hudBg.clear();
    this.hudBg.fillStyle(0x020815, 0.42);
    const banner = this.getProblemBannerLayout();
    this.hudBg.fillRoundedRect((width - banner.width) / 2, banner.y - banner.height / 2, banner.width, banner.height, 8);
    this.hudBg.lineStyle(2, hudColor, 0.32 + state.hudPulse * 0.3);
    this.hudBg.strokeRoundedRect((width - banner.width) / 2, banner.y - banner.height / 2, banner.width, banner.height, 8);
    this.hudBg.fillStyle(0x020815, FIRST_PERSON_MTB_VIEW ? 0.34 : 0.46);
    this.hudBg.fillRoundedRect(panelX, hudTop, compactPanelWidth, FIRST_PERSON_MTB_VIEW ? 66 : 86, 10);
    this.hudBg.lineStyle(2, hudColor, FIRST_PERSON_MTB_VIEW ? 0.24 : 0.34);
    this.hudBg.strokeRoundedRect(panelX, hudTop, compactPanelWidth, FIRST_PERSON_MTB_VIEW ? 66 : 86, 10);

    this.hudBg.fillStyle(0x0a2034, 0.94);
    this.hudBg.fillRoundedRect(panelX + 14, hudTop + (FIRST_PERSON_MTB_VIEW ? 52 : 70), compactPanelWidth - 28, 5, 3);
    this.hudBg.fillStyle(hudColor, 0.95);
    this.hudBg.fillRoundedRect(panelX + 14, hudTop + (FIRST_PERSON_MTB_VIEW ? 52 : 70), Math.max(10, (compactPanelWidth - 28) * (state.boost / 100)), 5, 3);

    if (FIRST_PERSON_MTB_VIEW) {
      this.rpm.clear();
      this.dashCluster.clear();
      this.hudBg.fillStyle(0x020815, 0.28);
      this.hudBg.fillRoundedRect(width - 156, hudTop, 96, 54, 10);
      this.hudBg.fillStyle(tempColor, 0.86);
      this.hudBg.fillRoundedRect(width - 142, hudTop + 40, 68 * Phaser.Math.Clamp(state.grillTemp / 100, 0, 1), 4, 3);
      this.speedText.setColor(colorToCss(hudColor));
      this.speedUnit.setColor(colorToCss(hudColor));
      this.statusText.setColor(colorToCss(hudColor));
      this.tempText.setColor(colorToCss(tempColor));
      this.updateCompactHud();
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
      this.boostIcon?.setPosition(panelX + 24, hudTop + 54);
      this.tempIcon?.setPosition(width - 150, hudTop + 42);
      return;
    }

    this.hudBg.fillStyle(0x0a2034, 0.9);
    this.hudBg.fillRoundedRect(width - 120, hudTop + 24, 92, 5, 3);
    this.hudBg.fillStyle(tempColor, 0.92);
    this.hudBg.fillRoundedRect(width - 120, hudTop + 24, 92 * Phaser.Math.Clamp(state.grillTemp / 100, 0, 1), 5, 3);

    this.rpm.clear();
    const rpmX = width / 2;
    const rpmY = hudTop + 42;
    this.rpm.lineStyle(5, 0x17364b, 0.82);
    this.rpm.beginPath();
    this.rpm.arc(rpmX, rpmY, 31, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335), false);
    this.rpm.strokePath();
    this.rpm.lineStyle(5, hudColor, 0.92);
    this.rpm.beginPath();
    this.rpm.arc(rpmX, rpmY, 31, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(205 + 130 * rpmValue), false);
    this.rpm.strokePath();

    const clusterX = width - 64;
    const clusterY = hudTop + 50;
    this.dashCluster.clear();
    this.dashCluster.fillStyle(0x020815, 0.62);
    this.dashCluster.fillRoundedRect(width - 118, hudTop + 12, 96, 58, 8);
    this.dashCluster.lineStyle(2, hudColor, 0.36);
    this.dashCluster.strokeRoundedRect(width - 118, hudTop + 12, 96, 58, 8);
    this.dashCluster.lineStyle(4, 0x17364b, 0.88);
    this.dashCluster.beginPath();
    this.dashCluster.arc(clusterX, clusterY, 27, Phaser.Math.DegToRad(198), Phaser.Math.DegToRad(342), false);
    this.dashCluster.strokePath();
    this.dashCluster.lineStyle(4, hudColor, 0.9);
    this.dashCluster.beginPath();
    this.dashCluster.arc(clusterX, clusterY, 27, Phaser.Math.DegToRad(198), Phaser.Math.DegToRad(198 + 144 * rpmValue), false);
    this.dashCluster.strokePath();
    this.dashCluster.fillStyle(0x0a2034, 0.95);
    this.dashCluster.fillRoundedRect(width - 108, hudTop + 47, 68, 4, 3);
    this.dashCluster.fillStyle(0xff7a18, 0.95);
    this.dashCluster.fillRoundedRect(width - 108, hudTop + 47, 68 * (state.boost / 100), 4, 3);
    this.dashCluster.fillStyle(0x0a2034, 0.95);
    this.dashCluster.fillRoundedRect(width - 108, hudTop + 57, 68, 4, 3);
    this.dashCluster.fillStyle(tempColor, 0.95);
    this.dashCluster.fillRoundedRect(width - 108, hudTop + 57, 68 * Phaser.Math.Clamp(state.grillTemp / 100, 0, 1), 4, 3);

    this.speedText.setColor(colorToCss(hudColor));
    this.speedUnit.setColor(colorToCss(hudColor));
    this.statusText.setColor(colorToCss(hudColor));
    this.tempText.setColor(colorToCss(tempColor));
    this.updateCompactHud();
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
    this.boostIcon?.setPosition(panelX + 28, hudTop + 72);
    this.tempIcon?.setPosition(width - 136, hudTop + 26);
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

  getUiSafeZones() {
    const { width, height } = this.scale;
    const bottomSafe = this.getSafeBottom();
    const banner = this.getProblemBannerLayout();
    const jump = this.getJumpButtonPosition();
    return {
      problemBanner: {
        x: banner.x - banner.width / 2,
        y: Math.min(height * UI_SAFE_ZONES.problemBanner.topRatio, banner.y - banner.height * 0.58),
        width: banner.width,
        height: Math.max(banner.height * 1.25, height * (UI_SAFE_ZONES.problemBanner.bottomRatio - UI_SAFE_ZONES.problemBanner.topRatio))
      },
      hud: {
        x: 0,
        y: height - UI_SAFE_ZONES.hud.topFromBottom - bottomSafe,
        width,
        height: UI_SAFE_ZONES.hud.topFromBottom + bottomSafe
      },
      jumpButton: {
        x: width - UI_SAFE_ZONES.jumpButton.right,
        y: height - UI_SAFE_ZONES.jumpButton.bottom - bottomSafe,
        width: UI_SAFE_ZONES.jumpButton.right,
        height: UI_SAFE_ZONES.jumpButton.bottom + bottomSafe
      },
      riderFocus: {
        x: width * 0.18,
        y: height * UI_SAFE_ZONES.riderFocus.topRatio,
        width: width * 0.64,
        height: height * (UI_SAFE_ZONES.riderFocus.bottomRatio - UI_SAFE_ZONES.riderFocus.topRatio)
      },
      cockpitFocus: {
        x: width * 0.08,
        y: height * UI_SAFE_ZONES.cockpitFocus.topRatio,
        width: width * 0.84,
        height: height * (UI_SAFE_ZONES.cockpitFocus.bottomRatio - UI_SAFE_ZONES.cockpitFocus.topRatio)
      }
    };
  }

  isInUiSafeZone(x, y, zoneNames = ["problemBanner", "hud", "jumpButton", "riderFocus", "cockpitFocus"]) {
    const zones = this.getUiSafeZones();
    return zoneNames.some((name) => {
      const zone = zones[name];
      return zone && x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
    });
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

  createDebugMtbReadOverlay() {
    if (DEBUG_MTB_READ_ENABLED && !this.isTowerMode()) {
      // MTB debug is deprecated for Sky Math Tower and stays hidden in tower mode.
    }
    if (!DEBUG_MTB_READ_ENABLED || this.isTowerMode()) return;
    this.debugMtbReadText = this.add.text(12, DEBUG_TOUCH_ENABLED ? 132 : 12, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#bfffe8",
      backgroundColor: "rgba(2,8,21,0.72)",
      padding: { x: 8, y: 6 }
    }).setDepth(123);
    this.updateDebugMtbReadOverlay();
  }

  updateDebugMtbReadOverlay() {
    if (!this.debugMtbReadText) return;
    this.debugMtbReadText
      .setPosition(12, DEBUG_TOUCH_ENABLED ? 132 : 12)
      .setText([
        "debugMtbRead=1",
        `visual mode: ${this.visualMode || this.getFirstPersonVisualMode?.() || "graphics"}`,
        `cockpit asset loaded: ${Boolean(this.isGeneratedCockpitLoaded?.())}`,
        `cockpit ratio: ${this.getCockpitScreenHeightRatio?.().toFixed(2) || "0.00"}`,
        `cockpit state: ${this.getCockpitState?.() || "normal"}`,
        `decor count: ${this.decorativeCourseObjects?.filter((object) => object.visible).length || 0}`,
        "track mode: first-person cockpit",
        `fallback: ${COCKPIT_FALLBACK_PRIORITY}`
      ].join("\n"));
  }

  createDebugRaceFeelOverlay() {
    if (DEBUG_RACE_FEEL_ENABLED && !this.isTowerMode()) {
      // Race feel debug belongs to the deprecated MTB mode.
    }
    if (!DEBUG_RACE_FEEL_ENABLED || this.isTowerMode()) return;
    const y = DEBUG_TOUCH_ENABLED || DEBUG_MTB_READ_ENABLED ? 236 : 12;
    this.debugRaceFeelText = this.add.text(12, y, "", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ffd7a3",
      backgroundColor: "rgba(2,8,21,0.72)",
      padding: { x: 8, y: 6 }
    }).setDepth(124);
    this.updateDebugRaceFeelOverlay();
  }

  updateDebugRaceFeelOverlay() {
    if (!this.debugRaceFeelText) return;
    const raceFeel = state.raceFeel;
    const nextMathGateIn = Math.max(0, Math.round((raceFeel.nextMathGateAt - this.time.now) / 1000));
    const y = DEBUG_TOUCH_ENABLED || DEBUG_MTB_READ_ENABLED ? 236 : 12;
    this.debugRaceFeelText
      .setPosition(12, y)
      .setText([
        "debugRaceFeel=1",
        `speed ${raceFeel.speed.toFixed(1)}`,
        `target ${raceFeel.targetSpeed.toFixed(1)}`,
        `lateral ${raceFeel.lateralVelocity.toFixed(2)}`,
        `traction ${raceFeel.traction.toFixed(2)}`,
        `airborne ${raceFeel.isAirborne}`,
        `boostTime ${raceFeel.boostTime.toFixed(2)}`,
        `slideTime ${raceFeel.slideTime.toFixed(2)}`,
        `nextMathGateIn ${nextMathGateIn}s`,
        `lastGateDist ${Math.round(state.distance - raceFeel.lastMathGateDistance)}`
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

  gateLaneToX(lane, y) {
    const laneOffset = lane - 1;
    const perspectiveLaneWidth = Math.min(this.scale.width * 0.24, this.getTrackWidthAtY(y) * 0.22);
    return this.getTrackCenterAtY(y) + laneOffset * perspectiveLaneWidth;
  }

  getGateVisualScale(gate) {
    const perspective = this.getPerspectiveScale(gate.y);
    const tutorialBoost = state.mode === "tutorial" ? 1.1 : 1;
    return Phaser.Math.Clamp(perspective * 0.68 * tutorialBoost, 0.24, state.mode === "tutorial" ? 1.08 : 0.9);
  }

  applyGateVisualBalance(gate) {
    const scale = this.getGateVisualScale(gate);
    gate.setScale(scale);
    gate.setDepth(Math.floor(gate.y * 0.02) + 11);
    if (gate.label) gate.label.setFontSize(gate.getData("isBoost") ? (state.mode === "tutorial" ? 14 : 12) : (state.mode === "tutorial" ? 25 : 21));
    if (gate.gateArt) gate.gateArt.setAlpha(state.mode === "tutorial" ? 0.96 : 0.78);
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
      const gateY = initial ? this.scale.height * 0.38 : -90;
      const gate = this.add.container(this.gateLaneToX(lane, gateY), gateY).setDepth(12);
      gate.setData("lane", lane);
      gate.setData("value", value);
      gate.setData("isBoost", value === "BOOST");
      gate.setData("isCorrect", value === problem.answer);
      gate.setSize(70, 76);
      const gateArt = this.hasTexture("mathGateFrame") ? this.add.image(0, 0, "mathGateFrame").setDisplaySize(86, 96) : null;
      const frame = this.add.graphics();
      const label = this.add.text(0, 0, String(value), {
        fontFamily: "Arial Black, Arial",
        fontSize: value === "BOOST" ? "13px" : "23px",
        color: value === "BOOST" ? "#04101d" : "#eef8ff"
      }).setOrigin(0.5);
      gate.add([gateArt, frame, label].filter(Boolean));
      gate.gateArt = gateArt;
      gate.frame = frame;
      gate.label = label;
      this.gates.push(gate);
      this.applyGateVisualBalance(gate);
      this.drawGate(gate, value === "BOOST");
    }
  }

  drawGate(gate, isBoost) {
    gate.frame.clear();
    const isCorrect = gate.getData("isCorrect");
    const color = isBoost ? 0xffcf54 : isCorrect ? 0x42ff9b : 0xff7a18;
    const alpha = state.mode === "tutorial" ? 0.96 : isBoost ? 0.78 : 0.72;
    if (gate.gateArt) gate.gateArt.setTint(color).setAlpha(alpha);
    gate.frame.lineStyle(state.mode === "tutorial" ? 4 : 3, color, state.mode === "tutorial" ? 0.92 : 0.76);
    gate.frame.strokeRoundedRect(-34, -38, 68, 76, 10);
    gate.frame.fillStyle(isBoost ? 0xffcf54 : 0x020815, isBoost ? 0.2 : 0.34);
    gate.frame.fillRoundedRect(-29, -31, 58, 62, 8);
    gate.frame.lineStyle(1, 0xffffff, 0.28);
    gate.frame.lineBetween(-19, 0, 19, 0);
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
    state.riderLandPulse = Math.max(0, state.riderLandPulse - dt * 5.4);
    state.riderSlidePulse = Math.max(0, state.riderSlidePulse - dt * 3.2);
    if (state.hudPulse <= 0 && state.boostPulse <= 0) this.setHudVisualState("normal");

    this.updateRaceFeel(delta);
    const raceFeel = state.raceFeel;
    const speedFactor = state.mode === "tutorial" ? 0.74 + state.boost / 120 : Phaser.Math.Clamp(raceFeel.speed / 82, 0.58, 2.05);
    state.distance = Math.min(state.stage.targetDistance, state.distance + delta * 0.036 * speedFactor);

    this.updateParallaxLayers(delta, speedFactor);
    this.updateTerrain(time, delta, speedFactor);
    this.updateCourseObjects(delta, speedFactor);
    this.updateGates(delta, speedFactor);
    this.updateEffects(time, delta, speedFactor);
    this.updateHud();
    this.updateDebugTouchOverlay();
    this.updateDebugPerfOverlay(delta);
    this.updateDebugMtbReadOverlay();
    this.updateDebugRaceFeelOverlay();

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

  updateRaceFeel(delta) {
    const dt = delta / 1000;
    this.applyBoostFeel(dt);
    this.applySurfaceFeel(dt);
    this.applyCollisionFeel(dt);
    this.applySteering(dt);
    this.applyJumpFeel(dt);

    const raceFeel = state.raceFeel;
    const stageBoost = (state.stage.id - 1) * 4;
    const normalBase = state.mode === "tutorial" ? 48 : state.stage.baseSpeed + 32 + stageBoost;
    const comboBonus = state.mode === "tutorial" ? 0 : Math.min(state.combo * 4, 22);
    const boostBonus = state.boost * (state.mode === "tutorial" ? 0.45 : 0.72);
    const kickBonus = state.speedKick * 0.32;
    const edgePenalty = raceFeel.edgeSlowTime > 0 ? 24 : 0;
    const slidePenalty = raceFeel.slideTime > 0 ? 10 : 0;
    const collisionPenalty = raceFeel.collisionTime > 0 ? 26 : 0;
    const targetSpeed = Phaser.Math.Clamp(normalBase + comboBonus + boostBonus + kickBonus - edgePenalty - slidePenalty - collisionPenalty, 45, state.boost > 8 ? 172 : 118 + stageBoost);
    raceFeel.targetSpeed = targetSpeed;
    const ease = 1 - Math.pow(0.001, dt);
    raceFeel.speed = Phaser.Math.Linear(raceFeel.speed || state.speed || targetSpeed, raceFeel.targetSpeed, ease * 0.42);
    state.speed = raceFeel.speed;
  }

  applySteering(dt) {
    const raceFeel = state.raceFeel;
    const inputDirection = this.getSteeringInputDirection();
    const speedSteeringFactor = Phaser.Math.Clamp(1.16 - raceFeel.speed / 220, 0.48, 1);
    const boostWeight = state.boost > 8 ? 0.82 : 1;
    const steeringPower = 18 * raceFeel.traction * speedSteeringFactor * boostWeight;
    raceFeel.steering = Phaser.Math.Linear(raceFeel.steering, inputDirection, Math.min(1, dt * 8));
    raceFeel.lateralVelocity += inputDirection * steeringPower * dt;
    const damping = raceFeel.traction < 0.8 ? 0.965 : 0.89;
    raceFeel.lateralVelocity *= Math.pow(damping, dt * 60);
    raceFeel.lateralVelocity = Phaser.Math.Clamp(raceFeel.lateralVelocity, -8, 8);

    const targetX = this.laneToX(this.lane);
    const inertialX = Phaser.Math.Clamp(targetX + raceFeel.lateralVelocity * 7, 36, this.scale.width - 36);
    this.rider?.setX(Phaser.Math.Linear(this.rider.x, inertialX, Math.min(1, dt * 11)));
    this.applyEdgeSlowFeel();
    this.drawRider(this.getRaceFeelLean());
  }

  getSteeringInputDirection() {
    const touchDirection = (this.activeTouches.right.size > 0 ? 1 : 0) - (this.activeTouches.left.size > 0 ? 1 : 0);
    if (touchDirection !== 0) return touchDirection;
    return Phaser.Math.Clamp(this.lane - 1, -1, 1) * 0.35;
  }

  getRaceFeelLean() {
    const raceFeel = state.raceFeel;
    const slideWobble = raceFeel.slideTime > 0 ? Math.sin(this.time.now * 0.028) * 0.28 : 0;
    return Phaser.Math.Clamp(raceFeel.lateralVelocity / 7 + slideWobble, -1, 1);
  }

  applyBoostFeel(dt) {
    const raceFeel = state.raceFeel;
    raceFeel.boostTime = state.boost > 8 || state.boostPulse > 0 ? Math.max(raceFeel.boostTime, 0.5) : Math.max(0, raceFeel.boostTime - dt);
  }

  applyJumpFeel(dt) {
    const raceFeel = state.raceFeel;
    if (raceFeel.isAirborne) {
      raceFeel.jumpVelocity += raceFeel.jumpGravity * dt;
      raceFeel.jumpY += raceFeel.jumpVelocity * dt;
      if (raceFeel.jumpY >= 0) {
        raceFeel.jumpY = 0;
        raceFeel.jumpVelocity = 0;
        raceFeel.isAirborne = false;
        raceFeel.landingTime = 0.18;
        this.landJump();
      }
    }
    raceFeel.landingTime = Math.max(0, raceFeel.landingTime - dt);
    if (this.rider && raceFeel.isAirborne) {
      this.rider.y = this.getRiderBaseY() + raceFeel.jumpY * 0.22;
    } else if (this.rider && raceFeel.landingTime > 0) {
      this.rider.y = this.getRiderBaseY() + Math.sin((0.18 - raceFeel.landingTime) * 34) * 5;
    } else if (this.rider && !state.jumping) {
      this.rider.y = Phaser.Math.Linear(this.rider.y, this.getRiderBaseY(), Math.min(1, dt * 12));
    }
  }

  applySurfaceFeel(dt) {
    const raceFeel = state.raceFeel;
    const iceSegment = Math.floor(state.distance / 340);
    const iceWindow = state.stage.id === 3 || state.stage.weather === "ice";
    if (iceWindow && iceSegment > 0 && iceSegment !== raceFeel.lastIceSegment && state.distance % 340 > 128 && state.distance % 340 < 158) {
      raceFeel.lastIceSegment = iceSegment;
      raceFeel.slideTime = Math.max(raceFeel.slideTime, 0.95);
      raceFeel.lateralVelocity += Phaser.Math.FloatBetween(-1.8, 1.8);
      state.warningPulse = Math.max(state.warningPulse, 0.45);
      feedback.trigger("wrong");
    }
    raceFeel.slideTime = Math.max(0, raceFeel.slideTime - dt);
    const targetTraction = raceFeel.slideTime > 0 ? 0.46 : 1;
    raceFeel.traction = Phaser.Math.Linear(raceFeel.traction, targetTraction, raceFeel.slideTime > 0 ? 0.22 : Math.min(1, dt * 1.5));
    if (raceFeel.slideTime > 0) state.riderSlidePulse = Math.max(state.riderSlidePulse, 0.45);
  }

  applyCollisionFeel(dt) {
    const raceFeel = state.raceFeel;
    raceFeel.collisionTime = Math.max(0, raceFeel.collisionTime - dt);
    raceFeel.edgeSlowTime = Math.max(0, raceFeel.edgeSlowTime - dt);
  }

  applyEdgeSlowFeel() {
    const raceFeel = state.raceFeel;
    const center = this.scale.width / 2;
    const normalized = Math.abs((this.rider?.x ?? center) - center) / (this.scale.width * 0.38);
    if (normalized > 0.86) {
      raceFeel.edgeSlowTime = Math.max(raceFeel.edgeSlowTime, 0.34);
      state.warningPulse = Math.max(state.warningPulse, 0.35);
    }
  }

  updateTerrain(time, delta, speedFactor) {
    const { width, height } = this.scale;
    const horizonY = height * 0.31;
    this.trackLines.forEach((line, index) => {
      const phase = (time * 0.2 * speedFactor + index * 58) % (height * 0.69);
      const y = horizonY + phase;
      const scale = this.getPerspectiveScale(y);
      const trackWidth = this.getTrackWidthAtY(y);
      const center = this.getTrackCenterAtY(y);
      line.setPosition(center + Math.sin(index * 1.7) * trackWidth * 0.08, y);
      line.setScale(scale * 1.7, 1);
      line.setAlpha(0.07 + scale * 0.22 + state.boost / 360);
      line.setDepth(Math.floor(y * 0.02) + 4);
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
      const phase = (time * 0.16 * speedFactor + prop.getData("offset")) % (height * 0.77);
      const y = horizonY + phase;
      const scale = this.getPerspectiveScale(y);
      const x = this.getTrackEdgeX(y, side, 34 * scale + width * 0.07);
      this.drawCourseProp(prop, x, y, scale, side, index);
    });

    this.courseTape.forEach((tape, index) => {
      if (!tape.visible) return;
      const side = tape.getData("side");
      const phase = (time * 0.21 * speedFactor + tape.getData("offset")) % (height * 0.74);
      const y = horizonY + phase;
      const scale = this.getPerspectiveScale(y);
      const x = this.getTrackEdgeX(y, side, 18 * scale);
      const key = side < 0 && this.hasTexture("mtbTrackTapeLeft")
        ? "mtbTrackTapeLeft"
        : side > 0 && this.hasTexture("mtbTrackTapeRight")
          ? "mtbTrackTapeRight"
          : "mtbTrackTape";
      if (tape.setTexture && this.hasTexture(key)) {
        tape.setTexture(key);
        tape.setPosition(x, y);
        tape.setScale(0.26 * scale);
        tape.setAlpha(0.48 + scale * 0.32);
        tape.setAngle(side * (7 + scale * 5));
        tape.setDepth(Math.floor(y * 0.02) + 8);
      } else {
        tape.clear();
        tape.setPosition(x, y);
        tape.setDepth(Math.floor(y * 0.02) + 8);
        tape.lineStyle(4 * scale, 0xf6fbff, 0.74);
        tape.lineBetween(side * -62 * scale, 0, side * 52 * scale, 18 * scale);
        tape.lineStyle(3 * scale, index % 2 ? 0xff7a18 : 0x35d4ff, 0.82);
        tape.lineBetween(side * -62 * scale, -8 * scale, side * 52 * scale, 10 * scale);
      }
    });

    this.coursePoles.forEach((pole, index) => {
      if (!pole.visible) return;
      const side = pole.getData("side");
      const phase = (time * 0.23 * speedFactor + pole.getData("offset")) % (height * 0.74);
      const y = horizonY + phase;
      const scale = this.getPerspectiveScale(y);
      const x = this.getTrackEdgeX(y, side, 7 * scale);
      if (pole.setTexture && this.hasTexture("mtbCoursePole")) {
        pole.setTexture("mtbCoursePole");
        pole.setPosition(x, y);
        pole.setScale(0.24 * scale);
        pole.setAlpha(0.55 + scale * 0.32);
        pole.setDepth(Math.floor(y * 0.02) + 9);
      } else {
        pole.clear();
        pole.setPosition(x, y);
        pole.setDepth(Math.floor(y * 0.02) + 9);
        pole.lineStyle(4 * scale, 0xf8fbff, 0.9);
        pole.lineBetween(0, -32 * scale, 0, 28 * scale);
        pole.fillStyle(index % 2 ? 0xff7a18 : 0x35d4ff, 0.9);
        pole.fillTriangle(0, -30 * scale, side * 28 * scale, -20 * scale, 0, -10 * scale);
      }
    });

    this.courseArrows.forEach((arrow, index) => {
      if (!arrow.visible) return;
      const side = arrow.getData("side");
      const phase = (time * 0.18 * speedFactor + arrow.getData("offset")) % (height * 0.82);
      const y = horizonY + phase;
      const scale = this.getPerspectiveScale(y);
      const x = this.getTrackCenterAtY(y) + side * this.getTrackWidthAtY(y) * 0.28;
      const key = arrow.getData("variant") ? "mtbCourseArrowOrange" : "mtbCourseArrowBlue";
      if (arrow.setTexture && this.hasTexture(key)) {
        arrow.setTexture(key);
        arrow.setPosition(x, y);
        arrow.setScale(0.18 * scale);
        arrow.setAngle(side * 4);
        arrow.setAlpha(0.42 + scale * 0.35);
        arrow.setDepth(Math.floor(y * 0.02) + 7);
      } else {
        arrow.clear();
        arrow.setPosition(x, y);
        arrow.setDepth(Math.floor(y * 0.02) + 7);
        arrow.fillStyle(index % 2 ? 0xff7a18 : 0x35d4ff, 0.72);
        arrow.fillTriangle(-22 * scale, -10 * scale, 22 * scale, 0, -22 * scale, 10 * scale);
      }
    });

    this.rampProps.forEach((ramp, index) => {
      if (!ramp.visible) return;
      const phase = (time * 0.115 * speedFactor + ramp.getData("offset")) % (height * 1.22);
      const y = height * 0.28 + phase;
      const scale = this.getPerspectiveScale(y);
      const x = this.getTrackCenterAtY(y) + Math.sin(index * 1.9 + time * 0.0008) * 26 * scale;
      if (ramp.setTexture && this.hasTexture("mtbJumpRamp")) {
        ramp.setTexture("mtbJumpRamp");
        ramp.setPosition(x, y);
        ramp.setScale(0.24 * scale);
        ramp.setAlpha(y > height * 0.44 && y < height * 0.8 ? 0.76 : 0);
        ramp.setDepth(Math.floor(y * 0.02) + 10);
      }
    });
  }

  updateCourseObjects(delta, speedFactor) {
    const { width, height } = this.scale;
    const profile = this.getStageDecorationProfile();
    const lowEffects = state.performance.lowEffectsMode;
    this.decorativeCourseObjects.forEach((object, index) => {
      if (!object.visible) return;
      const side = object.getData("side");
      const type = object.getData("type");
      const rawOffset = object.getData("offset") + delta * 0.105 * speedFactor * profile.speed;
      object.setData("offset", rawOffset);
      const phase = rawOffset % (height * 0.86);
      const y = height * 0.29 + phase;
      if (y > height + 96) this.recycleCourseObject(object);
      const scale = this.getPerspectiveScale(y);
      const extraPad = type === "pine" ? width * 0.16 : type === "banner" ? width * 0.12 : width * 0.07;
      const x = this.getTrackEdgeX(y, side, extraPad + scale * 20);
      this.drawDecorativeCourseObject(object, x, y, scale, side, index, lowEffects);
    });
  }

  drawDecorativeCourseObject(object, x, y, scale, side, index, lowEffects) {
    const safeZone = this.isInUiSafeZone(x, y);
    const type = object.getData("type");
    const key = object.getData("textureKey");
    object.setDepth(safeZone ? 5 : Math.floor(y * 0.02) + (type === "pine" ? 6 : 8));
    if (object.setTexture && this.hasTexture(key)) {
      object.setTexture(key);
      object.setPosition(x, y);
      const typeScale = {
        pine: 0.28,
        "snow-bank": 0.34,
        rock: 0.28,
        "ice-patch": 0.32,
        banner: 0.24,
        "checkpoint-flag": 0.26
      }[type] || 0.28;
      object.setScale(typeScale * scale);
      object.setAlpha(safeZone ? 0.18 : (lowEffects ? 0.56 : 0.72) + Math.min(scale * 0.18, 0.22));
      object.setFlipX(side < 0);
      return;
    }

    object.clear();
    object.setPosition(x, y);
    object.setScale(scale);
    object.setAlpha(safeZone ? 0.22 : 1);
    if (type === "pine") {
      object.fillStyle(0x0e3f36, 0.78);
      object.fillTriangle(0, -34, -20, 18, 20, 18);
      object.fillStyle(0xdff6ff, 0.36);
      object.fillRect(-14, 2, 28, 5);
    } else if (type === "banner") {
      object.fillStyle(0x071525, 0.78);
      object.fillRoundedRect(-42, -16, 84, 32, 4);
      object.lineStyle(3, 0x35d4ff, 0.7);
      object.strokeRoundedRect(-42, -16, 84, 32, 4);
    } else if (type === "checkpoint-flag") {
      object.lineStyle(4, 0xf8fbff, 0.82);
      object.lineBetween(0, -42, 0, 34);
      object.fillStyle(index % 2 ? 0xff8b20 : 0x35d4ff, 0.86);
      object.fillTriangle(0, -38, side * 34, -26, 0, -12);
    } else {
      object.fillStyle(type === "ice-patch" ? 0x7ee8ff : type === "rock" ? 0x6b7f8f : 0xf4fbff, 0.68);
      object.fillEllipse(0, 0, 58, 22);
    }
  }

  drawCourseProp(prop, x, y, depth, side, index) {
    prop.setPosition(x, y);
    prop.setDepth(Math.floor(y * 0.02) + 7);
    const kind = prop.getData("kind");
    if (prop.setTexture && this.hasTexture("pineTree")) {
      const keys = ["pineTree", "courseFlag", "snowBank", "rock", "courseArrow", "courseFence", "mtbCourseMarker", "mtbBankCurve", "pineTree", "courseArrow"];
      const key = keys[kind] || "pineTree";
      prop.setTexture(key);
      const baseScale = key === "courseFence" ? 0.18 : key === "mtbBankCurve" ? 0.16 : key === "mtbCourseMarker" ? 0.22 : 0.25;
      const scaleRange = key === "courseFence" ? 0.62 : key === "mtbBankCurve" ? 0.76 : key === "mtbCourseMarker" ? 0.86 : 0.98;
      prop.setScale(baseScale + depth * scaleRange);
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
      gate.x = this.gateLaneToX(gate.getData("lane"), gate.y);
      this.applyGateVisualBalance(gate);

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

    if (state.mode === "tutorial") {
      this.spawnTimer -= delta;
      if (this.gates.length === 0 || this.spawnTimer <= 0) {
        this.createGatePair();
        this.spawnTimer = Math.max(940, (1650 - state.combo * 45 - state.boost * 4) / state.stage.gateRate);
      }
      return;
    }

    if (this.gates.length === 0 && this.canSpawnMathGate(this.time.now, state.distance)) {
      this.spawnMathGateEvent();
    }
  }

  canSpawnMathGate(now, distance) {
    const raceFeel = state.raceFeel;
    if (state.mode === "tutorial") return true;
    if (raceFeel.isAirborne || raceFeel.landingTime > 0 || state.jumping) return false;
    if (raceFeel.boostTime > 0.15 || now < raceFeel.pureRacingUntil) return false;
    if (now < raceFeel.nextMathGateAt) return false;
    if (distance - raceFeel.lastMathGateDistance < MATH_GATE_MIN_DISTANCE) return false;
    return true;
  }

  scheduleNextMathGate(now = this.time.now, initial = false) {
    const density = MATH_GATE_STAGE_DENSITY[state.stage.id] || 0.88;
    const stageGateRate = Math.max(0.7, state.stage.gateRate || 1);
    const minInterval = MATH_GATE_MIN_INTERVAL_MS / density / stageGateRate;
    const maxInterval = MATH_GATE_MAX_INTERVAL_MS / density / stageGateRate;
    const interval = initial
      ? Math.max(4200, minInterval * 0.72)
      : Phaser.Math.Between(Math.round(minInterval), Math.round(maxInterval));
    state.raceFeel.nextMathGateAt = now + interval;
  }

  spawnMathGateEvent() {
    this.createGatePair();
    state.raceFeel.lastMathGateDistance = state.distance;
    this.scheduleNextMathGate(this.time.now);
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
    state.raceFeel.lastMathGateDistance = state.distance;
    state.raceFeel.pureRacingUntil = this.time.now + 2200;
    this.scheduleNextMathGate(this.time.now);
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
    state.raceFeel.boostTime = Math.max(state.raceFeel.boostTime, 1.1);
    state.raceFeel.pureRacingUntil = this.time.now + 2600;
    this.setHudVisualState("correct");
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
    state.raceFeel.collisionTime = Math.max(state.raceFeel.collisionTime, 0.38);
    state.raceFeel.lateralVelocity *= -0.32;
    this.setHudVisualState("cold");
    state.hudPulse = 0.7;
    state.warningPulse = 1;
    state.riderSlidePulse = 1;
    feedback.trigger("wrong");
    this.drawRider(this.lane - 1);
    this.flashText(state.wrongStreak >= 3 ? "CAREFUL!" : "MISS!", 0xff6b81);
    this.cameras.main.shake(170, state.performance.lowEffectsMode ? 0.006 : 0.012);
  }

  applyBoostReward(label) {
    state.boost = Math.min(100, state.boost + 42);
    state.wrongStreak = 0;
    state.grillTemp = Math.min(OVERHEAT_LIMIT + 8, state.grillTemp + 4);
    state.speedKick = Math.min(90, state.speedKick + 34);
    state.raceFeel.boostTime = Math.max(state.raceFeel.boostTime, 1.45);
    state.raceFeel.pureRacingUntil = this.time.now + 3200;
    this.setHudVisualState("boost");
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
    state.raceFeel.isAirborne = true;
    state.raceFeel.jumpY = 0;
    state.raceFeel.jumpVelocity = -state.raceFeel.jumpImpulse;
    feedback.trigger("jump");
    this.drawRider(this.lane - 1);
    this.flashText(autoReward ? "COMBO JUMP" : "AIR TIME", 0xffffff);
    if (state.mode === "tutorial" && state.tutorialStep === 4) {
      this.time.delayedCall(420, () => {
        this.flashText("Nice jump!", 0x42ff9b);
        this.finishTutorial();
      });
    }
  }

  landJump() {
    state.jumping = false;
    state.airBonusReady = false;
    state.riderLandPulse = 1;
    this.jumpLocked = false;
    this.shadow.setScale(1.18, 1.08);
    this.shadow.setAlpha(this.shadow.texture ? 0.78 : 0.34);
    this.drawRider(this.lane - 1);
    feedback.trigger("land");
    this.cameras.main.shake(115, state.performance.lowEffectsMode ? 0.003 : 0.006);
    this.tweens.add({
      targets: this.shadow,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Quad.easeOut"
    });
    const ring = this.add.circle(this.rider.x, this.rider.y + 72, 10, 0xffffff, 0).setStrokeStyle(4, 0xdff8ff, 0.8).setDepth(19);
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
    this.rider.setPosition(this.laneToX(this.lane), this.getRiderBaseY());
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

  isTowerMode() {
    return isTowerMode();
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

function drawMtbTitleHero(scene, x, y) {
  const { width, height } = scene.scale;
  const g = scene.add.graphics();
  g.fillStyle(0xdff8ff, 0.18);
  g.beginPath();
  g.moveTo(width * 0.5, y - 42);
  g.lineTo(width + 48, height * 0.74);
  g.lineTo(-48, height * 0.74);
  g.closePath();
  g.fillPath();
  g.lineStyle(5, 0x35d4ff, 0.52);
  g.lineBetween(x - 52, y - 32, 28, height * 0.72);
  g.lineBetween(x + 52, y - 32, width - 28, height * 0.72);
  g.lineStyle(4, 0xff7a18, 0.64);
  g.lineBetween(x - 74, y + 10, 12, height * 0.78);
  g.lineBetween(x + 74, y + 10, width - 12, height * 0.78);

  if (scene.textures.exists("mtbTrackTape")) {
    scene.add.image(x - 128, y + 116, "mtbTrackTape").setDisplaySize(178, 62).setAngle(-15).setAlpha(0.9);
    scene.add.image(x + 128, y + 112, "mtbTrackTape").setDisplaySize(178, 62).setAngle(15).setFlipX(true).setAlpha(0.9);
  }
  if (scene.textures.exists("riderMtbBoostState")) {
    scene.add.image(x + 44, y + 54, "riderMtbBoostState").setDisplaySize(292, 188).setAngle(-6);
  } else if (scene.textures.exists("riderMtbBoost")) {
    scene.add.image(x + 44, y + 54, "riderMtbBoost").setDisplaySize(292, 188).setAngle(-6);
  } else {
    drawRiderSilhouette(scene, x - 24, y - 14);
  }
}

function starsText(stars) {
  const fullStar = "\u2605";
  const emptyStar = "\u2606";
  return `${fullStar.repeat(stars)}${emptyStar.repeat(3 - stars)}`;
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
  scene: [BootScene, TutorialIntroScene, MenuScene, SkyTowerScene, RaceScene, ResultScene, TutorialCompleteScene]
});

window.addEventListener("resize", () => {
  game.scale.refresh();
});
