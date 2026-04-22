// Central configuration values and game constants.
import {
  VIEW_STATES,
  LETTER_KEYS,
  NUMBER_KEYS,
  RESULT_DELAY_MS,
  PRE_REVEAL_DELAY_MS,
  CHARACTER_REVEAL_INTERVAL_MS,
  COMMA_PAUSE_MS,
  PERIOD_PAUSE_MS,
  QUESTION_TIMER_BONUS_TIMER,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_LABEL_DURATION_MS,
  LONG_PRESS_MS,
  TIMER_FULLSCREEN_HOLD_MS,
  PLAYER_UNID_STORAGE_KEY,
  IS_DEV_MODE,
  GAME_PROGRESS_STORAGE_KEY_PREFIX,
  FAST_POINT_WINDOW_DURATIONS_MS,
  QUESTION_DURATION_MS,
  MAX_FAST_POINTS
} from "./js/config.js";

// Daily quiz API client for loading the remote question pack.
import {
  loadDailyQuizPack
} from "./js/daily-quiz-api.js";

// Local storage helpers for player identity and persisted progress.
import {
  getOrCreatePlayerUnid,
  loadSavedProgress,
  persistSavedProgress
} from "./js/storage.js";

// Pure quiz helper utilities for normalization, answer checks, and result messaging.
import {
  normalize,
  getQuestionAnswerCodes,
  getRevealAnswerText,
  getResultMessage,
  expandAnswerOptions,
  getComparableAnswerOptions,
  isCurrentAnswerCorrect,
  parseQuizDate,
  formatQuizDateForQuery
} from "./js/quiz-helpers.js";

import { createQuizNavigationController } from "./js/quiz-navigation.js";

// How-to-play modal controls and seen-state tracking.
import { openHowToPlay, hasSeenHowToPlay } from "./js/how-to-play.js";

// Progress-model helpers for result shaping, restore, merge, and resume reconciliation.
import {
  clampResumeQuestionIndex,
  buildAnswerHistoryFromResults,
  mergeResultsSnapshot,
  restoreResultStateFromSavedProgress as restoreResultStateFromProgress,
  reconcileSkippedQuestionsInSavedProgress as reconcileSkippedProgress
} from "./js/progress-model.js";

// Result persistence, submission payload shaping, and share text/copy helpers.
import {
  buildSubmissionPayload,
  buildCompletedProgress,
  buildSubmittedProgress,
  postResultsToEndpoint,
  shareResults,
  buildCanonicalQuizUrl,
} from "./js/results-share.js";

import {
  normalizeDailyQuizResultStatsFromPack,
  buildBetterThanText
} from "./js/score-percentile.js";

import { createQuestionReviewController } from "./js/question-review-modal.js";

// View state management
let currentView = null;
let questions = [];
let TOTAL_POSSIBLE_SCORE = 0;
let GAME_PROGRESS_STORAGE_KEY = "";

const scoreValueEl = document.querySelector("#scoreValue");
const fastPointsValueEl = document.querySelector("#fastPointsValue");
const timerFillEl = document.querySelector("#timerFill");
const timerTrackEl = document.querySelector(".timer-track");
const hudEl = document.querySelector(".hud");
const questionPanelEl = document.querySelector("#questionPanel");
const questionTextEl = document.querySelector("#questionText");
const feedbackTextEl = document.querySelector("#feedbackText");
const numberAnswerDisplayEl = document.querySelector("#numberAnswerDisplay");
const keypadEl = document.querySelector("#keypad");
const pregameHeaderEl = document.querySelector("#pregameHeader");
const introPanelEl = document.querySelector("#introPanel");
const startButtonEl = document.querySelector("#startButton");
const howToPlayButtonEl = document.querySelector("#howToPlayButton");
const packDateDisplayEl = document.querySelector("#packDateDisplay");
const startupStatusTextEl = document.querySelector("#startupStatusText");
const finishPanelEl = document.querySelector("#finishPanel");
const prevQuizButtonEl = document.querySelector("#prevQuizButton");
const nextQuizButtonEl = document.querySelector("#nextQuizButton");
const startFooterNavEl = document.querySelector("#startFooterNav");
const finalScoreValueEl = document.querySelector("#finalScoreValue");
const scorePercentileTextEl = document.querySelector("#scorePercentileText");
const shareScoreButtonEl = document.querySelector("#shareScoreButton");
const viewQuestionsButtonEl = document.querySelector("#viewQuestionsButton");
const replayButtonEl = document.querySelector("#replayButton");
const questionReviewPanelEl = document.querySelector("#questionReviewPanel");
const questionReviewCloseButtonEl = document.querySelector("#questionReviewCloseButton");
const questionReviewListEl = document.querySelector("#questionReviewList");
const devResetProgressButtonIntroEl = document.querySelector("#devResetProgressButtonIntro");
const modeHintOverlayEl = document.querySelector("#modeHintOverlay");
const modeHintTitleEl = modeHintOverlayEl?.querySelector(".mode-hint-title");
const modeHintTextEl = modeHintOverlayEl?.querySelector(".mode-hint-text");

let questionReviewController = null;

// Hide dev buttons if not in development mode
if (!IS_DEV_MODE) {
  if (devResetProgressButtonIntroEl) devResetProgressButtonIntroEl.hidden = true;
}

// Central view state setter
function setCurrentView(viewState) {
  if (currentView === viewState) {
    return;
  }

  currentView = viewState;
  questionReviewController?.close();

  // Hide all panels
  introPanelEl.hidden = true;
  questionPanelEl.hidden = true;
  finishPanelEl.hidden = true;
  startFooterNavEl.hidden = true;
  pregameHeaderEl.hidden = true;
  hudEl.hidden = true;
  keypadEl.hidden = true;
  numberAnswerDisplayEl.hidden = true;
  packDateDisplayEl.hidden = true;

  // Show relevant panels based on view state
  switch (viewState) {
    case VIEW_STATES.START:
      introPanelEl.hidden = false;
      pregameHeaderEl.hidden = false;
      packDateDisplayEl.hidden = false;
      startFooterNavEl.hidden = false;
      updateStartButtonText();
      break;

    case VIEW_STATES.GAME:
      hudEl.hidden = false;
      questionPanelEl.hidden = false;
      keypadEl.hidden = false;
      break;

    case VIEW_STATES.FINISH:
      finishPanelEl.hidden = false;
      pregameHeaderEl.hidden = false;
      packDateDisplayEl.hidden = false;
      startFooterNavEl.hidden = false;
      break;
  }
}

