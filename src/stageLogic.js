export const STAGES = [
  {
    id: 1,
    name: "Snow Trail",
    targetDistance: 1000,
    baseSpeed: 42,
    obstacleRate: 1.0,
    gateRate: 1.0,
    jumpRate: 0.8,
    weather: "snow"
  },
  {
    id: 2,
    name: "Forest Rush",
    targetDistance: 1250,
    baseSpeed: 48,
    obstacleRate: 1.08,
    gateRate: 1.05,
    jumpRate: 0.9,
    weather: "forest"
  },
  {
    id: 3,
    name: "Ice Bridge",
    targetDistance: 1450,
    baseSpeed: 54,
    obstacleRate: 1.12,
    gateRate: 1.08,
    jumpRate: 1.0,
    weather: "ice"
  },
  {
    id: 4,
    name: "Alpine Jump",
    targetDistance: 1650,
    baseSpeed: 58,
    obstacleRate: 1.16,
    gateRate: 1.12,
    jumpRate: 1.15,
    weather: "clear"
  },
  {
    id: 5,
    name: "Storm Descent",
    targetDistance: 1900,
    baseSpeed: 62,
    obstacleRate: 1.22,
    gateRate: 1.16,
    jumpRate: 1.25,
    weather: "storm"
  }
];

export const LEARNING_STATS_KEY = "math-downhill-learning-stats";
export const TUTORIAL_KEY = "math-downhill-tutorial-complete";
export const MAX_PROBLEM_GENERATION_ATTEMPTS = 20;
const OPERATION_KEYS = ["add", "sub", "mul", "div"];

export function createInitialProgress() {
  return {
    unlockedStage: 1,
    bestScores: {}
  };
}

export function normalizeProgress(value) {
  const fallback = createInitialProgress();
  if (!value || typeof value !== "object") return fallback;
  const unlockedStage = clampNumber(Number(value.unlockedStage || 1), 1, STAGES.length);
  const bestScores = value.bestScores && typeof value.bestScores === "object" ? value.bestScores : {};
  return { unlockedStage, bestScores };
}

export function calculateStars({ cleared, accuracy, bestCombo }) {
  if (!cleared) return 0;
  if (accuracy >= 85 && bestCombo >= 5) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}

export function mergeStageResult(progress, stageId, result) {
  const normalized = normalizeProgress(progress);
  const previous = normalized.bestScores[stageId] || {};
  const nextBest = {
    score: Math.max(Number(previous.score || 0), result.score),
    stars: Math.max(Number(previous.stars || 0), result.stars),
    accuracy: Math.max(Number(previous.accuracy || 0), result.accuracy),
    bestCombo: Math.max(Number(previous.bestCombo || 0), result.bestCombo)
  };
  const unlockedStage = result.cleared
    ? Math.max(normalized.unlockedStage, Math.min(stageId + 1, STAGES.length))
    : normalized.unlockedStage;

  return {
    unlockedStage,
    bestScores: {
      ...normalized.bestScores,
      [stageId]: nextBest
    }
  };
}

export function getAllowedOperations(operations) {
  const allowed = [];
  if (operations.add) allowed.push("add");
  if (operations.sub) allowed.push("sub");
  if (operations.mul) allowed.push("mul");
  if (operations.div) allowed.push("div");
  return allowed.length ? allowed : ["add", "sub"];
}

export function getStageDifficulty(stageId) {
  if (stageId <= 1) return { max: 20, blankChance: 0, easyCarry: true };
  if (stageId === 2) return { max: 30, blankChance: 0, easyCarry: false };
  if (stageId === 3) return { max: 50, blankChance: 0, easyCarry: false };
  if (stageId === 4) return { max: 100, blankChance: 0.1, easyCarry: false };
  return { max: 100, blankChance: 0.25, easyCarry: false };
}

export function createInitialLearningStats() {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    byOperation: Object.fromEntries(OPERATION_KEYS.map((operation) => [operation, {
      answered: 0,
      correct: 0,
      recentWrong: 0
    }])),
    byProblemKey: {},
    recentResults: []
  };
}

