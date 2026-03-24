export const VIEW_STATES = {
  START: "START",
  HOW_TO_PLAY: "HOW_TO_PLAY",
  GAME: "GAME",
  FINISH: "FINISH"
};

export const LETTER_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "R", "S", "T", "U", "QV", "W", "Y", "XZ"
];

export const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export const QUESTION_SET_SOURCE = {
  unid: "back-up-quiz-pack-1",
  questions: [
    {
      id: "question1",
      type: "multiple",
      question: "Which of the following actors stars in the film 'Inception'?",
      choices: [
        "Matt Damon",
        "Brad Pitt",
        "Keanu Reeves",
        "Leonardo DiCaprio"
      ],
      answer: "D"
    },
    {
      id: "question2",
      type: "numbers",
      question: "How many lanes are there on an Olympic athletics track?",
      answer: "8",
      longAnswer: "8"
    },
    {
      id: "question3",
      type: "letters",
      question: "In which city did the first 'Hard Rock Cafe' open?",
      answer: "L",
      longAnswer: "London"
    },
    {
      id: "question4",
      type: "numbers",
      question: "What is 102 x 5?",
      answer: "510",
      longAnswer: "510"
    },
    {
      id: "question5",
      type: "multiple",
      question: "At the start of a game of chess, who moves first?",
      choices: [
        "White",
        "Black"
      ],
      answer: "A"
    },
    {
      id: "question6",
      type: "letters",
      question: "In Greek mythology, who was the father and king of the gods?",
      answer: "Z",
      longAnswer: "Zeus"
    },
    {
      id: "question7",
      type: "multiple",
      question: "For how many years must Scotch whisky be aged in oak casks before it can legally be sold in the UK?",
      choices: [
        "3",
        "6",
        "9"
      ],
      answer: "A"
    },
    {
      id: "question8",
      type: "letters",
      question: "What is the capital city of Norway?",
      answer: "O",
      longAnswer: "Oslo"
    },
    {
      id: "question9",
      type: "multiple",
      question: "In which country was the composer Chopin born?",
      choices: [
        "Poland",
        "Austria",
        "Italy",
        "Denmark"
      ],
      answer: "A"
    },
    {
      id: "question10",
      type: "letters",
      question: "Which term for a hired detective is also the name of a popular satirical magazine?",
      answer: "P",
      longAnswer: "Private Eye"
    }
  ]
};

export const FAST_POINT_INITIAL_DURATION_SECONDS = 1;
export const FAST_POINT_DURATION_STEP_SECONDS = 0.1;
export const MAX_FAST_POINTS = 10;
export const RESULT_DELAY_MS = 4500;
export const PRE_REVEAL_DELAY_MS = 400;
export const CHARACTER_REVEAL_INTERVAL_MS = 55;
export const COMMA_PAUSE_MS = 400;
export const PERIOD_PAUSE_MS = 500;
export const POST_REVEAL_TIMER_DELAY_MS = {
  letters: 500,
  multiple: 500,
  numbers: 1000,
  sequence: 3000
};
export const QUESTION_TYPE_LABELS = {
  letters: "Letters",
  multiple: "Multiple Choice",
  numbers: "Numbers",
  sequence: "Sequence"
};
export const QUESTION_TYPE_LABEL_DURATION_MS = 1000;
export const LONG_PRESS_MS = 450;
export const TIMER_FULLSCREEN_HOLD_MS = 500;
export const LAST_TEAM_NAME_STORAGE_KEY = "speedQuizzingTeamName";
export const PLAYER_UNID_STORAGE_KEY = "speedQuizzingPlayerUnid";
export const GAME_PROGRESS_STORAGE_KEY_PREFIX = "speedQuizzingProgress";

export const IS_DEV_MODE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  true;

export const questions = QUESTION_SET_SOURCE.questions;

export function getQuestionSetStorageId() {
  return String(QUESTION_SET_SOURCE.unid).trim();
}

export function getGameProgressStorageKey() {
  return `${GAME_PROGRESS_STORAGE_KEY_PREFIX}:${getQuestionSetStorageId()}`;
}

export const POINTS_EMOJI = {
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
  10: "🔟"
};

export const TOTAL_POSSIBLE_SCORE = questions.length * MAX_FAST_POINTS;

export const FAST_POINT_WINDOW_DURATIONS_MS = Array.from(
  { length: MAX_FAST_POINTS },
  (_, idx) => Math.round((FAST_POINT_INITIAL_DURATION_SECONDS + (idx * FAST_POINT_DURATION_STEP_SECONDS)) * 1000)
);

export const QUESTION_DURATION_MS = FAST_POINT_WINDOW_DURATIONS_MS.reduce(
  (sum, durationMs) => sum + durationMs,
  0
);