let score = 0;
let questionIndex = 0;
let typedAnswer = "";
let remainingMs = QUESTION_DURATION_MS;
let activeFastPointWindowDurationsMs = [...FAST_POINT_WINDOW_DURATIONS_MS];
let activeQuestionDurationMs = QUESTION_DURATION_MS;
let timerHandle = null;
let autoNextHandle = null;
let preTimerHandle = null;
let modeHintHandle = null;
let characterRevealHandles = [];
let questionLocked = false;
let gameFinished = false;
let answerHistory = [];
let resultsByQuestionIndex = {};
let sequenceOrderCodes = [];
let sequenceFinalizing = false;
let activePackDate = null;
let packScoreStats = null;

let savedProgress = loadSavedProgress(GAME_PROGRESS_STORAGE_KEY, TOTAL_POSSIBLE_SCORE);
const playerUnid = getOrCreatePlayerUnid(PLAYER_UNID_STORAGE_KEY);


let timerFullscreenHoldHandle = null;

function setStartupStatus(message, { state = "info" } = {}) {
  if (!startupStatusTextEl) {
    return;
  }

  startupStatusTextEl.textContent = message;

  if (state === "warning") {
    startupStatusTextEl.dataset.state = "warning";
  } else {
    delete startupStatusTextEl.dataset.state;
  }
}

function formatPackDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const suffixes = ["th","st","nd","rd"];
  const v = day % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long" });
  return `${day}${suffix} ${monthName} ${year}`;
}

function prepareForQuizNavigation() {
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  clearModeHintTimer();
  if (modeHintOverlayEl) {
    modeHintOverlayEl.hidden = true;
    modeHintOverlayEl.classList.remove("visible");
  }
  stopTimer();
  questionLocked = true;
}

const quizNavigation = createQuizNavigationController({
  getActivePackDate: () => activePackDate,
  onBeforeNavigate: prepareForQuizNavigation,
  onLoadQuiz: initializeAppStartup,
  setStartupStatus,
  startButtonEl,
  howToPlayButtonEl,
  prevQuizButtonEl,
  nextQuizButtonEl
});

async function initializeQuestionPack() {
  const { pack, usedFallbackPack, lastError } = await loadDailyQuizPack({
    setStartupStatus,
    timeoutMs: 8000,
    maxAttempts: 2,
    retryDelayMs: 450
  });

  questions = pack.questions;
  GAME_PROGRESS_STORAGE_KEY = `${GAME_PROGRESS_STORAGE_KEY_PREFIX}:${pack.packDate}`;
  activePackDate = String(pack.packDate || "").trim() || null;
  quizNavigation.updateButtons();
  if (packDateDisplayEl && pack.packDate) {
    packDateDisplayEl.textContent = formatPackDate(pack.packDate);
  }
  TOTAL_POSSIBLE_SCORE = questions.length * MAX_FAST_POINTS;

  savedProgress = loadSavedProgress(GAME_PROGRESS_STORAGE_KEY, TOTAL_POSSIBLE_SCORE);
  restoreResultStateFromSavedProgress();
  reconcileSkippedQuestionsInSavedProgress();

  if (Object.keys(resultsByQuestionIndex).length === 0) {
    restoreResultStateFromSavedProgress();
  }

  preloadPackScoreStats(pack);

  return { usedFallbackPack };
}

function preloadPackScoreStats(pack) {
  packScoreStats = normalizeDailyQuizResultStatsFromPack(pack);
  updateScorePercentileText();
}

async function initializeAppStartup() {
  const { usedFallbackPack } = await initializeQuestionPack();

  startButtonEl.disabled = false;
  howToPlayButtonEl.disabled = false;
  updateStartButtonText();

  if (usedFallbackPack) {
    setStartupStatus("Using backup questions (offline mode).", { state: "warning" });
  } else {
    setStartupStatus("");
  }

  if (savedProgress.completed) {
    restoreCompletedGameState();
  } else {
    setCurrentView(VIEW_STATES.START);
    if (!hasSeenHowToPlay()) {
      setTimeout(() => {
        openHowToPlay();
      }, 800);
    }
  }
}


function updateStartButtonText() {
  if (savedProgress.completed || (savedProgress.currentQuestionIndex > 0)) {
    startButtonEl.textContent = "Continue";
  } else {
    startButtonEl.textContent = "Start";
  }
}

function handleStartGame() {
  if(!hasSeenHowToPlay()){return}
  if (savedProgress.completed) {
    restoreCompletedGameState();
  } else if (savedProgress.currentQuestionIndex > 0) {
    restoreInProgressGameState();
    setCurrentView(VIEW_STATES.GAME);
    loadQuestion();
  } else {
    restartGame();
  }
  window.parent.postMessage({ type: 'sq-start' }, '*');
}



