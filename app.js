import {
  VIEW_STATES,
  LETTER_KEYS,
  NUMBER_KEYS,
  RESULT_DELAY_MS,
  PRE_REVEAL_DELAY_MS,
  CHARACTER_REVEAL_INTERVAL_MS,
  COMMA_PAUSE_MS,
  PERIOD_PAUSE_MS,
  POST_REVEAL_TIMER_DELAY_MS,
  LONG_PRESS_MS,
  TIMER_FULLSCREEN_HOLD_MS,
  LAST_TEAM_NAME_STORAGE_KEY,
  PLAYER_UNID_STORAGE_KEY,
  IS_DEV_MODE,
  questions,
  getGameProgressStorageKey,
  POINTS_EMOJI,
  TOTAL_POSSIBLE_SCORE,
  FAST_POINT_WINDOW_DURATIONS_MS,
  QUESTION_DURATION_MS,
  MAX_FAST_POINTS
} from "./js/config.js";
import {
  getOrCreatePlayerUnid,
  loadSavedTeamName,
  loadSavedProgress,
  persistSavedProgress,
  persistTeamName
} from "./js/storage.js";
import {
  normalize,
  getQuestionAnswerCodes,
  getRevealAnswerText,
  getResultMessage,
  expandAnswerChoices,
  getComparableAnswerOptions,
  isCurrentAnswerCorrect
} from "./js/quiz-helpers.js";

// View state management
let currentView = null;
const GAME_PROGRESS_STORAGE_KEY = getGameProgressStorageKey();

console.log("Total question duration (ms)", QUESTION_DURATION_MS);

const scoreValueEl = document.querySelector("#scoreValue");
const fastPointsValueEl = document.querySelector("#fastPointsValue");
const timerFillEl = document.querySelector("#timerFill");
const timerTrackEl = document.querySelector(".timer-track");
const questionPanelEl = document.querySelector("#questionPanel");
const questionTextEl = document.querySelector("#questionText");
const feedbackTextEl = document.querySelector("#feedbackText");
const numberAnswerDisplayEl = document.querySelector("#numberAnswerDisplay");
const keypadEl = document.querySelector("#keypad");
const pregameHeaderEl = document.querySelector("#pregameHeader");
const introPanelEl = document.querySelector("#introPanel");
const howToPlayPanelEl = document.querySelector("#howToPlayPanel");
const startButtonEl = document.querySelector("#startButton");
const howToPlayButtonEl = document.querySelector("#howToPlayButton");
const howToPlayBackButtonEl = document.querySelector("#howToPlayBackButton");
const leaderboardButtonEl = document.querySelector("#leaderboardButton");
const finishPanelEl = document.querySelector("#finishPanel");
const finalScoreValueEl = document.querySelector("#finalScoreValue");
const finalScoreTotalEl = document.querySelector("#finalScoreTotal");
const teamNameInputEl = document.querySelector("#teamNameInput");
const shareScoreButtonEl = document.querySelector("#shareScoreButton");
const submitScoreButtonEl = document.querySelector("#submitScoreButton");
const devResetProgressButtonEl = document.querySelector("#devResetProgressButton");
const devResetProgressButtonIntroEl = document.querySelector("#devResetProgressButtonIntro");
const leaderboardStatusEl = document.querySelector("#leaderboardStatus");
const teamTrayNameEl = document.querySelector(".team-tray-name");

// Hide dev buttons if not in development mode
if (!IS_DEV_MODE) {
  if (devResetProgressButtonEl) devResetProgressButtonEl.hidden = true;
  if (devResetProgressButtonIntroEl) devResetProgressButtonIntroEl.hidden = true;
}

// Central view state setter
function setCurrentView(viewState) {
  if (currentView === viewState) {
    return;
  }

  currentView = viewState;

  // Hide all panels
  introPanelEl.hidden = true;
  howToPlayPanelEl.hidden = true;
  questionPanelEl.hidden = true;
  finishPanelEl.hidden = true;
  pregameHeaderEl.hidden = true;
  keypadEl.hidden = true;
  numberAnswerDisplayEl.hidden = true;

  // Show relevant panels based on view state
  switch (viewState) {
    case VIEW_STATES.START:
      introPanelEl.hidden = false;
      pregameHeaderEl.hidden = false;
      updateStartButtonText();
      break;

    case VIEW_STATES.HOW_TO_PLAY:
      howToPlayPanelEl.hidden = false;
      pregameHeaderEl.hidden = false;
      break;

    case VIEW_STATES.GAME:
      pregameHeaderEl.hidden = true;
      questionPanelEl.hidden = false;
      keypadEl.hidden = false;
      numberAnswerDisplayEl.hidden = true;
      break;

    case VIEW_STATES.FINISH:
      finishPanelEl.hidden = false;
      break;
  }
}

