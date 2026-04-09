import {
  parseQuizDate,
  formatQuizDateForQuery,
  getTodayUtcDateOnly
} from "./quiz-helpers.js";

export function createQuizNavigationController({
  getActivePackDate,
  onBeforeNavigate,
  onLoadQuiz,
  setStartupStatus,
  startButtonEl,
  howToPlayButtonEl,
  prevQuizButtonEl,
  nextQuizButtonEl
}) {
  let quizNavigationInFlight = false;

  function updateButtons() {
    const baseDate = parseQuizDate(getActivePackDate());
    const canNavigateByDate = Boolean(baseDate);
    const isLatestQuiz = canNavigateByDate && baseDate.getTime() >= getTodayUtcDateOnly().getTime();

    if (prevQuizButtonEl) {
      prevQuizButtonEl.disabled = !canNavigateByDate;
    }

    if (nextQuizButtonEl) {
      nextQuizButtonEl.disabled = isLatestQuiz;
    }
  }

  async function loadCurrentQuiz({ contextLabel }) {
    if (quizNavigationInFlight) {
      return;
    }

    quizNavigationInFlight = true;
    onBeforeNavigate();


    setStartupStatus("Loading quiz...");

    try {
      await onLoadQuiz();
    } catch (error) {
      console.error(`Failed to ${contextLabel}`, error);
      setStartupStatus("Could not load quiz. Please try again.", { state: "warning" });

      if (startButtonEl) {
        startButtonEl.disabled = false;
      }

      if (howToPlayButtonEl) {
        howToPlayButtonEl.disabled = false;
      }
    } finally {
      quizNavigationInFlight = false;
    }
  }

  async function navigateToQuizDate(targetQuizDate) {
    if (quizNavigationInFlight) {
      return;
    }

    const nextUrl = new URL(window.location.href);
    const targetDateString = String(targetQuizDate || "").trim();

    if (targetDateString) {
      const currentDateString = String(nextUrl.searchParams.get("quiz") || "").trim();
      if (currentDateString === targetDateString) {
        return;
      }
      nextUrl.searchParams.set("quiz", targetDateString);
    } else {
      if (!nextUrl.searchParams.has("quiz")) {
        return;
      }
      nextUrl.searchParams.delete("quiz");
    }

    nextUrl.hash = "";
    window.history.pushState({}, "", nextUrl.toString());

    await loadCurrentQuiz({ contextLabel: "navigate quiz without reload" });
  }

  function goToRelativeQuizDate(dayOffset) {
    const baseDate = parseQuizDate(getActivePackDate());
    if (!baseDate) {
      return;
    }

    const targetDate = new Date(baseDate.getTime());
    targetDate.setUTCDate(targetDate.getUTCDate() + dayOffset);

    if (dayOffset > 0 && targetDate.getTime() > getTodayUtcDateOnly().getTime()) {
      return;
    }

    const targetDateString = formatQuizDateForQuery(targetDate);
    return navigateToQuizDate(targetDateString);
  }

  function goToLatestQuiz() {
    return navigateToQuizDate(null);
  }

  async function handlePopStateQuizNavigation() {
    await loadCurrentQuiz({ contextLabel: "handle quiz history navigation" });
  }

  return {
    updateButtons,
    goToRelativeQuizDate,
    goToLatestQuiz,
    handlePopStateQuizNavigation
  };
}