export function normalizeLearningStats(value) {
  const fallback = createInitialLearningStats();
  if (!value || typeof value !== "object") return fallback;
  const byOperation = { ...fallback.byOperation };
  for (const operation of OPERATION_KEYS) {
    byOperation[operation] = {
      answered: Number(value.byOperation?.[operation]?.answered || 0),
      correct: Number(value.byOperation?.[operation]?.correct || 0),
      recentWrong: Number(value.byOperation?.[operation]?.recentWrong || 0)
    };
  }
  return {
    totalAnswered: Number(value.totalAnswered || 0),
    totalCorrect: Number(value.totalCorrect || 0),
    byOperation,
    byProblemKey: value.byProblemKey && typeof value.byProblemKey === "object" ? value.byProblemKey : {},
    recentResults: Array.isArray(value.recentResults) ? value.recentResults.slice(-50) : []
  };
}

export function generateProblem({ operations, stageId, learningStats = createInitialLearningStats(), rng = Math.random }) {
  const stats = normalizeLearningStats(learningStats);
  const recentKeys = new Set(stats.recentResults.slice(-5).map((item) => item.problemKey));
  let candidate = null;

  for (let attempt = 0; attempt < MAX_PROBLEM_GENERATION_ATTEMPTS; attempt += 1) {
    const attemptRng = () => (rng() + attempt * 0.137) % 1;
    candidate = createProblemCandidate(operations, stageId, stats, attemptRng);
    if (!recentKeys.has(candidate.problemKey)) break;
  }

  return candidate;
}

export function createTutorialProblem(step = 2) {
  if (step === 4) {
    return buildTutorialProblem({
      question: "6 - 2",
      answer: 4,
      wrong: 5,
      operation: "sub",
      problemKey: "tutorial-6-2",
      difficultyTag: "sub_under_20"
    });
  }
  return buildTutorialProblem({
    question: "3 + 2",
    answer: 5,
    wrong: 7,
    operation: "add",
    problemKey: "tutorial-3+2",
    difficultyTag: "add_under_20"
  });
}

export function createTutorialCompletion(timestamp = Date.now()) {
  return {
    completed: true,
    completedAt: timestamp
  };
}

export function skipTutorial(timestamp = Date.now()) {
  return createTutorialCompletion(timestamp);
}

export function shouldRecordLearningResult(problem) {
  return problem?.source !== "tutorial";
}

export function updateLearningStats(stats, problem, correct, stageId, timestamp = Date.now()) {
  const next = normalizeLearningStats(stats);
  const operation = OPERATION_KEYS.includes(problem.operation) ? problem.operation : "add";
  next.totalAnswered += 1;
  if (correct) next.totalCorrect += 1;

  next.byOperation[operation] = {
    answered: next.byOperation[operation].answered + 1,
    correct: next.byOperation[operation].correct + (correct ? 1 : 0),
    recentWrong: correct ? next.byOperation[operation].recentWrong : next.byOperation[operation].recentWrong + 1
  };

  const previousProblem = next.byProblemKey[problem.problemKey] || { answered: 0, correct: 0, lastResult: null };
  next.byProblemKey[problem.problemKey] = {
    answered: previousProblem.answered + 1,
    correct: previousProblem.correct + (correct ? 1 : 0),
    lastResult: Boolean(correct)
  };

  next.recentResults = [...next.recentResults, {
    problemKey: problem.problemKey,
    operation,
    correct: Boolean(correct),
    stageId,
    timestamp
  }].slice(-50);

  return next;
}

export function summarizeLearningStats(stats) {
  const normalized = normalizeLearningStats(stats);
  const accuracy = normalized.totalAnswered ? Math.round((normalized.totalCorrect / normalized.totalAnswered) * 100) : 0;
  const hardestOperation = OPERATION_KEYS.reduce((hardest, operation) => {
    return normalized.byOperation[operation].recentWrong > normalized.byOperation[hardest].recentWrong ? operation : hardest;
  }, "add");
  const recentWrongKeys = normalized.recentResults
    .filter((item) => !item.correct)
    .slice(-3)
    .map((item) => item.problemKey);

  return {
    accuracy,
    hardestOperation,
    hardestLabel: operationLabel(hardestOperation),
    recentWrongKeys,
    recommendation: recommendationFor(hardestOperation)
  };
}