function clearSavedProgressForDevTesting() {
  savedProgress = {
    completed: false,
    submitted: false,
    replayed: false,
    firstScore: 0,
    currentScore: 0,
    currentQuestionIndex: 0,
    totalPossible: TOTAL_POSSIBLE_SCORE,
    results: {},
    answerHistory: [],
    completedAt: null,
    submittedAt: null
  };
  setCurrentView('');
  setCurrentView(VIEW_STATES.START);
  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function persistCompletedProgressIfFirstRun() {
  if (savedProgress.completed) {
    return;
  }

  savedProgress = buildCompletedProgress({
    savedProgress,
    score,
    questionCount: questions.length,
    totalPossible: TOTAL_POSSIBLE_SCORE,
    resultsByQuestionIndex,
    answerHistory,
    completedAt: new Date().toISOString()
  });

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
  submitResult();
}

function persistSubmittedProgress() {
  if (savedProgress.submitted) {
    return;
  }

  savedProgress = buildSubmittedProgress({
    savedProgress,
    submittedAt: new Date().toISOString()
  });

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function submitResult() {
// Don't allow sharing if this is a replay
  if (savedProgress.replayed) {
    return;
  }

  const resultEntries = buildAnswerHistoryFromResults(getMergedResultsSnapshot());

  const submission = buildSubmissionPayload({
    gameProgressStorageKey: GAME_PROGRESS_STORAGE_KEY,
    playerUnid,
    score,
    totalPossible: TOTAL_POSSIBLE_SCORE,
    resultEntries,
    questions,
    completedAt: savedProgress.completedAt || new Date().toISOString(),
  });

  console.log("Leaderboard submission", submission);

  postResultsToEndpoint(submission)
    .then((e) => {
      console.log("Results submission successful", e);
    })
    .catch((error) => {
      console.error("Results submission failed", error);
    });
    persistSubmittedProgress();
  }
  if (!savedProgress.submitted) {
}

function getMergedResultsSnapshot() {
  return mergeResultsSnapshot(savedProgress, resultsByQuestionIndex);
}

function reconcileSkippedQuestionsInSavedProgress() {
  const { nextSavedProgress, didUpdate } = reconcileSkippedProgress({
    savedProgress,
    questions,
    getRevealAnswerText
  });

  if (!didUpdate) {
    return;
  }

  savedProgress = nextSavedProgress;
  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function restoreResultStateFromSavedProgress() {
  const restored = restoreResultStateFromProgress(savedProgress);
  resultsByQuestionIndex = restored.resultsByQuestionIndex;
  answerHistory = restored.answerHistory;
}

function persistInProgressPosition({ indexOffset = 0 } = {}) {
  if (savedProgress.completed) {
    return;
  }

  savedProgress = {
    ...savedProgress,
    currentScore: score,
    currentQuestionIndex: clampResumeQuestionIndex(questionIndex + indexOffset, questions.length),
    results: { ...resultsByQuestionIndex },
    answerHistory: answerHistory.map((entry) => ({ ...entry }))
  };

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function restoreInProgressGameState() {
  reconcileSkippedQuestionsInSavedProgress();
  score = Number.isFinite(savedProgress.currentScore) ? savedProgress.currentScore : 0;
  questionIndex = clampResumeQuestionIndex(savedProgress.currentQuestionIndex, questions.length);
  restoreResultStateFromSavedProgress();
  scoreValueEl.textContent = String(score);

  if (questionIndex >= questions.length) {
    completeGame();
  }
}

function recordAnswerResult(question, userAnswer, { isCorrect = false, earnedPoints = 0, timedOut = false } = {}) {
  const resultEntry = {
    questionIndex,
    questionId: question.question_id,
    typeCode: question.typeCode,
    userAnswer,
    correctAnswer: getRevealAnswerText(question),
    isCorrect,
    earnedPoints,
    timedOut
  };

  resultsByQuestionIndex[String(questionIndex)] = resultEntry;
  answerHistory = buildAnswerHistoryFromResults(resultsByQuestionIndex);
}

function showFinishPanel() {
  finalScoreValueEl.textContent = String(score);
  updateScorePercentileText();
  setCurrentView(VIEW_STATES.FINISH);
}

function updateScorePercentileText() {
  if (!scorePercentileTextEl) {
    return;
  }

  const text = buildBetterThanText(score, packScoreStats);

  if (!text) {
    scorePercentileTextEl.hidden = true;
    scorePercentileTextEl.textContent = "";
    return;
  }

  scorePercentileTextEl.hidden = false;
  scorePercentileTextEl.textContent = text;
}

function completeGame() {
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  stopTimer();
  gameFinished = true;
  questionLocked = true;
  remainingMs = 0;
  renderTimer();
  fastPointsValueEl.textContent = "0";
  questionTextEl.textContent = "Game finished";
  feedbackTextEl.textContent = `You scored ${score} out of ${TOTAL_POSSIBLE_SCORE}.`;
  persistCompletedProgressIfFirstRun();
  showFinishPanel();
  window.parent.postMessage({ type: 'sq-complete' }, '*');
}

function restartGame() {
  if (savedProgress.completed) {
    restoreCompletedGameState();
    return;
  }

  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  clearModeHintTimer();
  if (modeHintOverlayEl) { modeHintOverlayEl.hidden = true; modeHintOverlayEl.classList.remove("visible"); }
  stopTimer();
  score = 0;
  questionIndex = 0;
  typedAnswer = "";
  remainingMs = QUESTION_DURATION_MS;
  questionLocked = false;
  gameFinished = false;
  resultsByQuestionIndex = {};
  answerHistory = [];
  scoreValueEl.textContent = "0";
  persistInProgressPosition();
  setCurrentView(VIEW_STATES.GAME);
  loadQuestion();
}

function restoreCompletedGameState() {
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  clearModeHintTimer();
  if (modeHintOverlayEl) { modeHintOverlayEl.hidden = true; modeHintOverlayEl.classList.remove("visible"); }
  stopTimer();

  score = savedProgress.firstScore;
  restoreResultStateFromSavedProgress();
  questionIndex = Math.max(0, questions.length - 1);
  typedAnswer = "";
  gameFinished = true;
  questionLocked = true;
  remainingMs = 0;

  scoreValueEl.textContent = String(score);
  renderTimer();
  fastPointsValueEl.textContent = "0";
  questionTextEl.textContent = "Game finished";
  feedbackTextEl.textContent = `You scored ${score} out of ${TOTAL_POSSIBLE_SCORE}.`;
  renderNumberAnswerDisplay();
  renderKeypad();
  showFinishPanel();
}

async function handleShareScore() {
  if (!gameFinished) {
    return;
  }

  if (IS_DEV_MODE) {
    submitResult();
  }

  const resultEntries = buildAnswerHistoryFromResults(getMergedResultsSnapshot());
  const isTomorrowTestPack = new URLSearchParams(window.location.search).get("quiz") === "7777-66-55";
  const result = await shareResults({
    score,
    resultEntries,
    shareUrl: isTomorrowTestPack ? "tomorrow's test pack" : buildCanonicalQuizUrl(activePackDate)
  });

  if (result.success) {
    showCopyNotification(result.text);
  }
}

function showCopyNotification() {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = "Copied to clipboard";

  document.body.appendChild(notification);

  // Position over the share button
  const buttonRect = shareScoreButtonEl.getBoundingClientRect();
  notification.style.position = "fixed";
  notification.style.left = (buttonRect.left + buttonRect.width / 2) + "px";
  notification.style.top = (buttonRect.top - 10) + "px";
  notification.style.transform = "translate(-50%, -100%)";

  // Fade out after 2 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 2000);
}

function handleReplayGame() {
  if (!gameFinished) {
    return;
  }

  questionReviewController?.close();

  // Set the replayed flag to true to persist it
  savedProgress.replayed = true;
  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);

  // Reset game state for a fresh game
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  clearModeHintTimer();
  if (modeHintOverlayEl) { modeHintOverlayEl.hidden = true; modeHintOverlayEl.classList.remove("visible"); }
  stopTimer();
  score = 0;
  questionIndex = 0;
  typedAnswer = "";
  remainingMs = QUESTION_DURATION_MS;
  questionLocked = false;
  gameFinished = false;
  resultsByQuestionIndex = {};
  answerHistory = [];
  scoreValueEl.textContent = "0";

  // Update first score to current score since this is a replay
  savedProgress.firstScore = savedProgress.currentScore;
  savedProgress.currentScore = 0;
  savedProgress.currentQuestionIndex = 0;
  savedProgress.completed = false;
  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);

  // Go back to start screen
  setCurrentView(VIEW_STATES.START);
}

function clearTimerFullscreenHold() {
  if (timerFullscreenHoldHandle) {
    window.clearTimeout(timerFullscreenHoldHandle);
    timerFullscreenHoldHandle = null;
  }
}

function requestPageFullscreen() {
  const fullscreenElement =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;

  if (fullscreenElement) {
    const exitFullscreen =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;

    if (typeof exitFullscreen === "function") {
      exitFullscreen.call(document);
    }
    return;
  }

  const root = document.documentElement;
  const requestFullscreen =
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.msRequestFullscreen;

  if (typeof requestFullscreen === "function") {
    requestFullscreen.call(root);
  }
}

function bindTimerBarFullscreenHold() {
  if (!timerTrackEl) {
    return;
  }

  let holdTriggered = false;

  timerTrackEl.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    holdTriggered = false;
    clearTimerFullscreenHold();
    timerFullscreenHoldHandle = window.setTimeout(() => {
      holdTriggered = true;
      requestPageFullscreen();
    }, TIMER_FULLSCREEN_HOLD_MS);
  });

  const handlePressEnd = (event) => {
    event.preventDefault();
    clearTimerFullscreenHold();
    if (holdTriggered) {
      holdTriggered = false;
    }
  };

  timerTrackEl.addEventListener("pointerup", handlePressEnd);
  timerTrackEl.addEventListener("pointercancel", handlePressEnd);
  timerTrackEl.addEventListener("pointerleave", handlePressEnd);
}

