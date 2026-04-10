(function quizPackEditor() {
  const DAILY_QUIZ_API_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";
  const DAILY_QUIZ_UPLOAD_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_upload_question_pack";
  const DAILY_QUIZ_PATH_SUFFIX = "d/o";
  const DAILY_QUIZ_UPLOAD_API_KEY = "cRf7UOIEayNlGtKCFvUq76tmhcWHiqZW";
  const QUIZ_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const TYPE_CODES = ["L", "M", "N", "S"];

  const elements = {
    quizDateInput: document.getElementById("quizDateInput"),
    loadButton: document.getElementById("loadButton"),
    uploadPackButton: document.getElementById("uploadPackButton"),
    statusMessage: document.getElementById("statusMessage"),
    packMeta: document.getElementById("packMeta"),
    packDateValue: document.getElementById("packDateValue"),
    questionCountValue: document.getElementById("questionCountValue"),
    questionsContainer: document.getElementById("questionsContainer"),
    questionModal: document.getElementById("questionModal"),
    modalQIndex: document.getElementById("modalQIndex"),
    modalBody: document.getElementById("modalBody"),
    closeModalButton: document.getElementById("closeModalButton"),
    closeModalFooterButton: document.getElementById("closeModalFooterButton"),
    deleteModalButton: document.getElementById("deleteModalButton")
  };

  const state = {
    packDate: "",
    questions: [],
    hasLoadedPack: false,
    dragIndex: -1,
    lastDragEndedAt: 0
  };

  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getTomorrowDateString() {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const year = next.getFullYear();
    const month = String(next.getMonth() + 1).padStart(2, "0");
    const day = String(next.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeQuestion(question, index) {
    const options = Array.isArray(question?.options)
      ? question.options.map((item) => String(item ?? ""))
      : [];

    return {
      id: String(question?.id || question?.question_id || `question${index + 1}`),
      q: String(question?.q || question?.question || ""),
      short_answer: String(question?.short_answer || question?.answer || ""),
      long_answer: String(question?.long_answer || question?.longAnswer || ""),
      type_code: String(question?.type_code || question?.typeCode || "L").toUpperCase(),
      difficulty: String(question?.difficulty || "normal"),
      options
    };
  }

  function normalizePack(payload) {
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];

    return {
      pack_date: String(payload?.pack_date || payload?.packDate || elements.quizDateInput.value || ""),
      questions: questions.map((question, index) => normalizeQuestion(question, index))
    };
  }

  function buildEndpointUrl() {
    const dateStamp = String(elements.quizDateInput.value || "").trim();

    if (!QUIZ_DATE_REGEX.test(dateStamp)) {
      return "";
    }

    return `${DAILY_QUIZ_API_BASE_URL}/${dateStamp}/${DAILY_QUIZ_PATH_SUFFIX}`;
  }

  function buildUploadEndpointUrl(packDate) {
    const safeDate = String(packDate || "").trim();
    if (!QUIZ_DATE_REGEX.test(safeDate)) {
      return "";
    }

    return `${DAILY_QUIZ_UPLOAD_BASE_URL}/${safeDate}?api_key=${encodeURIComponent(DAILY_QUIZ_UPLOAD_API_KEY)}`;
  }

  function setStatus(message, isWarning) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.toggle("warn", Boolean(isWarning));
  }

  let currentModalIndex = -1;

  function renderQuestionCard(question, index) {
    const card = document.createElement("div");
    card.className = "question-card";
    card.dataset.index = String(index);
    card.draggable = true;

    const previewText = String(question.q || "").trim();
    const snippet = previewText.length > 90 ? `${previewText.slice(0, 87)}...` : previewText;

    const answerText = String(question.short_answer || "").trim();
    const answerSnippet = answerText.length > 60 ? `${answerText.slice(0, 57)}...` : answerText;

    card.innerHTML = `
      <div class="card-header">
        <span class="question-index">Q${index + 1}</span>
        <span class="question-meta">${escapeHtml(question.type_code)}</span>
      </div>
      <p class="card-question">${escapeHtml(snippet || "No question text")}</p>
      <p class="card-answer">${escapeHtml(answerSnippet || "\u2014")}</p>
    `;

    card.addEventListener("click", () => {
      // Ignore the synthetic click that can fire right after a drag action ends.
      if (Date.now() - state.lastDragEndedAt < 220) {
        return;
      }

      openQuestionModal(index);
    });

    card.addEventListener("dragstart", (event) => {
      state.dragIndex = index;
      card.classList.add("dragging");

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      }
    });

    card.addEventListener("dragover", (event) => {
      if (state.dragIndex < 0 || state.dragIndex === index) {
        return;
      }

      event.preventDefault();
      card.classList.add("drop-target");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drop-target");
    });

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      card.classList.remove("drop-target");

      const fromIndex = getDragSourceIndex(event);
      moveQuestion(fromIndex, index);
    });

    card.addEventListener("dragend", () => {
      state.dragIndex = -1;
      state.lastDragEndedAt = Date.now();
      card.classList.remove("dragging", "drop-target");
      clearDropTargets();
    });

    return card;
  }

  function getDragSourceIndex(event) {
    if (state.dragIndex >= 0) {
      return state.dragIndex;
    }

    if (!event?.dataTransfer) {
      return -1;
    }

    const sourceText = event.dataTransfer.getData("text/plain");
    const parsed = Number(sourceText);
    return Number.isInteger(parsed) ? parsed : -1;
  }

  function clearDropTargets() {
    elements.questionsContainer
      .querySelectorAll(".question-card.drop-target")
      .forEach((card) => card.classList.remove("drop-target"));
  }

  function moveQuestion(fromIndex, toIndex) {
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
      return;
    }

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    if (fromIndex === toIndex) {
      return;
    }

    if (fromIndex >= state.questions.length || toIndex >= state.questions.length) {
      return;
    }

    const [moved] = state.questions.splice(fromIndex, 1);
    const adjustedTargetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    state.questions.splice(adjustedTargetIndex, 0, moved);
    renderQuestions();
  }

  function refreshCard(index) {
    const question = state.questions[index];
    if (!question) {
      return;
    }

    const old = elements.questionsContainer.querySelector(`[data-index="${index}"]`);
    if (!old) {
      return;
    }

    old.replaceWith(renderQuestionCard(question, index));
  }

  function openQuestionModal(index) {
    const question = state.questions[index];
    if (!question) {
      return;
    }

    currentModalIndex = index;
    const optionsText = (question.options || []).join("\n");

    elements.modalQIndex.textContent = `Q${index + 1}`;
    elements.modalBody.innerHTML = `
      <div class="grid-two">
        <div class="card-field">
          <label>ID</label>
          <input data-field="id" data-index="${index}" type="text" value="${escapeAttr(question.id)}" />
        </div>
        <div class="card-field">
          <label>Type Code</label>
          <select data-field="type_code" data-index="${index}">
            ${TYPE_CODES.map((code) => `<option value="${code}" ${question.type_code === code ? "selected" : ""}>${code}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="card-field">
        <label>Question Text</label>
        <textarea data-field="q" data-index="${index}">${escapeHtml(question.q)}</textarea>
      </div>
      <div class="grid-two">
        <div class="card-field">
          <label>Short Answer</label>
          <input data-field="short_answer" data-index="${index}" type="text" value="${escapeAttr(question.short_answer)}" />
        </div>
        <div class="card-field">
          <label>Long Answer</label>
          <input data-field="long_answer" data-index="${index}" type="text" value="${escapeAttr(question.long_answer)}" />
        </div>
      </div>
      <div class="card-field">
        <label>Difficulty</label>
        <input data-field="difficulty" data-index="${index}" type="text" value="${escapeAttr(question.difficulty)}" />
      </div>
      <div class="card-field">
        <label>Options (one per line)</label>
        <textarea data-field="options" data-index="${index}">${escapeHtml(optionsText)}</textarea>
      </div>
    `;

    elements.questionModal.hidden = false;
  }

  function closeQuestionModal() {
    elements.questionModal.hidden = true;
    if (currentModalIndex >= 0) {
      refreshCard(currentModalIndex);
    }
    currentModalIndex = -1;
  }

  function renderAddCard() {
    const card = document.createElement("div");
    card.className = "question-card add-card";
    card.innerHTML = `<span class="add-icon">+</span><span>Add Question</span>`;

    card.addEventListener("dragover", (event) => {
      if (state.dragIndex < 0) {
        return;
      }

      event.preventDefault();
      card.classList.add("drop-target");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drop-target");
    });

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drop-target");

      const fromIndex = getDragSourceIndex(event);
      if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= state.questions.length) {
        return;
      }

      const [moved] = state.questions.splice(fromIndex, 1);
      state.questions.push(moved);
      renderQuestions();
    });

    card.addEventListener("click", addQuestion);
    return card;
  }

  function addQuestion() {
    if (!state.hasLoadedPack) {
      return;
    }

    const newIndex = state.questions.length;
    state.questions.push(normalizeQuestion({}, newIndex));
    renderQuestions();
    openQuestionModal(newIndex);
  }

  function deleteCurrentQuestion() {
    if (currentModalIndex < 0) return;
    if (!confirm(`Delete Q${currentModalIndex + 1}? This cannot be undone.`)) return;
    const idx = currentModalIndex;
    currentModalIndex = -1;
    elements.questionModal.hidden = true;
    state.questions.splice(idx, 1);
    renderQuestions();
  }

  function renderQuestions() {
    elements.questionsContainer.innerHTML = "";

    if (!state.hasLoadedPack) {
      elements.packMeta.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    state.questions.forEach((question, index) => {
      fragment.appendChild(renderQuestionCard(question, index));
    });
    fragment.appendChild(renderAddCard());
    elements.questionsContainer.appendChild(fragment);

    if (state.questions.length) {
      elements.packDateValue.textContent = state.packDate;
      elements.questionCountValue.textContent = String(state.questions.length);
      elements.packMeta.hidden = false;
    } else {
      elements.packMeta.hidden = true;
    }
  }

  function syncQuestionFromInput(target) {
    const field = target.dataset.field;
    const index = Number(target.dataset.index);

    if (!field || Number.isNaN(index) || !state.questions[index]) {
      return;
    }

    if (field === "options") {
      state.questions[index].options = target.value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      return;
    }

    state.questions[index][field] = target.value;
  }

  async function loadPack() {
    const endpoint = buildEndpointUrl();
    if (!endpoint) {
      setStatus("Please provide a valid date stamp.", true);
      return;
    }

    setStatus("Loading quiz pack...", false);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const payload = json?.data && typeof json.data === "object" ? json.data : json;
      const normalized = normalizePack(payload);

      state.packDate = normalized.pack_date;
      state.questions = normalized.questions;
      state.hasLoadedPack = true;
      renderQuestions();

      setStatus("", false);
    } catch (error) {
      setStatus(`Failed to load pack: ${error.message}`, true);
    }
  }

  function getCurrentPack() {
    return {
      pack_date: state.packDate || elements.quizDateInput.value || "",
      questions: state.questions
    };
  }

  async function uploadPack() {
    const pack = getCurrentPack();
    const dateToken = (pack.pack_date || elements.quizDateInput.value || "").trim();

    if (!QUIZ_DATE_REGEX.test(dateToken)) {
      setStatus("Upload failed: pack date must be a valid YYYY-MM-DD value.", true);
      return;
    }

    const uploadUrl = buildUploadEndpointUrl(dateToken);
    if (!uploadUrl) {
      setStatus("Upload failed: could not build upload URL.", true);
      return;
    }

    const shouldUpload = confirm(
      `Upload pack for ${dateToken}? This action cannot be reversed.\n\nSelect OK to continue or Cancel to abort.`
    );
    if (!shouldUpload) {
      setStatus("Upload cancelled.", false);
      return;
    }

    try {
      setStatus("Uploading pack...", false);

      const payload = {
        ...pack,
        pack_date: dateToken
      };
      const jsonContent = JSON.stringify(payload, null, 2);
      const filename = `daily-quiz-${dateToken}.json`;
      const file = new File([jsonContent], filename, { type: "application/json" });
      const formData = new FormData();

      formData.append("api_key", DAILY_QUIZ_UPLOAD_API_KEY);
      formData.append("file", file, filename);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || !result?.success) {
        const reason = result?.error || `HTTP ${response.status}`;
        if (reason === "invalid_api_key") {
          throw new Error("invalid_api_key (backend currently validates x-api-key header only)");
        }
        throw new Error(reason);
      }

      setStatus(
        `Upload complete: ${result.filename || filename} (${result.question_count || payload.questions.length} questions).`,
        false
      );
    } catch (error) {
      const message = String(error?.message || "");
      if (message === "Failed to fetch") {
        setStatus(
          "Upload failed: blocked by CORS preflight. Allow OPTIONS for this route and return CORS headers.",
          true
        );
        return;
      }

      setStatus(`Upload failed: ${message}`, true);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('"', "&quot;");
  }

  function initialize() {
    elements.quizDateInput.value = getTomorrowDateString();

    const openDatePicker = () => {
      if (typeof elements.quizDateInput.showPicker === "function") {
        try {
          elements.quizDateInput.showPicker();
        } catch {
          // Some browsers enforce strict gesture rules for showPicker.
        }
      }
    };

    elements.loadButton.addEventListener("click", loadPack);
    elements.uploadPackButton.addEventListener("click", uploadPack);
    elements.quizDateInput.addEventListener("pointerdown", openDatePicker);
    elements.quizDateInput.addEventListener("click", openDatePicker);
    elements.closeModalButton.addEventListener("click", closeQuestionModal);
    elements.closeModalFooterButton.addEventListener("click", closeQuestionModal);
    elements.deleteModalButton.addEventListener("click", deleteCurrentQuestion);

    elements.questionModal.addEventListener("click", (event) => {
      if (event.target === elements.questionModal) {
        closeQuestionModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !elements.questionModal.hidden) {
        closeQuestionModal();
      }
    });

    elements.modalBody.addEventListener("input", (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      syncQuestionFromInput(event.target);
    });

    renderQuestions();
  }

  initialize();
})();