let score = 0;
let questionIndex = 0;
let typedAnswer = "";
let remainingMs = QUESTION_DURATION_MS;
let timerHandle = null;
let autoNextHandle = null;
let preTimerHandle = null;
let characterRevealHandles = [];
let questionLocked = false;
let gameFinished = false;
let answerHistory = [];
let sequenceOrderCodes = [];
let sequenceFinalizing = false;

let savedProgress = loadSavedProgress(GAME_PROGRESS_STORAGE_KEY, TOTAL_POSSIBLE_SCORE);
const playerUnid = getOrCreatePlayerUnid(PLAYER_UNID_STORAGE_KEY);

let timerFullscreenHoldHandle = null;

function syncTeamTrayName(name) {
  const safeName = String(name || "").trim();
  teamTrayNameEl.textContent = safeName || "Team Name";
}

function updateStartButtonText() {
  if (savedProgress.completed || (savedProgress.currentQuestionIndex > 0)) {
    startButtonEl.textContent = "Continue";
  } else {
    startButtonEl.textContent = "Start";
  }
}

function handleStartGame() {
  if (savedProgress.completed) {
    restoreCompletedGameState();
  } else if (savedProgress.currentQuestionIndex > 0) {
    restoreInProgressGameState();
    setCurrentView(VIEW_STATES.GAME);
    loadQuestion();
  } else {
    restartGame();
  }
}

function handleHowToPlay() {
  setCurrentView(VIEW_STATES.HOW_TO_PLAY);
}

function handleHowToPlayBack() {
  setCurrentView(VIEW_STATES.START);
}

function handleLeaderboard() {
  alert("Leaderboard feature coming soon!");
}

function syncSubmitAvailability() {
  submitScoreButtonEl.disabled = savedProgress.submitted || getTeamName() === "";
}

function clearSavedProgressForDevTesting() {
  savedProgress = {
    completed: false,
    submitted: false,
    firstScore: 0,
    currentScore: 0,
    currentQuestionIndex: 0,
    totalPossible: TOTAL_POSSIBLE_SCORE,
    answerHistory: [],
    completedAt: null,
    submittedAt: null
  };
  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
  setLeaderboardStatus("Saved game completion/submission state cleared for testing.");
  restartGame();
}

