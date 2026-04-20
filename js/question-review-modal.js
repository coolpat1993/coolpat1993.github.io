function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReviewAnswer(answer, timedOut = false) {
  const normalized = String(answer || "").trim();
  if (!normalized) {
    return "No answer";
  }

  return normalized;
}

function getOptionLabelFromCode(question, code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!Array.isArray(question?.options) || normalizedCode.length !== 1) {
    return null;
  }

  const optionIndex = normalizedCode.charCodeAt(0) - 65;
  const optionLabel = question.options[optionIndex];
  return optionLabel ? String(optionLabel) : null;
}

function formatReviewUserAnswer(entry, sourceQuestion) {
  const rawAnswer = String(entry?.userAnswer || "").trim();
  if (!rawAnswer) {
    return formatReviewAnswer(rawAnswer, !!entry?.timedOut);
  }

  if (!sourceQuestion || !Array.isArray(sourceQuestion.options)) {
    return formatReviewAnswer(rawAnswer, !!entry?.timedOut);
  }

  const normalizedAnswer = rawAnswer.toUpperCase();

  if (entry?.typeCode === "M") {
    const labels = normalizedAnswer
      .split("")
      .map((code) => getOptionLabelFromCode(sourceQuestion, code))
      .filter(Boolean);

    if (labels.length > 0) {
      return labels.join(" / ");
    }
  }

  if (entry?.typeCode === "S") {
    const labels = normalizedAnswer
      .split("")
      .map((code) => getOptionLabelFromCode(sourceQuestion, code))
      .filter(Boolean);

    if (labels.length > 0) {
      return labels.join(" | ");
    }
  }

  return formatReviewAnswer(rawAnswer, !!entry?.timedOut);
}

export function createQuestionReviewController({
  panelEl,
  closeButtonEl,
  listEl,
  viewQuestionsButtonEl,
  getIsGameFinished,
  getQuestions,
  getResultEntries
}) {
  if (!panelEl || !listEl) {
    return {
      open: () => {},
      close: () => {}
    };
  }

  function renderQuestionReviewList() {
    const resultEntries = getResultEntries();

    if (!Array.isArray(resultEntries) || resultEntries.length === 0) {
      listEl.innerHTML = '<p class="question-review-empty">No question results available yet.</p>';
      return;
    }

    const questions = getQuestions();

    listEl.innerHTML = resultEntries.map((entry, idx) => {
      const questionNumber = Number.isInteger(entry?.questionIndex) ? entry.questionIndex + 1 : idx + 1;
      const sourceQuestion = questions[questionNumber - 1];
      const questionText = sourceQuestion?.question || `Question ${questionNumber}`;
      const correctAnswer = formatReviewAnswer(entry?.correctAnswer, false);
      const yourAnswer = formatReviewUserAnswer(entry, sourceQuestion);
      const earnedPoints = Number.isFinite(entry?.earnedPoints) ? entry.earnedPoints : 0;
      const isCorrect = typeof entry?.isCorrect === "boolean" ? entry.isCorrect : earnedPoints > 0;
      const statusEmoji = isCorrect ? "✅" : "❌";

      return `
        <article class="question-review-item">
          <p class="question-review-question"><strong>Q${questionNumber}.</strong> ${escapeHtml(questionText)}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Answer:</span> ${escapeHtml(correctAnswer)}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Your answer:</span> ${escapeHtml(yourAnswer)}  ${statusEmoji}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Score:</span> ${earnedPoints}</p>
        </article>
      `;
    }).join("");
  }

  function open() {
    if (!getIsGameFinished()) {
      return;
    }

    renderQuestionReviewList();
    panelEl.hidden = false;
    // Force a reflow so the open animation runs when un-hiding.
    void panelEl.offsetWidth;
    panelEl.classList.add("is-open");
  }

  function close() {
    panelEl.classList.remove("is-open");
    panelEl.hidden = true;
  }

  if (viewQuestionsButtonEl) {
    viewQuestionsButtonEl.addEventListener("click", open);
  }

  if (closeButtonEl) {
    closeButtonEl.addEventListener("click", close);
  }

  panelEl.addEventListener("pointerdown", (event) => {
    if (event.target === panelEl) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panelEl.hidden) {
      close();
    }
  });

  return {
    open,
    close
  };
}