function getCurrentQuestion() {
  return questions[questionIndex];
}

function buildTimerProfileForQuestionType(typeCode) {
  const baseDurations = [...FAST_POINT_WINDOW_DURATIONS_MS];
  const extraTotalMs = Math.max(0, Number(QUESTION_TIMER_BONUS_TIMER[typeCode] || 0));

  const extraPerWindowMs = Math.floor(extraTotalMs / baseDurations.length);
  const remainderMs = extraTotalMs % baseDurations.length;

  const durationsMs = baseDurations.map((durationMs, idx) => (
    durationMs + extraPerWindowMs + (idx < remainderMs ? 1 : 0)
  ));

  const totalDurationMs = durationsMs.reduce((sum, durationMs) => sum + durationMs, 0);
  return {
    durationsMs,
    totalDurationMs
  };
}

function getFastPoints() {
  const elapsedMs = Math.max(0, activeQuestionDurationMs - remainingMs);
  let cumulativeDurationMs = 0;

  for (let idx = 0; idx < activeFastPointWindowDurationsMs.length; idx += 1) {
    cumulativeDurationMs += activeFastPointWindowDurationsMs[idx];
    if (elapsedMs < cumulativeDurationMs) {
      return MAX_FAST_POINTS - idx;
    }
  }

  return 0;
}

function getTimerColor(progress) {
  if (progress <= 0.01) return "#000000";
  if (progress < 0.3) return "#cf2718";
  return "#ffffff";
}

function renderTimer() {
  const progress = remainingMs / activeQuestionDurationMs;
  const pct = Math.max(0, Math.min(100, progress * 100));
  timerFillEl.style.width = `${pct}%`;
  timerFillEl.style.background = getTimerColor(progress);
  timerTrackEl.setAttribute("aria-valuenow", String(Math.round(pct)));
  if (!gameFinished) {
    fastPointsValueEl.textContent = String(getFastPoints());
  }
}

function stopTimer() {
  if (timerHandle) {
    window.clearInterval(timerHandle);
    timerHandle = null;
  }
}

function clearAutoNextTimer() {
  if (autoNextHandle) {
    window.clearTimeout(autoNextHandle);
    autoNextHandle = null;
  }
}

function clearPreTimerDelay() {
  if (preTimerHandle) {
    window.clearTimeout(preTimerHandle);
    preTimerHandle = null;
  }
}

function clearModeHintTimer() {
  if (modeHintHandle) {
    window.clearTimeout(modeHintHandle);
    modeHintHandle = null;
  }
}

function hideModeHint() {
  clearModeHintTimer();
  if (!modeHintOverlayEl) return;
  modeHintOverlayEl.classList.add("hiding");
  modeHintHandle = window.setTimeout(() => {
    modeHintOverlayEl.hidden = true;
    modeHintOverlayEl.classList.remove("hiding");
    modeHintHandle = null;
  }, 260);
}

