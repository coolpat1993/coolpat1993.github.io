const LETTER_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "R", "S", "T", "U", "QV", "W", "Y", "XZ"
];

const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const questions = [
  {
    id: "question1",
    type: "numbers",
    question: "What is the maximum number of consecutive terms that a US President can now serve?",
    answer: "2"
  },
  {
    id: "question2",
    type: "letters",
    question: "What is the common name given to the sewing technique used to repair holes or worn areas in fabric using needle and thread alone?",
    answer: "D",
    longAnswer: "Darn/Darning"
  },
  {
    id: "question3",
    type: "multiple",
    question: "What was the name of legendary baseball player Babe Ruth's famous 44 oz bat?",
    choices: [
      "Blue Thunder",
      "Brown Bomber",
      "Black Betsy",
      "Pink Panther"
    ],
    answer: "C"
  },
  {
    id: "question4",
    type: "letters",
    question: "Which common kitchen herb is used in a mojito?",
    answer: "M",
    longAnswer: "Mint"
  },
  {
    id: "question5",
    type: "numbers",
    question: "What number was the title of singer Beyonce's album, released in June 2011?",
    answer: "4"
  },
  {
    id: "question6",
    type: "letters",
    question: "Which country has its own version of YouTube named Youku?",
    answer: "C",
    longAnswer: "China"
  },
  {
    id: "question7",
    type: "multiple",
    question: "Which of these is a region located in the south of Spain?",
    choices: [
      "Provence",
      "Tuscany",
      "Andalucia",
      "Lorraine"
    ],
    answer: "C"
  },
  {
    id: "question8",
    type: "letters",
    question: "Which planet in our solar system has a feature known as the \"Great Red Spot\"?",
    answer: "J",
    longAnswer: "Jupiter"
  },
  {
    id: "question9",
    type: "multiple",
    question: "Who had a hit in the 1950s with 'Mack The Knife'?",
    choices: [
      "Billy Darin",
      "Benny Darin",
      "Barry Darin",
      "Bobby Darin"
    ],
    answer: "D"
  },
  {
    id: "question10",
    type: "numbers",
    question: "In the 'Star Wars' films, how many digits does Yoda have on each hand?",
    answer: "3"
  }
];

const QUESTION_DURATION_SECONDS = 10
const MAX_FAST_POINTS = 10;
const RESULT_DELAY_MS = 5000;
const PRE_REVEAL_DELAY_MS = 600;
const CHARACTER_REVEAL_INTERVAL_MS = 30;
const COMMA_PAUSE_MS = 400;
const PERIOD_PAUSE_MS = 500;
const POST_REVEAL_TIMER_DELAY_MS = 2000;
const LONG_PRESS_MS = 450;

const scoreValueEl = document.querySelector("#scoreValue");
const fastPointsValueEl = document.querySelector("#fastPointsValue");
const timerFillEl = document.querySelector("#timerFill");
const timerTrackEl = document.querySelector(".timer-track");
const questionTextEl = document.querySelector("#questionText");
const feedbackTextEl = document.querySelector("#feedbackText");
const numberAnswerDisplayEl = document.querySelector("#numberAnswerDisplay");
const keypadEl = document.querySelector("#keypad");

let score = 0;
let questionIndex = 0;
let typedAnswer = "";
let remainingMs = QUESTION_DURATION_SECONDS * 1000;
let timerHandle = null;
let autoNextHandle = null;
let preTimerHandle = null;
let characterRevealHandles = [];
let questionLocked = false;

function normalize(str) {
  return String(str || "").trim().toUpperCase();
}

function getCurrentQuestion() {
  console.log('question length is', questions.length, 'current index is', questionIndex);
  return questions[questionIndex];
}

function getFastPoints() {
  return Math.max(0, Math.ceil((remainingMs / (QUESTION_DURATION_SECONDS * 1000)) * MAX_FAST_POINTS));
}

function getTimerColor(progress) {
  if (progress <= 0.01) return "#000000";
  if (progress < 0.3) return "#cf2718";
  return "#ffffff";
}

function renderTimer() {
  const progress = remainingMs / (QUESTION_DURATION_SECONDS * 1000);
  const pct = Math.max(0, Math.min(100, progress * 100));
  timerFillEl.style.width = `${pct}%`;
  timerFillEl.style.background = getTimerColor(progress);
  timerTrackEl.setAttribute("aria-valuenow", String(Math.round(pct)));
  fastPointsValueEl.textContent = String(getFastPoints());
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
  remainingMs = QUESTION_DURATION_SECONDS * 1000;
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
      lockQuestion(getResultMessage(current, { timedOut: true }));
      renderKeypad();
    }
  }, tickMs);
}

function getQuestionAnswerCodes(question) {
  if (Array.isArray(question.answers)) {
    return question.answers.map(normalize);
  }

  if (question.answer) {
    return [normalize(question.answer)];
  }

  return [];
}

