export function clampResumeQuestionIndex(rawIndex, questionCount) {
  const parsedIndex = Number.isInteger(rawIndex) ? rawIndex : 0;
  return Math.min(Math.max(parsedIndex, 0), questionCount);
}

function getSortedResultIndexes(results) {
  return Object.keys(results)
    .map((key) => Number(key))
    .filter((index) => Number.isInteger(index) && index >= 0)
    .sort((a, b) => a - b);
}

export function buildAnswerHistoryFromResults(results) {
  return getSortedResultIndexes(results)
    .map((index) => results[String(index)])
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ ...entry }));
}

export function buildResultsFromAnswerHistory(history) {
  const nextResults = {};

  history.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const parsedIndex = Number.isInteger(entry.questionIndex)
      ? entry.questionIndex
      : index;

    if (parsedIndex >= 0) {
      nextResults[String(parsedIndex)] = { ...entry, questionIndex: parsedIndex };
    }
  });

  return nextResults;
}

export function mergeResultsSnapshot(savedProgress, resultsByQuestionIndex) {
  const persistedResults = (savedProgress?.results && typeof savedProgress.results === "object" && !Array.isArray(savedProgress.results))
    ? savedProgress.results
    : {};

  return {
    ...persistedResults,
    ...resultsByQuestionIndex
  };
}

export function restoreResultStateFromSavedProgress(savedProgress) {
  const hasPersistedResults = savedProgress.results
    && typeof savedProgress.results === "object"
    && !Array.isArray(savedProgress.results)
    && Object.keys(savedProgress.results).length > 0;

  const resultsByQuestionIndex = hasPersistedResults
    ? { ...savedProgress.results }
    : buildResultsFromAnswerHistory(Array.isArray(savedProgress.answerHistory) ? savedProgress.answerHistory : []);

  return {
    resultsByQuestionIndex,
    answerHistory: buildAnswerHistoryFromResults(resultsByQuestionIndex)
  };
}

export function reconcileSkippedQuestionsInSavedProgress({
  savedProgress,
  questions,
  getRevealAnswerText
}) {
  if (savedProgress.completed) {
    return { nextSavedProgress: savedProgress, didUpdate: false };
  }

  const resumeIndex = clampResumeQuestionIndex(savedProgress.currentQuestionIndex, questions.length);
  if (resumeIndex <= 0) {
    return { nextSavedProgress: savedProgress, didUpdate: false };
  }

  const baseResults = (savedProgress.results && typeof savedProgress.results === "object" && !Array.isArray(savedProgress.results))
    ? { ...savedProgress.results }
    : buildResultsFromAnswerHistory(Array.isArray(savedProgress.answerHistory) ? savedProgress.answerHistory : []);

  let didBackfill = false;
  const maxBackfillIndex = Math.min(resumeIndex, questions.length);

  for (let index = 0; index < maxBackfillIndex; index += 1) {
    const entryKey = String(index);
    if (baseResults[entryKey]) {
      continue;
    }

    const question = questions[index];
    if (!question) {
      continue;
    }

    baseResults[entryKey] = {
      questionIndex: index,
      questionId: question.question_id,
      typeCode: question.typeCode,
      userAnswer: "",
      correctAnswer: getRevealAnswerText(question),
      isCorrect: false,
      earnedPoints: 0,
      timedOut: true
    };

    didBackfill = true;
  }

  if (!didBackfill) {
    return { nextSavedProgress: savedProgress, didUpdate: false };
  }

  const nextSavedProgress = {
    ...savedProgress,
    results: baseResults,
    answerHistory: buildAnswerHistoryFromResults(baseResults)
  };

  return { nextSavedProgress, didUpdate: true };
}
