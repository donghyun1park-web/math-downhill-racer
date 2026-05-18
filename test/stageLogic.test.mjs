import test from "node:test";
import assert from "node:assert/strict";
import {
  STAGES,
  calculateStars,
  createInitialProgress,
  getAllowedOperations,
  getStageDifficulty,
  createInitialLearningStats,
  createTutorialCompletion,
  createTutorialProblem,
  generateProblem,
  mergeStageResult
  ,summarizeLearningStats,
  shouldRecordLearningResult,
  skipTutorial,
  updateLearningStats
} from "../src/stageLogic.js";

test("stage list starts with only stage 1 unlocked by default", () => {
  const progress = createInitialProgress();

  assert.equal(STAGES.length, 5);
  assert.equal(progress.unlockedStage, 1);
  assert.deepEqual(progress.bestScores, {});
});

test("star reward follows clear, accuracy, and combo thresholds", () => {
  assert.equal(calculateStars({ cleared: false, accuracy: 100, bestCombo: 10 }), 0);
  assert.equal(calculateStars({ cleared: true, accuracy: 60, bestCombo: 1 }), 1);
  assert.equal(calculateStars({ cleared: true, accuracy: 70, bestCombo: 1 }), 2);
  assert.equal(calculateStars({ cleared: true, accuracy: 85, bestCombo: 5 }), 3);
});

test("clearing a stage saves best result and unlocks the next stage", () => {
  const progress = createInitialProgress();
  const next = mergeStageResult(progress, 1, {
    cleared: true,
    score: 2450,
    accuracy: 82,
    bestCombo: 6,
    stars: 2
  });

  assert.equal(next.unlockedStage, 2);
  assert.deepEqual(next.bestScores[1], {
    score: 2450,
    stars: 2,
    accuracy: 82,
    bestCombo: 6
  });
});

test("multiplication and division only appear when explicitly enabled", () => {
  assert.deepEqual(getAllowedOperations({ add: true, sub: true, mul: false, div: false }), ["add", "sub"]);
  assert.deepEqual(getAllowedOperations({ add: true, sub: true, mul: true, div: true }), ["add", "sub", "mul", "div"]);
});

test("stage difficulty grows gently across stage ids", () => {
  assert.deepEqual(getStageDifficulty(1), { max: 20, blankChance: 0, easyCarry: true });
  assert.deepEqual(getStageDifficulty(5), { max: 100, blankChance: 0.25, easyCarry: false });
});

test("generated problem includes metadata and choices", () => {
  const problem = generateProblem({
    operations: { add: true, sub: true, mul: false, div: false },
    stageId: 2,
    learningStats: createInitialLearningStats(),
    rng: () => 0.1
  });

  assert.equal(typeof problem.operation, "string");
  assert.equal(typeof problem.problemKey, "string");
  assert.equal(typeof problem.difficultyTag, "string");
  assert.equal(problem.choices.includes(problem.answer), true);
  assert.equal(problem.choices.length, 2);
  assert.equal(typeof problem.hasCarryOrBorrow, "boolean");
});

test("generated problem respects multiplication and division disabled", () => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    const problem = generateProblem({
      operations: { add: true, sub: true, mul: false, div: false },
      stageId: 5,
      learningStats: createInitialLearningStats()
    });
    seen.add(problem.operation);
  }

  assert.equal(seen.has("mul"), false);
  assert.equal(seen.has("div"), false);
});

test("recent five problem keys are avoided when possible", () => {
  const recentResults = ["2+2", "3+3", "4+4", "5+5", "6+6"].map((problemKey) => ({
    problemKey,
    operation: "add",
    correct: true,
    stageId: 1,
    timestamp: 1
  }));
  const problem = generateProblem({
    operations: { add: true, sub: false, mul: false, div: false },
    stageId: 1,
    learningStats: { ...createInitialLearningStats(), recentResults },
    rng: () => 0
  });

  assert.equal(recentResults.some((item) => item.problemKey === problem.problemKey), false);
});

test("wrong choices are positive and different from the answer", () => {
  for (let i = 0; i < 40; i += 1) {
    const problem = generateProblem({
      operations: { add: true, sub: true, mul: false, div: false },
      stageId: 3,
      learningStats: createInitialLearningStats()
    });
    const wrongChoices = problem.choices.filter((choice) => choice !== problem.answer);
    assert.equal(wrongChoices.length, 1);
    assert.notEqual(wrongChoices[0], problem.answer);
    assert.equal(wrongChoices[0] > 0, true);
    assert.equal(Math.abs(wrongChoices[0] - problem.answer) <= 5, true);
  }
});

