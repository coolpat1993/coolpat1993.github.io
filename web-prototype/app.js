const LETTER_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "R", "S", "T", "U", "QV", "W", "Y", "XZ"
];

const questions = [
  {
    id: "q-multi-1",
    type: "multiple",
    question: "Is the Isle of Man in the UK?",
    choices: [
      "Yes",
      "No"
    ],
    answer: "B"
  },
  {
    id: "q-letters-1",
    type: "letters",
    question: "Mr Keating was the deputy headteacher at which fictional school between 1979 and 1984?",
    answer: "G",
    longAnswer: "Grange Hill"
  },
  {
    id: "q-letters-2",
    type: "letters",
    question: "Name the feared and funny food critic for The Sunday Times who sadly died in 2016.",
    answer: "A",
    longAnswer: "A.A. Gill"
  },
  {
    id: "q-letters-4",
    type: "letters",
    question: "Despite fears it could lead to enhanced or modified humans, work began in 2025 on a major science project to recreate what building blocks of human life from scratch?",
    answer: "D",
    longAnswer: "DNA"
  },
  {
    id: "q-multi-2",
    type: "multiple",
    question: "In which year was The London Symphony Orchestra founded?",
    choices: [
      "1704",
      "1804",
      "1904",
      "2004"
    ],
    answer: "C"
  },
  {
    id: "q-letters-5",
    type: "letters",
    question: "With the security of Greenland likely to be the central issue, the prime minister of which European country recently announced a snap election?",
    answer: "D",
    longAnswer: "Denmark"
  },
  {
    id: "q-letters-7",
    type: "letters",
    question: "What Netflix series is about a woman named Emily, who moves from Chicago to Paris to work on the social media team for a fashion company named Savoir?",
    answer: "E",
    longAnswer: "Emily in Paris"
  },
  {
    id: "q-multi-3",
    type: "multiple",
    question: "Two of Arsene Wenger's cousins were in The Venga Boys. Is this...?",
    choices: [
      "True",
      "False"
    ],
    answer: "B"
  },
  {
    id: "q-letters-9",
    type: "letters",
    question: "Which surname is combined with 'Whyte' in the name of a Scottish whisky company?",
    answer: "M",
    longAnswer: "Mackay"
  },
  {
    id: "q-letters-10",
    type: "letters",
    question: "Which Roald Dahl book was adapted into a musical in 2010 with all music and lyrics composed by Australian musical comedian Tim Minchin?",
    answer: "M",
    longAnswer: "Matilda"
  },
  {
  id: "q-letters-11",
  type: "letters",
  question: "In 'Harry Potter', what name is given to people from magical families who do not possess magical powers?",
  answer: "S",
  longAnswer: "Squib"
},
{
  id: "q-letters-12",
  type: "letters",
  question: "What is the official language of Namibia?",
  answer: "E",
  longAnswer: "English"
},
{
  id: "q-letters-13",
  type: "letters",
  question: "Often accompanied by its own type of thinner, what brand of much-used office item was registered by Wolfgang Dabisch in 1962?",
  answer: "T",
  longAnswer: "Tipp-ex"
},
{
  id: "q-letters-14",
  type: "letters",
  question: "Name the planet closest to the sun.",
  answer: "M",
  longAnswer: "Mercury"
},
{
  id: "q-letters-15",
  type: "letters",
  question: "In the video game 'Final Fantasy VII', which character from the main party is famously killed by Sephiroth?",
  answer: "A",
  longAnswer: "Aerith/Aeris"
},
{
  id: "q-multi-4",
  type: "multiple",
  question: "\"Put that cookie down\" is a quote from which Arnold Schwarzenegger film?",
  choices: [
    "Kindergarten Cop",
    "Jingle All the Way",
    "Last Action Hero",
    "Predator"
  ],
  answer: "B"
},
{
  id: "q-letters-16",
  type: "letters",
  question: "What eight-letter word is commonly used to describe a situation where a person deliberately gets themselves or their partner pregnant, so as to keep the relationship from ending?",
  answer: "B",
  longAnswer: "Babytrap"
},
{
  id: "q-multi-5",
  type: "multiple",
  question: "With 99.3% of the population following a religion, which American state or territory is the most religious in the USA?",
  choices: [
    "Puerto Rico",
    "Alaska",
    "Utah",
    "American Samoa"
  ],
  answer: "D"
},
{
  id: "q-letters-17",
  type: "letters",
  question: "'Onkel' is the German word for which member of the family?",
  answer: "U",
  longAnswer: "Uncle"
},
{
  id: "q-multi-6",
  type: "multiple",
  question: "What process must take place in order for oxidation to occur?",
  choices: [
    "Electrolysis",
    "Osmosis",
    "Reduction",
    "Fermentation"
  ],
  answer: "C"
},
{
  id: "q-multi-7",
  type: "multiple",
  question: "Which of these snooker players was given the nickname 'Interesting'?",
  choices: [
    "Steve Davis",
    "John Virgo",
    "Ronnie O'Sullivan",
    "John Parrott"
  ],
  answer: "A"
},

];