function showModeHint(type) {
  clearModeHintTimer();
  if (!modeHintOverlayEl || !modeHintTitleEl || !modeHintTextEl) return;
  const hintTitle = QUESTION_TYPE_LABELS[type];
  if (!hintTitle) return;
  modeHintTitleEl.textContent = hintTitle;
  modeHintTextEl.textContent = "";
  modeHintOverlayEl.hidden = false;
  modeHintHandle = window.setTimeout(() => {
    hideModeHint();
  }, QUESTION_TYPE_LABEL_DURATION_MS);
}

function clearCharacterRevealTimers() {
  if (characterRevealHandles.length === 0) {
    return;
  }

  characterRevealHandles.forEach((handle) => {
    window.clearTimeout(handle);
  });
  characterRevealHandles = [];
}

function revealAllQuestionCharacters() {
  const characterEls = questionTextEl.querySelectorAll(".question-character");
  if (characterEls.length === 0) {
    const current = getCurrentQuestion();
    questionTextEl.textContent = String(current?.question || "");
    return;
  }

  characterEls.forEach((characterEl) => {
    characterEl.classList.add("revealed");
  });
}

function getPunctuationPauseMs(char, nextChar) {
  const isPauseBoundary = nextChar === " " || nextChar === undefined;

  if (isPauseBoundary && (char === "," || char === ";" || char === ":" || char === "?" || char === "!")) {
    return COMMA_PAUSE_MS;
  }

  if (isPauseBoundary && char === ".") {
    return PERIOD_PAUSE_MS;
  }

  return 0;
}

function getCharacterRevealIntervalMs() {
  const completedQuestionCount = Math.max(0, questionIndex);
  const possibleScoreSoFar = completedQuestionCount * MAX_FAST_POINTS;

  if (possibleScoreSoFar <= 20) {
    return CHARACTER_REVEAL_INTERVAL_MS;
  }

  const scoreRatio = score / possibleScoreSoFar;

  if (scoreRatio < 0.4) {
    return CHARACTER_REVEAL_INTERVAL_MS + 25;
  } else if (scoreRatio < 0.6) {
    return CHARACTER_REVEAL_INTERVAL_MS + 10;
  }

  return CHARACTER_REVEAL_INTERVAL_MS;
}

function renderQuestionCharacterReveal(questionText, startDelayMs = 0, revealIntervalMs = CHARACTER_REVEAL_INTERVAL_MS) {
  clearCharacterRevealTimers();
  questionTextEl.innerHTML = "";

  const chars = Array.from(String(questionText || ""));
  const fragment = document.createDocumentFragment();
  let cumulativeRevealDelayMs = Math.max(0, startDelayMs);

  chars.forEach((char, index) => {
    if (char === "") {
      return;
    }

    if (/^\s$/.test(char)) {
      fragment.appendChild(document.createTextNode(char));
      return;
    }

    const characterEl = document.createElement("span");
    characterEl.className = "question-character";
    characterEl.textContent = char;
    fragment.appendChild(characterEl);

    cumulativeRevealDelayMs += revealIntervalMs;

    const revealHandle = window.setTimeout(() => {
      characterEl.classList.add("revealed");
    }, cumulativeRevealDelayMs);

    characterRevealHandles.push(revealHandle);
    cumulativeRevealDelayMs += getPunctuationPauseMs(char, chars[index + 1]);
  });

  questionTextEl.appendChild(fragment);
  return cumulativeRevealDelayMs;
}

function scheduleAutoNext() {
  clearAutoNextTimer();
  autoNextHandle = window.setTimeout(() => {
    nextQuestion();
  }, RESULT_DELAY_MS);
}

function lockQuestion(message) {
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  revealAllQuestionCharacters();
  questionLocked = true;
  questionPanelEl.classList.add("showing-answer");
  stopTimer();
  feedbackTextEl.textContent = message;
  scheduleAutoNext();
}

function beginQuestionTimer() {
  stopTimer();
  remainingMs = activeQuestionDurationMs;
  renderTimer();

  const tickMs = 100;
  timerHandle = window.setInterval(() => {
    if (questionLocked) {
      stopTimer();
      return;
    }

    remainingMs = Math.max(0, remainingMs - tickMs);
    renderTimer();

    if (remainingMs <= 0) {
      const current = getCurrentQuestion();
      recordAnswerResult(current, normalize(typedAnswer), { timedOut: true });
      persistInProgressPosition({ indexOffset: 1 });
      lockQuestion(getResultMessage(current, { timedOut: true }));
      renderKeypad();
    }
  }, tickMs);
}

function getLetterKeys() {
  return LETTER_KEYS;
}

function getNumberKeys() {
  return NUMBER_KEYS;
}

function getExpandedLetterInputs() {
  return getLetterKeys().flatMap((key) => key.split(""));
}

function handleAnswerPick(answerCode) {
  if (questionLocked) return;

  hideModeHint();

  const current = getCurrentQuestion();

  if (current.typeCode === "N") {
    appendNumberDigit(answerCode);
    return;
  }

  if (current.typeCode === "S") {
    if (sequenceFinalizing) {
      return;
    }
    pickSequenceAnswer(answerCode);
    return;
  }

  typedAnswer = answerCode;
  evaluateAnswer(answerCode);
}

function pickSequenceAnswer(answerCode) {
  const current = getCurrentQuestion();
  if (current.typeCode !== "S") {
    return;
  }

  const normalizedCode = normalize(answerCode);
  const existingIndex = sequenceOrderCodes.indexOf(normalizedCode);

  if (existingIndex >= 0) {
    if (existingIndex === sequenceOrderCodes.length - 1) {
      sequenceOrderCodes.pop();
    } else {
      sequenceOrderCodes = [];
    }
  } else {
    sequenceOrderCodes.push(normalizedCode);
  }

  typedAnswer = sequenceOrderCodes.join("");
  renderKeypad();

  const totalSequenceOptions = Array.isArray(current.options) ? current.options.length : 0;
  if (totalSequenceOptions > 0 && sequenceOrderCodes.length === totalSequenceOptions) {
    sequenceFinalizing = true;
      if (getCurrentQuestion()?.question_id !== current.question_id) {
        sequenceFinalizing = false;
        return;
      }
      sequenceFinalizing = false;
      evaluateAnswer(typedAnswer);
  }
}

