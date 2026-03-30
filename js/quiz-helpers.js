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
  if (question.typeCode === "S" && Array.isArray(question.choices)) {
    const answerCodes = getQuestionAnswerCodes(question);
    if (answerCodes.length > 0) {
      const sequenceLabel = answerCodes[0]
        .split("")
        .map((code) => {
          const idx = code.charCodeAt(0) - 65;
          return question.choices[idx] || code;
        })
        .join(" | ");

      if (sequenceLabel) {
        return sequenceLabel;
      }
    }
  }

  if (question.typeCode === "M" && Array.isArray(question.choices)) {
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
    return `${answerText} ✅`;
  }

  if (timedOut) {
    return `${answerText} ⏳`;
  }

  return `${answerText} ❌`;
}

export function expandAnswerChoices(answerCode) {
  const normalized = normalize(answerCode);
  return Array.from(normalized);
}

export function getComparableAnswerOptions(question, answerValue) {
  const normalized = normalize(answerValue);

  if (question?.typeCode === "L") {
    return expandAnswerChoices(normalized);
  }

  return [normalized];
}

export function isCurrentAnswerCorrect(question, answerValue) {
  const validAnswers = getQuestionAnswerCodes(question);
  const userAnswerOptions = getComparableAnswerOptions(question, answerValue);
  return userAnswerOptions.some((option) => validAnswers.includes(option));
}

export function isQuizDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

export function parseQuizDate(value) {
  const quizDate = String(value || "").trim();
  if (!isQuizDateString(quizDate)) {
    return null;
  }

  const [year, month, day] = quizDate.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return utcDate;
}

export function formatQuizDateForQuery(date) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayUtcDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
