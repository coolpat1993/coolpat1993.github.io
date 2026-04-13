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

export const FAST_POINT_FIRST_DURATION_SECONDS = 0.2;
export const FAST_POINT_INITIAL_DURATION_SECONDS = 1;
export const FAST_POINT_DURATION_STEP_SECONDS = 0.1;
export const MAX_FAST_POINTS = 10;
export const RESULT_DELAY_MS = 4500;
export const PRE_REVEAL_DELAY_MS = 400;
export const CHARACTER_REVEAL_INTERVAL_MS = 45;
export const COMMA_PAUSE_MS = 300;
export const PERIOD_PAUSE_MS = 400;
export const POST_REVEAL_TIMER_DELAY_MS = {
  L: 500,
  M: 500,
  N: 500,
  S: 500
};

// export const POST_REVEAL_TIMER_DELAY_MS = {
//   L: 0,
//   M: 0,
//   N: 0,
//   S: 0
// };
export const QUESTION_TYPE_LABELS = {
  L: "Letters",
  M: "Multiple Choice",
  N: "Numbers",
  S: "Sequence"
};
export const QUESTION_TYPE_LABEL_DURATION_MS = 1000;
export const LONG_PRESS_MS = 450;
export const TIMER_FULLSCREEN_HOLD_MS = 500;
export const PLAYER_UNID_STORAGE_KEY = "speedQuizzingPlayerUnid";
export const GAME_PROGRESS_STORAGE_KEY_PREFIX = "speedQuizzingProgress";

export const IS_DEV_MODE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.");

export const FAST_POINT_WINDOW_DURATIONS_MS = Array.from(
  { length: MAX_FAST_POINTS },
  (_, idx) => Math.round(((idx === 0
    ? FAST_POINT_FIRST_DURATION_SECONDS
    : FAST_POINT_INITIAL_DURATION_SECONDS + (idx * FAST_POINT_DURATION_STEP_SECONDS))) * 1000)
);

export const QUESTION_DURATION_MS = FAST_POINT_WINDOW_DURATIONS_MS.reduce(
  (sum, durationMs) => sum + durationMs,
  0
);