function renderNumberAnswerDisplay() {
  if (gameFinished || currentView !== VIEW_STATES.GAME) {
    numberAnswerDisplayEl.hidden = true;
    return;
  }
  const current = getCurrentQuestion();
  const isNumberQuestion = current?.typeCode === "N";

  numberAnswerDisplayEl.hidden = !isNumberQuestion;

  if (!isNumberQuestion) {
    numberAnswerDisplayEl.textContent = "";
    numberAnswerDisplayEl.classList.remove("filled");
    numberAnswerDisplayEl.classList.remove("result");
    delete numberAnswerDisplayEl.dataset.cornerIcon;
    return;
  }

  const displayText = typedAnswer;
  numberAnswerDisplayEl.textContent = displayText;
  numberAnswerDisplayEl.classList.toggle("filled", typedAnswer.length > 0);
  numberAnswerDisplayEl.classList.toggle("result", questionLocked);

  if (questionLocked) {
    numberAnswerDisplayEl.dataset.cornerIcon = isCurrentAnswerCorrect(current, typedAnswer) ? "check" : "cross";
  } else {
    delete numberAnswerDisplayEl.dataset.cornerIcon;
  }
}

function appendNumberDigit(digit) {
  if (typedAnswer.length >= 15) {
    return;
  }

  typedAnswer += String(digit);
  renderNumberAnswerDisplay();
}

function clearLastNumberDigit() {
  if (typedAnswer.length === 0) {
    return;
  }

  typedAnswer = typedAnswer.slice(0, -1);
  renderNumberAnswerDisplay();
}

function clearAllNumberDigits() {
  if (typedAnswer.length === 0) {
    return;
  }

  typedAnswer = "";
  renderNumberAnswerDisplay();
}

function submitCurrentNumberAnswer() {
  evaluateAnswer(typedAnswer);
}

function pressNumberDigit(digit) {
  appendNumberDigit(digit);
  renderKeypad();
}

function pressNumberClear() {
  clearLastNumberDigit();
  renderKeypad();
}

function pressNumberClearAll() {
  clearAllNumberDigits();
  renderKeypad();
}