function getRevealAnswerText(question) {
  if (question.type === "multiple" && Array.isArray(question.choices)) {
    const answerCodes = getQuestionAnswerCodes(question);
    if (answerCodes.length > 0) {
      const labels = answerCodes.map((code) => {
        const idx = code.charCodeAt(0) - 65;
        return question.choices[idx] || code;
      });
      return labels.join(" / ");
    }
  }

  if (question.longAnswer) {
    return question.longAnswer;
  }

  if (Array.isArray(question.answers) && question.answers.length > 0) {
    return question.answers.join(" / ");
  }

  return question.answer || "";
}

function getResultMessage(question, { isCorrect = false, earned = 0, timedOut = false } = {}) {
  const answerText = getRevealAnswerText(question);

  if (isCorrect) {
    return `Correct, the answer is ${answerText}`;
  }

  return `Incorrect, the correct answer is ${answerText}`;
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

  if (getCurrentQuestion().type === "numbers") {
    appendNumberDigit(answerCode);
    return;
  }

  typedAnswer = answerCode;
  evaluateAnswer(answerCode);
}

function isCurrentAnswerCorrect(question, answerValue = typedAnswer) {
  const validAnswers = getQuestionAnswerCodes(question);
  return validAnswers.includes(normalize(answerValue));
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
    numberAnswerDisplayEl.dataset.cornerIcon = isCurrentAnswerCorrect(current) ? "check" : "cross";
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
  const isDimmed = questionLocked && typedAnswer !== "" && !isCorrect && !isWrongPick;
  const showCorrectTick = isCorrect && playerGotItCorrect;
  const cornerIcon = isWrongPick ? "cross" : showCorrectTick ? "check" : null;

  return buildKeyButton({
    className: `choice-row ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrongPick ? "wrong" : ""} ${isDimmed ? "dimmed" : ""}`,
    onClick: () => handleAnswerPick(choice.code),
    childNodes: [code, label],
    cornerIcon,
    flash: showCorrectTick
  });
}

function renderKeypad() {
  const current = getCurrentQuestion();
  keypadEl.innerHTML = "";
  keypadEl.hidden = current.type === "numbers" && questionLocked && typedAnswer.length > 0;

  if (keypadEl.hidden) {
    return;
  }

  if (current.type === "letters") {
    keypadEl.className = "keypad letters";
    const correctCode = getQuestionAnswerCodes(current)[0];
    const playerGotItCorrect = questionLocked && normalize(typedAnswer) === correctCode;

    getLetterKeys().forEach((key) => {
      const normalizedKey = normalize(key);
      const isSelected = normalize(typedAnswer) === normalizedKey;
      const isCorrect = questionLocked && normalizedKey === correctCode;
      const isWrongPick = questionLocked && isSelected && !isCorrect;
      const isDimmed = questionLocked && typedAnswer !== "" && !isCorrect && !isWrongPick;
      const showCorrectTick = isCorrect && playerGotItCorrect;
      const cornerIcon = isWrongPick ? "cross" : showCorrectTick ? "check" : null;

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
          flash: showCorrectTick
        })
      );
    });
  } else if (current.type === "numbers") {
    keypadEl.className = "keypad numbers";
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
            className: "number-control number-clear",
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
            className: "number-control number-enter",
            onClick: () => submitCurrentNumberAnswer(),
            disabled: questionLocked || typedAnswer.length === 0
          })
        );
        return;
      }

      keypadEl.appendChild(
        buildKeyButton({
          label,
          className: "number-digit",
          onClick: () => pressNumberDigit(label),
          disabled: questionLocked || typedAnswer.length >= 15
        })
      );
    });
  } else {
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

  const isCorrect = validAnswers.includes(userAnswer);

  if (isCorrect) {
    const earned = getFastPoints();
    score += earned;
    scoreValueEl.textContent = String(score);
    lockQuestion(getResultMessage(current, { isCorrect: true, earned }));
  } else {
    lockQuestion(getResultMessage(current));
  }

  renderNumberAnswerDisplay();
  renderKeypad();
}

function nextQuestion() {
  questionIndex = (questionIndex + 1) % questions.length;
  loadQuestion();
}

function loadQuestion() {
  const current = getCurrentQuestion();
  clearAutoNextTimer();
  clearPreTimerDelay();
  clearCharacterRevealTimers();
  stopTimer();
  questionLocked = false;
  typedAnswer = "";
  remainingMs = QUESTION_DURATION_SECONDS * 1000;
  renderTimer();
  feedbackTextEl.textContent = "";
  renderNumberAnswerDisplay();
  const revealDurationMs = renderQuestionCharacterReveal(current.question, PRE_REVEAL_DELAY_MS);

  renderKeypad();
  preTimerHandle = window.setTimeout(() => {
    if (questionLocked) {
      return;
    }
    beginQuestionTimer();
  }, revealDurationMs + POST_REVEAL_TIMER_DELAY_MS);
}

document.addEventListener("keydown", (event) => {
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

loadQuestion();
