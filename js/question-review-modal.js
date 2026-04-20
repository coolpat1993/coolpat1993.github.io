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
    return timedOut ? "No answer (timed out)" : "No answer";
  }

  return normalized;
}

export function createQuestionReviewController({
  panelEl,
  closeButtonEl,
  listEl,
  viewQuestionsButtonEl,
  getIsGameFinished,
  getQuestions,
  getMaxFastPoints,
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
    const maxFastPoints = getMaxFastPoints();

    listEl.innerHTML = resultEntries.map((entry, idx) => {
      const questionNumber = Number.isInteger(entry?.questionIndex) ? entry.questionIndex + 1 : idx + 1;
      const sourceQuestion = questions[questionNumber - 1];
      const questionText = sourceQuestion?.question || `Question ${questionNumber}`;
      const correctAnswer = formatReviewAnswer(entry?.correctAnswer, false);
      const yourAnswer = formatReviewAnswer(entry?.userAnswer, !!entry?.timedOut);
      const earnedPoints = Number.isFinite(entry?.earnedPoints) ? entry.earnedPoints : 0;

      return `
        <article class="question-review-item">
          <p class="question-review-question"><strong>Q${questionNumber}.</strong> ${escapeHtml(questionText)}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Answer:</span> ${escapeHtml(correctAnswer)}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Your answer:</span> ${escapeHtml(yourAnswer)}</p>
          <p class="question-review-meta"><span class="question-review-meta-label">Score:</span> ${earnedPoints}/${maxFastPoints}</p>
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
