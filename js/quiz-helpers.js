export function normalize(str) {
  return String(str || "").trim().toUpperCase();
}

export function getQuestionAnswerCodes(question) {
  if (Array.isArray(question.answers)) {
    return question.answers.map(normalize);
  }

  if (question.answer) {
    return [normalize(question.answer)];
  }

  return [];
}

export function getRevealAnswerText(question) {
  if (question.type === "sequence" && Array.isArray(question.choices)) {
    const answerCodes = getQuestionAnswerCodes(question);
    if (answerCodes.length > 0) {
      const sequenceLabel = answerCodes[0]
        .split("")
        .map((code) => {
          const idx = code.charCodeAt(0) - 65;
          return question.choices[idx] || code;
        })
        .join(" -> ");

      if (sequenceLabel) {
        return sequenceLabel;
      }
    }
  }

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

export function getResultMessage(question, { isCorrect = false, timedOut = false } = {}) {
  const answerText = getRevealAnswerText(question);

  if (isCorrect) {
    return `Correct, the answer is ${answerText}`;
  }

  if (timedOut) {
    return `Time's up, the correct answer is ${answerText}`;
  }

  return `Incorrect, the correct answer is ${answerText}`;
}

export function expandAnswerChoices(answerCode) {
  const normalized = normalize(answerCode);
  return Array.from(normalized);
}

export function getComparableAnswerOptions(question, answerValue) {
  const normalized = normalize(answerValue);

  if (question?.type === "letters") {
    return expandAnswerChoices(normalized);
  }

  return [normalized];
}

export function isCurrentAnswerCorrect(question, answerValue) {
  const validAnswers = getQuestionAnswerCodes(question);
  const userAnswerOptions = getComparableAnswerOptions(question, answerValue);
  return userAnswerOptions.some((option) => validAnswers.includes(option));
}