function persistCompletedProgressIfFirstRun() {
  if (savedProgress.completed) {
    return;
  }

  savedProgress = {
    ...savedProgress,
    completed: true,
    firstScore: score,
    currentScore: score,
    currentQuestionIndex: Math.max(0, questions.length - 1),
    totalPossible: TOTAL_POSSIBLE_SCORE,
    answerHistory: answerHistory.map((entry) => ({ ...entry })),
    completedAt: new Date().toISOString()
  };

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function persistSubmittedProgress() {
  if (savedProgress.submitted) {
    return;
  }

  savedProgress = {
    ...savedProgress,
    submitted: true,
    submittedAt: new Date().toISOString()
  };

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function clampResumeQuestionIndex(rawIndex) {
  const parsedIndex = Number.isInteger(rawIndex) ? rawIndex : 0;
  return Math.min(Math.max(parsedIndex, 0), questions.length);
}

function persistInProgressPosition({ indexOffset = 0 } = {}) {
  if (savedProgress.completed) {
    return;
  }

  savedProgress = {
    ...savedProgress,
    currentScore: score,
    currentQuestionIndex: clampResumeQuestionIndex(questionIndex + indexOffset),
    answerHistory: answerHistory.map((entry) => ({ ...entry }))
  };

  persistSavedProgress(GAME_PROGRESS_STORAGE_KEY, savedProgress);
}

function restoreInProgressGameState() {
  score = Number.isFinite(savedProgress.currentScore) ? savedProgress.currentScore : 0;
  questionIndex = clampResumeQuestionIndex(savedProgress.currentQuestionIndex);
  scoreValueEl.textContent = String(score);

  if (questionIndex >= questions.length) {
    completeGame();
  }
}

function getTeamName() {
  return String(teamNameInputEl?.value || "").trim();
}

function setLeaderboardStatus(message, isError = false) {
  leaderboardStatusEl.textContent = message;
  leaderboardStatusEl.dataset.state = isError ? "error" : "default";
}

function getPointsEmoji(points) {
  return POINTS_EMOJI[points] || "❌";
}

function getAnswerBreakdownText() {
  return answerHistory.map((entry) => (
    entry.isCorrect ? getPointsEmoji(entry.earnedPoints) : "❌"
  )).join(" ");
}

function buildShareText() {
  const heading = `I scored ${score}/${TOTAL_POSSIBLE_SCORE}`;
  const breakdown = getAnswerBreakdownText();
  return `${heading}\n${breakdown}`;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = text;
  fallbackInput.setAttribute("readonly", "readonly");
  fallbackInput.style.position = "fixed";
  fallbackInput.style.top = "-1000px";
  fallbackInput.style.left = "-1000px";
  document.body.appendChild(fallbackInput);
  fallbackInput.focus();
  fallbackInput.select();

  let didCopy = false;
  try {
    didCopy = document.execCommand("copy");
  } finally {
    document.body.removeChild(fallbackInput);
  }

  if (!didCopy) {
    throw new Error("Clipboard copy failed");
  }

  return true;
}

function recordAnswerResult(question, userAnswer, { isCorrect = false, earnedPoints = 0, timedOut = false } = {}) {
  answerHistory.push({
    questionId: question.id,
    userAnswer,
    correctAnswer: getRevealAnswerText(question),
    isCorrect,
    earnedPoints,
    timedOut
  });
}

function showFinishPanel() {
  finalScoreValueEl.textContent = String(score);
  finalScoreTotalEl.textContent = String(TOTAL_POSSIBLE_SCORE);
  syncSubmitAvailability();
  setCurrentView(VIEW_STATES.FINISH);
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
}

function restartGame() {
  if (savedProgress.completed) {
    restoreCompletedGameState();
    return;
  }

  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  stopTimer();
  score = 0;
  questionIndex = 0;
  typedAnswer = "";
  remainingMs = QUESTION_DURATION_MS;
  questionLocked = false;
  gameFinished = false;
  answerHistory = [];
  scoreValueEl.textContent = "0";
  persistInProgressPosition();
  setLeaderboardStatus("");
  setCurrentView(VIEW_STATES.GAME);
  loadQuestion();
}

function restoreCompletedGameState() {
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  stopTimer();

  score = savedProgress.firstScore;
  answerHistory = Array.isArray(savedProgress.answerHistory)
    ? savedProgress.answerHistory.map((entry) => ({ ...entry }))
    : [];
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

  if (savedProgress.submitted) {
    setLeaderboardStatus("Score already submitted.");
    return;
  }

  setLeaderboardStatus("Game already completed. You can still submit your score.");
}

async function handleShareScore() {
  if (!gameFinished) {
    return;
  }

  const shareText = buildShareText();
  const shareData = {
    title: "SpeedQuizzing score",
    text: shareText,
    url: window.location.href
  };

  if (navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({
          title: shareData.title,
          text: shareData.text
        });
      }
      setLeaderboardStatus("Score shared.");
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await copyTextToClipboard(`${shareText}\nhttps://coolpat1993.github.io/`);
    setLeaderboardStatus("Share text copied to the clipboard.");
    return;
  } catch (error) {
    setLeaderboardStatus("Sharing is unavailable here.", true);
    return;
  }
}

function handleSubmitScore() {
  if (!gameFinished) {
    return;
  }

  if (savedProgress.submitted) {
    setLeaderboardStatus("Score already submitted.", true);
    syncSubmitAvailability();
    return;
  }

  const teamName = getTeamName();
  if (!teamName) {
    setLeaderboardStatus("Enter a team name before submitting.", true);
    teamNameInputEl.focus();
    return;
  }

  persistTeamName(LAST_TEAM_NAME_STORAGE_KEY, teamName);

  const submission = {
    playerUnid,
    name: teamName,
    score,
    totalPossible: TOTAL_POSSIBLE_SCORE,
    results: answerHistory.map((entry) => ({
      questionId: entry.questionId,
      correct: entry.isCorrect,
      points: entry.earnedPoints,
      timedOut: entry.timedOut
    })),
    shareText: buildShareText(),
    completedAt: savedProgress.completedAt || new Date().toISOString()
  };

  console.log("Leaderboard submission", submission);
  persistSubmittedProgress();
  syncSubmitAvailability();
  setLeaderboardStatus("Submission printed to the console. You cannot submit again.");
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
  console.log('question length is', questions.length, 'current index is', questionIndex);
  return questions[questionIndex];
}

function getFastPoints() {
  const elapsedMs = Math.max(0, QUESTION_DURATION_MS - remainingMs);
  let cumulativeDurationMs = 0;

  for (let idx = 0; idx < FAST_POINT_WINDOW_DURATIONS_MS.length; idx += 1) {
    cumulativeDurationMs += FAST_POINT_WINDOW_DURATIONS_MS[idx];
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
  const progress = remainingMs / QUESTION_DURATION_MS;
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

function getPostCharacterPauseMs(char) {
  if (char === ",") {
    return COMMA_PAUSE_MS;
  }

  if (char === ".") {
    return PERIOD_PAUSE_MS;
  }

  return 0;
}

function renderQuestionCharacterReveal(questionText, startDelayMs = 0) {
  clearCharacterRevealTimers();
  questionTextEl.innerHTML = "";

  const chars = Array.from(String(questionText || ""));
  const fragment = document.createDocumentFragment();
  let cumulativeRevealDelayMs = Math.max(0, startDelayMs);

  chars.forEach((char) => {
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

    cumulativeRevealDelayMs += CHARACTER_REVEAL_INTERVAL_MS;

    const revealHandle = window.setTimeout(() => {
      characterEl.classList.add("revealed");
    }, cumulativeRevealDelayMs);

    characterRevealHandles.push(revealHandle);
    cumulativeRevealDelayMs += getPostCharacterPauseMs(char);
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
  stopTimer();
  feedbackTextEl.textContent = message;
  scheduleAutoNext();
}

function beginQuestionTimer() {
  stopTimer();
  remainingMs = QUESTION_DURATION_MS;
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

  const current = getCurrentQuestion();

  if (current.type === "numbers") {
    appendNumberDigit(answerCode);
    return;
  }

  if (current.type === "sequence") {
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
  if (current.type !== "sequence") {
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

  const totalSequenceChoices = Array.isArray(current.choices) ? current.choices.length : 0;
  if (totalSequenceChoices > 0 && sequenceOrderCodes.length === totalSequenceChoices) {
    sequenceFinalizing = true;
      if (getCurrentQuestion()?.id !== current.id) {
        sequenceFinalizing = false;
        return;
      }
      sequenceFinalizing = false;
      evaluateAnswer(typedAnswer);
  }
}

function renderNumberAnswerDisplay() {
  const current = getCurrentQuestion();
  const isNumberQuestion = current?.type === "numbers";

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

function buildSequenceButton(choice, { showOrderNumber = true, cornerIcon = null } = {}) {
  const label = document.createElement("span");
  label.className = "choice-label sequence-label";
  label.textContent = choice.label;

  const selectedOrder = sequenceOrderCodes.indexOf(normalize(choice.code));
  const button = buildKeyButton({
    className: `choice-row sequence-row ${selectedOrder >= 0 ? "selected" : ""}`,
    onClick: () => handleAnswerPick(choice.code),
    childNodes: [label],
    disabled: questionLocked,
    cornerIcon
  });

  button.dataset.sequenceCode = normalize(choice.code);

  if (showOrderNumber && selectedOrder >= 0) {
    button.dataset.sequenceOrder = String(selectedOrder + 1);
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
  if (current.type === "sequence") {
    previousSequencePositions = new Map();
    keypadEl.querySelectorAll(".sequence-row[data-sequence-code]").forEach((rowEl) => {
      previousSequencePositions.set(rowEl.dataset.sequenceCode, rowEl.getBoundingClientRect().top);
    });
  }
  keypadEl.innerHTML = "";
  keypadEl.hidden = current.type === "numbers" && questionLocked && typedAnswer.length > 0;

  if (keypadEl.hidden) {
    return;
  }

  if (current.type === "letters") {
    keypadEl.style.gridTemplateRows = "";
    keypadEl.className = "keypad letters";
    const correctCode = getQuestionAnswerCodes(current)[0];
    const playerGotItCorrect = questionLocked && isCurrentAnswerCorrect(current, typedAnswer);

    getLetterKeys().forEach((key) => {
      const normalizedKey = normalize(key);
      const keyOptions = expandAnswerChoices(normalizedKey);
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
  } else if (current.type === "numbers") {
    keypadEl.style.gridTemplateRows = "";
    keypadEl.className = "keypad numbers";
    const shouldDimNumberKeypad = questionLocked && typedAnswer.length === 0;
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
            className: `number-control number-enter ${shouldDimNumberKeypad ? "dimmed" : ""}`.trim(),
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
  } else if (current.type === "sequence") {
    keypadEl.className = "keypad sequence";
    const choices = Array.isArray(current.choices) ? current.choices : [];
    const correctSequence = getQuestionAnswerCodes(current)[0] || "";
    const choiceEntries = choices.map((label, index) => ({
      code: String.fromCharCode(65 + index),
      label
    }));
    const hasFullSequence = choices.length > 0 && sequenceOrderCodes.length === choices.length;
    const isFullSequenceCorrect = hasFullSequence && sequenceOrderCodes.join("") === correctSequence;

    const renderedChoices = hasFullSequence
      ? [...choiceEntries].sort((a, b) => (
          sequenceOrderCodes.indexOf(a.code) - sequenceOrderCodes.indexOf(b.code)
        ))
      : choiceEntries;

    if (choices.length > 0) {
      keypadEl.style.gridTemplateRows = `repeat(${choices.length}, minmax(0, 1fr))`;
    }

    renderedChoices.forEach((choice, renderedIndex) => {
      const cornerIcon = hasFullSequence
        ? (isFullSequenceCorrect ? "check" : "cross")
        : null;

      keypadEl.appendChild(buildSequenceButton(choice, {
        showOrderNumber: !hasFullSequence,
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
    const choiceLabels = Array.isArray(current.choices) ? current.choices : [];

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
  typedAnswer = "";
  sequenceOrderCodes = [];
  sequenceFinalizing = false;
  remainingMs = QUESTION_DURATION_MS;
  renderTimer();
  feedbackTextEl.textContent = "";
  renderNumberAnswerDisplay();
  const revealDurationMs = renderQuestionCharacterReveal(current.question, PRE_REVEAL_DELAY_MS);

  renderKeypad();
  persistInProgressPosition({ indexOffset: 1 });

  preTimerHandle = window.setTimeout(() => {
    if (questionLocked) {
      return;
    }
    beginQuestionTimer();
  }, revealDurationMs + POST_REVEAL_TIMER_DELAY_MS[current.type]);
}

document.addEventListener("keydown", (event) => {
  if (gameFinished) {
    if (event.key === "Enter" && document.activeElement === teamNameInputEl) {
      handleSubmitScore();
    }
    return;
  }

  const current = getCurrentQuestion();
  if (questionLocked) return;

  if (current.type === "letters" && event.key.length === 1) {
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

  if (current.type === "sequence" && event.key.length === 1) {
    const key = event.key.toUpperCase();
    const choiceIndex = key.charCodeAt(0) - 65;
    const choices = Array.isArray(current.choices) ? current.choices : [];
    if (choiceIndex >= 0 && choiceIndex < choices.length) {
      handleAnswerPick(key);
    }
    return;
  }

  if (current.type === "numbers" && /^[0-9]$/.test(event.key)) {
    pressNumberDigit(event.key);
    return;
  }

  if (current.type === "numbers" && event.key === "Backspace") {
    pressNumberClear();
    return;
  }

  if (current.type === "numbers" && event.key === "Escape") {
    pressNumberClearAll();
    return;
  }

  if (current.type === "numbers" && event.key === "Enter") {
    submitCurrentNumberAnswer();
  }
});

teamNameInputEl.value = loadSavedTeamName(LAST_TEAM_NAME_STORAGE_KEY);
syncTeamTrayName(teamNameInputEl.value);
teamNameInputEl.addEventListener("input", () => {
  syncTeamTrayName(teamNameInputEl.value);
  syncSubmitAvailability();
  if (gameFinished && !savedProgress.submitted) {
    setLeaderboardStatus("");
  }
});

shareScoreButtonEl.addEventListener("click", handleShareScore);
submitScoreButtonEl.addEventListener("click", handleSubmitScore);
if (devResetProgressButtonEl) {
  devResetProgressButtonEl.addEventListener("click", clearSavedProgressForDevTesting);
}
if (devResetProgressButtonIntroEl) {
  devResetProgressButtonIntroEl.addEventListener("click", clearSavedProgressForDevTesting);
}

startButtonEl.addEventListener("click", handleStartGame);
howToPlayButtonEl.addEventListener("click", handleHowToPlay);
if (howToPlayBackButtonEl) {
  howToPlayBackButtonEl.addEventListener("click", handleHowToPlayBack);
}
leaderboardButtonEl.addEventListener("click", handleLeaderboard);

bindTimerBarFullscreenHold();

// Initialize view
if (savedProgress.completed) {
  restoreCompletedGameState();
} else {
  setCurrentView(VIEW_STATES.START);
}