function buildKeyButton({
  label,
  className = "",
  onClick,
  onLongPress = null,
  childNodes = [],
  disabled = false,
  cornerIcon = null,
  flash = false
}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key-btn ${className}`.trim();
  if (cornerIcon) {
    button.dataset.cornerIcon = cornerIcon;
  }
  if (flash) {
    button.classList.add("reveal-flash");
  }
  if (childNodes.length > 0) {
    childNodes.forEach((node) => button.appendChild(node));
  } else {
    button.textContent = label;
  }
  if (!disabled) {
    if (typeof onLongPress === "function") {
      let longPressHandle = null;
      let longPressTriggered = false;

      const clearLongPressHandle = () => {
        if (longPressHandle) {
          window.clearTimeout(longPressHandle);
          longPressHandle = null;
        }
      };

      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        longPressTriggered = false;
        clearLongPressHandle();
        longPressHandle = window.setTimeout(() => {
          longPressTriggered = true;
          onLongPress();
        }, LONG_PRESS_MS);
      });

      const handlePressEnd = (event) => {
        event.preventDefault();
        clearLongPressHandle();
        if (!longPressTriggered) {
          onClick();
        }
      };

      button.addEventListener("pointerup", handlePressEnd);
      button.addEventListener("pointercancel", clearLongPressHandle);
      button.addEventListener("pointerleave", clearLongPressHandle);
    } else {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        onClick();
      });
    }
  }
  button.disabled = disabled || questionLocked;
  return button;
}

function buildChoiceButton(choice, { placeholder = false } = {}) {
  const code = document.createElement("span");
  code.className = "choice-code";
  code.textContent = choice.code;

  const label = document.createElement("span");
  label.className = "choice-label";
  label.textContent = choice.label;

  if (placeholder) {
    return buildKeyButton({
      className: "choice-row dimmed empty-choice",
      onClick: () => {},
      childNodes: [code, label],
      disabled: true
    });
  }

  const current = getCurrentQuestion();
  const isSelected = normalize(typedAnswer) === normalize(choice.code);
  const correctCode = getQuestionAnswerCodes(current)[0];
  const isCorrect = questionLocked && normalize(choice.code) === correctCode;
  const isWrongPick = questionLocked && isSelected && !isCorrect;
  const playerGotItCorrect = questionLocked && normalize(typedAnswer) === correctCode;
  const isDimmed = questionLocked && !isCorrect && !isWrongPick;
  const cornerIcon = isWrongPick ? "cross" : (isCorrect && playerGotItCorrect) ? "check" : null;

  return buildKeyButton({
    className: `choice-row ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrongPick ? "wrong" : ""} ${isDimmed ? "dimmed" : ""}`,
    onClick: () => handleAnswerPick(choice.code),
    childNodes: [code, label],
    cornerIcon,
    flash: isCorrect
  });
}

function buildSequenceButton(choice, {
  showOrderNumber = true,
  orderNumber = null,
  orderIsWrong = false,
  cornerIcon = null
} = {}) {
  const label = document.createElement("span");
  label.className = "choice-label sequence-label";
  label.textContent = choice.label;

  const selectedOrder = sequenceOrderCodes.indexOf(normalize(choice.code));
  const button = buildKeyButton({
    className: `choice-row sequence-row ${selectedOrder >= 0 ? "selected" : ""} ${orderIsWrong ? "sequence-order-wrong" : ""}`.trim(),
    onClick: () => handleAnswerPick(choice.code),
    childNodes: [label],
    disabled: questionLocked,
    cornerIcon
  });

  button.dataset.sequenceCode = normalize(choice.code);

  if (showOrderNumber) {
    const displayOrder = Number.isInteger(orderNumber) ? orderNumber : selectedOrder + 1;
    if (displayOrder > 0) {
      button.dataset.sequenceOrder = String(displayOrder);
    }
  }

  return button;
}

function renderKeypad() {
  if (gameFinished) {
    keypadEl.hidden = true;
    return;
  }

  const current = getCurrentQuestion();
  let previousSequencePositions = null;
  if (current.typeCode === "S") {
    previousSequencePositions = new Map();
    keypadEl.querySelectorAll(".sequence-row[data-sequence-code]").forEach((rowEl) => {
      previousSequencePositions.set(rowEl.dataset.sequenceCode, rowEl.getBoundingClientRect().top);
    });
  }
  keypadEl.innerHTML = "";
  keypadEl.hidden = current.typeCode === "N" && questionLocked && typedAnswer.length > 0;

  if (keypadEl.hidden) {
    return;
  }

  if (current.typeCode === "L") {
    keypadEl.style.gridTemplateRows = "";
    keypadEl.className = "keypad letters";
    const correctCode = getQuestionAnswerCodes(current)[0];
    const playerGotItCorrect = questionLocked && isCurrentAnswerCorrect(current, typedAnswer);

    getLetterKeys().forEach((key) => {
      const normalizedKey = normalize(key);
      const keyOptions = expandAnswerOptions(normalizedKey);
      const isSelected = normalize(typedAnswer) === normalizedKey;
      const keyIsCorrect = questionLocked && keyOptions.some(option => option === correctCode);
      const isCorrect = keyIsCorrect;
      const isWrongPick = questionLocked && isSelected && !isCorrect;
      const isDimmed = questionLocked && !isCorrect && !isWrongPick;
      const cornerIcon = isWrongPick ? "cross" : (isCorrect && playerGotItCorrect) ? "check" : null;

      keypadEl.appendChild(
        buildKeyButton({
          label: key,
          className: [
            isSelected ? "selected" : "",
            isCorrect ? "correct" : "",
            isWrongPick ? "wrong" : "",
            isDimmed ? "dimmed" : "",
          ].filter(Boolean).join(" "),
          onClick: () => handleAnswerPick(key),
          cornerIcon,
          flash: isCorrect
        })
      );
    });
  } else if (current.typeCode === "N") {
    keypadEl.style.gridTemplateRows = "";
    keypadEl.className = "keypad numbers";
    const shouldDimNumberKeypad = questionLocked && typedAnswer.length === 0;
    const shouldDimEnterButton = typedAnswer.length === 0;
    const keypadButtons = [
      ...getNumberKeys().slice(0, 9),
      "C",
      "0",
      "enter"
    ];

    keypadButtons.forEach((label) => {
      if (label === "C") {
        keypadEl.appendChild(
          buildKeyButton({
            label,
            className: `number-control number-clear ${shouldDimNumberKeypad ? "dimmed" : ""}`.trim(),
            onClick: () => pressNumberClear(),
            onLongPress: () => pressNumberClearAll(),
            disabled: questionLocked || typedAnswer.length === 0
          })
        );
        return;
      }

      if (label === "enter") {
        keypadEl.appendChild(
          buildKeyButton({
            label,
            className: `number-control number-enter ${(shouldDimNumberKeypad || shouldDimEnterButton) ? "dimmed" : "should-select"}`.trim(),
            onClick: () => submitCurrentNumberAnswer(),
            disabled: questionLocked || typedAnswer.length === 0
          })
        );
        return;
      }

      keypadEl.appendChild(
        buildKeyButton({
          label,
          className: `number-digit ${shouldDimNumberKeypad ? "dimmed" : ""}`.trim(),
          onClick: () => pressNumberDigit(label),
          disabled: questionLocked || typedAnswer.length >= 15
        })
      );
    });
  } else if (current.typeCode === "S") {
    keypadEl.className = "keypad sequence";
    const options = Array.isArray(current.options) ? current.options : [];
    const correctSequence = getQuestionAnswerCodes(current)[0] || "";
    const choiceEntries = options.map((label, index) => ({
      code: String.fromCharCode(65 + index),
      label
    }));
    const hasFullSequence = options.length > 0 && sequenceOrderCodes.length === options.length;
    const isFullSequenceCorrect = hasFullSequence && sequenceOrderCodes.join("") === correctSequence;

    const renderedOptions = hasFullSequence
      ? [...choiceEntries].sort((a, b) => (
          sequenceOrderCodes.indexOf(a.code) - sequenceOrderCodes.indexOf(b.code)
        ))
      : choiceEntries;

    if (options.length > 0) {
      keypadEl.style.gridTemplateRows = `repeat(${options.length}, minmax(0, 1fr))`;
    }

    renderedOptions.forEach((choice) => {
      const normalizedCode = normalize(choice.code);
      const correctOrder = correctSequence.indexOf(normalizedCode) + 1;
      const showCorrectOrderNumber = hasFullSequence && !isFullSequenceCorrect;
      const cornerIcon = hasFullSequence && isFullSequenceCorrect ? "check" : null;

      keypadEl.appendChild(buildSequenceButton(choice, {
        showOrderNumber: !hasFullSequence || showCorrectOrderNumber,
        orderNumber: showCorrectOrderNumber ? correctOrder : null,
        orderIsWrong: showCorrectOrderNumber,
        cornerIcon
      }));
    });

    if (hasFullSequence && previousSequencePositions && previousSequencePositions.size > 0) {
      keypadEl.querySelectorAll(".sequence-row[data-sequence-code]").forEach((rowEl) => {
        const code = rowEl.dataset.sequenceCode;
        const previousTop = previousSequencePositions.get(code);
        if (typeof previousTop !== "number") {
          return;
        }

        const currentTop = rowEl.getBoundingClientRect().top;
        const deltaY = previousTop - currentTop;
        if (Math.abs(deltaY) < 1) {
          return;
        }

        rowEl.style.transition = "none";
        rowEl.style.transform = `translateY(${deltaY}px)`;

        window.requestAnimationFrame(() => {
          rowEl.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
          rowEl.style.transform = "translateY(0)";
        });
      });
    }
  } else {
    keypadEl.style.gridTemplateRows = "";
    keypadEl.className = "keypad multiple";
    const totalChoiceRows = 6;
    const choiceLabels = Array.isArray(current.options) ? current.options : [];

    for (let index = 0; index < totalChoiceRows; index += 1) {
      const hasChoice = index < choiceLabels.length;
      keypadEl.appendChild(buildChoiceButton(
        {
          code: String.fromCharCode(65 + index),
          label: hasChoice ? choiceLabels[index] : ""
        },
        { placeholder: !hasChoice }
      ));
    }
  }
}

function evaluateAnswer(answerOverride = null) {
  if (questionLocked) return;

  const current = getCurrentQuestion();
  const userAnswer = normalize(answerOverride ?? typedAnswer);
  const validAnswers = getQuestionAnswerCodes(current);

  if (!userAnswer) {
    feedbackTextEl.textContent = "Enter or pick an answer first.";
    return;
  }

  const userAnswerOptions = getComparableAnswerOptions(current, userAnswer);
  const isCorrect = userAnswerOptions.some(option => validAnswers.includes(option));
  const earned = isCorrect ? getFastPoints() : 0;

  if (isCorrect) {
    score += earned;
    scoreValueEl.textContent = String(score);
  }

  recordAnswerResult(current, userAnswer, { isCorrect, earnedPoints: earned });
  persistInProgressPosition({ indexOffset: 1 });
  lockQuestion(getResultMessage(current, { isCorrect, earned }));

  renderNumberAnswerDisplay();
  renderKeypad();
}

function nextQuestion() {
  if (questionIndex >= questions.length - 1) {
    completeGame();
    return;
  }

  questionIndex += 1;
  loadQuestion();
}

function loadQuestion() {
  if (questionIndex >= questions.length) {
    completeGame();
    return;
  }

  setCurrentView(VIEW_STATES.GAME);
  const current = getCurrentQuestion();
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  stopTimer();
  questionLocked = false;
  questionPanelEl.classList.remove("showing-answer");
  typedAnswer = "";
  sequenceOrderCodes = [];
  sequenceFinalizing = false;
  const timerProfile = buildTimerProfileForQuestionType(current.typeCode);
  activeFastPointWindowDurationsMs = timerProfile.durationsMs;
  activeQuestionDurationMs = timerProfile.totalDurationMs;
  remainingMs = activeQuestionDurationMs;
  renderTimer();
  feedbackTextEl.textContent = "";
  renderNumberAnswerDisplay();
  showModeHint(current.typeCode);
  const hintOffsetMs = QUESTION_TYPE_LABELS[current.typeCode] ? QUESTION_TYPE_LABEL_DURATION_MS : 0;
  const revealIntervalMs = getCharacterRevealIntervalMs();
  const revealDurationMs = renderQuestionCharacterReveal(
    current.question,
    hintOffsetMs + PRE_REVEAL_DELAY_MS,
    revealIntervalMs
  );

  renderKeypad();
  persistInProgressPosition({ indexOffset: 1 });

  preTimerHandle = window.setTimeout(() => {
    if (questionLocked) {
      return;
    }
    beginQuestionTimer();
  }, revealDurationMs);
}

document.addEventListener("keydown", (event) => {
  if (gameFinished) {
    return;
  }

  const current = getCurrentQuestion();
  if (questionLocked) return;

  if (current.typeCode === "L" && event.key.length === 1) {
    const key = event.key.toUpperCase();
    if (getExpandedLetterInputs().includes(key)) {
      if (key === "Q" || key === "V") {
        handleAnswerPick("QV");
        return;
      }

      if (key === "X" || key === "Z") {
        handleAnswerPick("XZ");
        return;
      }

      handleAnswerPick(key);
    }

    return;
  }

  if (current.typeCode === "S" && event.key.length === 1) {
    const key = event.key.toUpperCase();
    const choiceIndex = key.charCodeAt(0) - 65;
    const options = Array.isArray(current.options) ? current.options : [];
    if (choiceIndex >= 0 && choiceIndex < options.length) {
      handleAnswerPick(key);
    }
    return;
  }

  if (current.typeCode === "N" && /^[0-9]$/.test(event.key)) {
    pressNumberDigit(event.key);
    return;
  }

  if (current.typeCode === "N" && event.key === "Backspace") {
    pressNumberClear();
    return;
  }

  if (current.typeCode === "N" && event.key === "Escape") {
    pressNumberClearAll();
    return;
  }

  if (current.typeCode === "N" && event.key === "Enter") {
    submitCurrentNumberAnswer();
  }
});

shareScoreButtonEl.addEventListener("click", handleShareScore);

questionReviewController = createQuestionReviewController({
  panelEl: questionReviewPanelEl,
  closeButtonEl: questionReviewCloseButtonEl,
  listEl: questionReviewListEl,
  viewQuestionsButtonEl,
  getIsGameFinished: () => gameFinished,
  getQuestions: () => questions,
  getResultEntries: () => buildAnswerHistoryFromResults(getMergedResultsSnapshot())
});

if (replayButtonEl) {
  replayButtonEl.addEventListener("click", handleReplayGame);
}

if (prevQuizButtonEl) {
  prevQuizButtonEl.addEventListener("click", () => {
    const baseDate = parseQuizDate(activePackDate);
    if (baseDate) {
      const prevDate = new Date(baseDate.getTime());
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      window.parent.postMessage({ type: 'sq-nav', quiz: formatQuizDateForQuery(prevDate) }, '*');
    }
    void quizNavigation.goToRelativeQuizDate(-1);
  });
}

if (nextQuizButtonEl) {
  nextQuizButtonEl.addEventListener("click", () => {
    window.parent.postMessage({ type: 'sq-nav', quiz: null }, '*');
    void quizNavigation.goToLatestQuiz();
  });
}

window.addEventListener("popstate", () => {
  void quizNavigation.handlePopStateQuizNavigation();
});



if (devResetProgressButtonIntroEl) {
  devResetProgressButtonIntroEl.addEventListener("click", clearSavedProgressForDevTesting);
}

startButtonEl.addEventListener("click", handleStartGame);
howToPlayButtonEl.addEventListener("click", openHowToPlay);

bindTimerBarFullscreenHold();

initializeAppStartup();