const QUESTION_DURATION_SECONDS = 10;
const MAX_FAST_POINTS = 100;
const RESULT_DELAY_MS = 3000;
const PRE_TIMER_DELAY_MS = 3000;

const scoreValueEl = document.querySelector("#scoreValue");
const fastPointsValueEl = document.querySelector("#fastPointsValue");
const timerFillEl = document.querySelector("#timerFill");
const timerTrackEl = document.querySelector(".timer-track");
const questionTextEl = document.querySelector("#questionText");
const feedbackTextEl = document.querySelector("#feedbackText");
const keypadEl = document.querySelector("#keypad");

let score = 0;
let questionIndex = 0;
let typedAnswer = "";
let remainingMs = QUESTION_DURATION_SECONDS * 1000;
let timerHandle = null;
let autoNextHandle = null;
let preTimerHandle = null;
let questionLocked = false;

function normalize(str) {
  return String(str || "").trim().toUpperCase();
}

function getCurrentQuestion() {
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

function scheduleAutoNext() {
  clearAutoNextTimer();
  autoNextHandle = window.setTimeout(() => {
    nextQuestion();
  }, RESULT_DELAY_MS);
}

function lockQuestion(message) {
  clearPreTimerDelay();
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

function getExpandedLetterInputs() {
  return getLetterKeys().flatMap((key) => key.split(""));
}

function handleAnswerPick(answerCode) {
  if (questionLocked) return;
  typedAnswer = answerCode;
  evaluateAnswer(answerCode);
}

function buildKeyButton({ label, className = "", onClick, childNodes = [], disabled = false }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key-btn ${className}`.trim();
  if (childNodes.length > 0) {
    childNodes.forEach((node) => button.appendChild(node));
  } else {
    button.textContent = label;
  }
  if (!disabled) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onClick();
    });
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
      className: "choice-row dimmed",
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
  const isDimmed = questionLocked && typedAnswer !== "" && !isCorrect && !isWrongPick;

  return buildKeyButton({
    className: `choice-row ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrongPick ? "wrong" : ""} ${isDimmed ? "dimmed" : ""}`,
    onClick: () => handleAnswerPick(choice.code),
    childNodes: [code, label]
  });
}

function renderKeypad() {
  const current = getCurrentQuestion();
  keypadEl.innerHTML = "";

  if (current.type === "letters") {
    keypadEl.className = "keypad letters";
    const correctCode = getQuestionAnswerCodes(current)[0];

    getLetterKeys().forEach((key) => {
      const normalizedKey = normalize(key);
      const isSelected = normalize(typedAnswer) === normalizedKey;
      const isCorrect = questionLocked && normalizedKey === correctCode;
      const isWrongPick = questionLocked && isSelected && !isCorrect;
      const isDimmed = questionLocked && typedAnswer !== "" && !isCorrect && !isWrongPick;

      keypadEl.appendChild(
        buildKeyButton({
          label: key,
          className: [
            isSelected ? "selected" : "",
            isCorrect ? "correct" : "",
            isWrongPick ? "wrong" : "",
            isDimmed ? "dimmed" : "",
          ].filter(Boolean).join(" "),
          onClick: () => handleAnswerPick(key)
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
  stopTimer();
  questionLocked = false;
  typedAnswer = "";
  remainingMs = QUESTION_DURATION_SECONDS * 1000;
  renderTimer();

  questionTextEl.textContent = current.question;
  feedbackTextEl.textContent = "";

  renderKeypad();
  preTimerHandle = window.setTimeout(() => {
    if (questionLocked) {
      return;
    }
    beginQuestionTimer();
  }, PRE_TIMER_DELAY_MS);
}

document.addEventListener("keydown", (event) => {
  const current = getCurrentQuestion();
  if (questionLocked || current.type !== "letters") return;

  if (event.key.length === 1) {
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
  }
});

loadQuestion();