test("learning stats update totals and operation recent wrong", () => {
  const problem = {
    problemKey: "17-8",
    operation: "sub",
    difficultyTag: "two_digit_borrow"
  };
  const afterWrong = updateLearningStats(createInitialLearningStats(), problem, false, 2, 100);
  const afterCorrect = updateLearningStats(afterWrong, problem, true, 2, 101);

  assert.equal(afterCorrect.totalAnswered, 2);
  assert.equal(afterCorrect.totalCorrect, 1);
  assert.equal(afterCorrect.byOperation.sub.answered, 2);
  assert.equal(afterCorrect.byOperation.sub.correct, 1);
  assert.equal(afterCorrect.byOperation.sub.recentWrong, 1);
  assert.equal(afterCorrect.byProblemKey["17-8"].answered, 2);
  assert.equal(afterCorrect.byProblemKey["17-8"].correct, 1);
  assert.equal(afterCorrect.byProblemKey["17-8"].lastResult, true);
});

test("recent learning results are capped at 50 entries", () => {
  let stats = createInitialLearningStats();
  for (let i = 0; i < 55; i += 1) {
    stats = updateLearningStats(stats, {
      problemKey: `${i}+1`,
      operation: "add",
      difficultyTag: "add_under_20"
    }, i % 2 === 0, 1, i);
  }

  assert.equal(stats.recentResults.length, 50);
  assert.equal(stats.recentResults[0].problemKey, "5+1");
});

test("weakness adjustment does not enable disabled operations", () => {
  const weakStats = createInitialLearningStats();
  weakStats.byOperation.mul.recentWrong = 10;
  weakStats.byOperation.div.recentWrong = 10;

  for (let i = 0; i < 40; i += 1) {
    const problem = generateProblem({
      operations: { add: true, sub: true, mul: false, div: false },
      stageId: 5,
      learningStats: weakStats,
      rng: () => 0.24
    });
    assert.notEqual(problem.operation, "mul");
    assert.notEqual(problem.operation, "div");
  }
});

test("learning summary reports accuracy and recommended practice", () => {
  const stats = createInitialLearningStats();
  stats.totalAnswered = 10;
  stats.totalCorrect = 7;
  stats.byOperation.sub.recentWrong = 4;
  stats.recentResults = [{ problemKey: "17-8", operation: "sub", correct: false, stageId: 2, timestamp: 1 }];

  const summary = summarizeLearningStats(stats);

  assert.equal(summary.accuracy, 70);
  assert.equal(summary.hardestOperation, "sub");
  assert.equal(summary.recommendation, "Borrowing subtraction");
  assert.deepEqual(summary.recentWrongKeys, ["17-8"]);
});

test("tutorial problems use addition and subtraction only", () => {
  const seen = new Set();
  for (let step = 1; step <= 4; step += 1) {
    const problem = createTutorialProblem(step);
    seen.add(problem.operation);
  }

  assert.equal(seen.has("mul"), false);
  assert.equal(seen.has("div"), false);
});

test("tutorial problems ignore multiplication and division settings", () => {
  const problem = createTutorialProblem(2, { add: false, sub: false, mul: true, div: true });

  assert.equal(["add", "sub"].includes(problem.operation), true);
  assert.equal(problem.choices.includes(problem.answer), true);
});

test("tutorial completion and skip states store completed true", () => {
  const completed = createTutorialCompletion(1000);
  const skipped = skipTutorial(2000);

  assert.deepEqual(completed, { completed: true, completedAt: 1000 });
  assert.deepEqual(skipped, { completed: true, completedAt: 2000 });
});

test("tutorial problems can be excluded from learning stats", () => {
  const tutorialProblem = createTutorialProblem(2);
  const normalProblem = generateProblem({
    operations: { add: true, sub: true, mul: false, div: false },
    stageId: 1,
    learningStats: createInitialLearningStats()
  });

  assert.equal(shouldRecordLearningResult(tutorialProblem), false);
  assert.equal(shouldRecordLearningResult(normalProblem), true);
});