function createProblemCandidate(operations, stageId, stats, rng) {
  const difficulty = getStageDifficulty(stageId);
  const allowed = getAllowedOperations(operations);
  const operation = chooseOperation(allowed, stats, rng);
  let a = randomInt(2, difficulty.max, rng);
  let b = randomInt(2, Math.max(8, Math.floor(difficulty.max / 2)), rng);
  let answer;
  let question;
  let problemKey;
  let difficultyTag;
  let hasCarryOrBorrow = false;

  if (operation === "sub") {
    if (b > a) [a, b] = [b, a];
    if (difficulty.easyCarry) b = Math.min(b, Math.max(2, a % 10 || 5));
    answer = a - b;
    hasCarryOrBorrow = (a % 10) < (b % 10);
    difficultyTag = hasCarryOrBorrow ? "two_digit_borrow" : a <= 20 ? "sub_under_20" : "sub_two_digit";
    problemKey = `${a}-${b}`;
    if (difficulty.blankChance > 0 && rng() < difficulty.blankChance) {
      question = `${a} - ? = ${answer}`;
      answer = b;
      problemKey = `${a}-?=${a - b}`;
      difficultyTag = "blank_sub";
    } else {
      question = `${a} - ${b}`;
    }
  } else if (operation === "mul") {
    a = randomInt(2, 9, rng);
    b = randomInt(2, 9, rng);
    answer = a * b;
    question = `${a} x ${b}`;
    problemKey = `${a}x${b}`;
    difficultyTag = "mul_basic";
  } else if (operation === "div") {
    b = randomInt(2, 9, rng);
    answer = randomInt(2, 9, rng);
    a = answer * b;
    question = `${a} / ${b}`;
    problemKey = `${a}/${b}`;
    difficultyTag = "div_basic";
  } else {
    if (difficulty.easyCarry) {
      a = randomInt(2, 10, rng);
      b = randomInt(2, 10, rng);
    }
    if (a + b > difficulty.max) b = Math.max(2, difficulty.max - a);
    answer = a + b;
    hasCarryOrBorrow = (a % 10) + (b % 10) >= 10;
    difficultyTag = hasCarryOrBorrow ? "two_digit_carry" : a + b <= 20 ? "add_under_20" : "add_two_digit";
    problemKey = `${a}+${b}`;
    if (difficulty.blankChance > 0 && rng() < difficulty.blankChance) {
      question = `${a} + ? = ${answer}`;
      answer = b;
      problemKey = `${a}+?=${a + b}`;
      difficultyTag = "blank_add";
    } else {
      question = `${a} + ${b}`;
    }
  }

  const wrong = makeWrongChoice(answer, rng);
  const choices = rng() < 0.5 ? [answer, wrong] : [wrong, answer];
  return {
    question,
    text: `${question} = ?`,
    answer,
    wrong,
    choices,
    operation,
    problemKey,
    difficultyTag,
    hasCarryOrBorrow
  };
}

function buildTutorialProblem({ question, answer, wrong, operation, problemKey, difficultyTag }) {
  return {
    question,
    text: `${question} = ?`,
    answer,
    wrong,
    choices: [answer, wrong],
    operation,
    problemKey,
    difficultyTag,
    hasCarryOrBorrow: false,
    source: "tutorial"
  };
}

function chooseOperation(allowed, stats, rng) {
  if (allowed.length === 1) return allowed[0];
  const weaknessEligible = allowed
    .map((operation) => ({ operation, recentWrong: stats.byOperation[operation]?.recentWrong || 0 }))
    .filter((item) => item.recentWrong > 0)
    .sort((a, b) => b.recentWrong - a.recentWrong);
  if (weaknessEligible.length && rng() < 0.25) return weaknessEligible[0].operation;
  return allowed[Math.min(allowed.length - 1, Math.floor(rng() * allowed.length))];
}

function makeWrongChoice(answer, rng) {
  const offsets = [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
  const start = Math.floor(rng() * offsets.length);
  for (let i = 0; i < offsets.length; i += 1) {
    const wrong = answer + offsets[(start + i) % offsets.length];
    if (wrong > 0 && wrong !== answer) return wrong;
  }
  return answer + 1;
}

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function operationLabel(operation) {
  return {
    add: "addition",
    sub: "subtraction",
    mul: "multiplication",
    div: "division"
  }[operation] || "addition";
}

function recommendationFor(operation) {
  return {
    add: "Two-digit addition",
    sub: "Borrowing subtraction",
    mul: "Basic multiplication",
    div: "Basic division"
  }[operation] || "Two-digit addition";
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
