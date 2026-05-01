(function quizPackEditor() {
  const DAILY_QUIZ_API_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";
  const DAILY_QUIZ_UPLOAD_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_upload_question_pack";
  const DAILY_QUIZ_PATH_SUFFIX = "d/o";
  const UPLOAD_API_KEY_STORAGE_KEY = "quiz-pack-editor.upload-api-key";
  const QUIZ_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const TYPE_CODES = ["L", "M", "N", "S"];
  const REGIONS = ["gb", "us"];
  const DEFAULT_REGION = "gb";

  const elements = {
    quizDateInput: document.getElementById("quizDateInput"),
    regionInput: document.getElementById("regionInput"),
    uploadApiKeyInput: document.getElementById("uploadApiKeyInput"),
    loadButton: document.getElementById("loadButton"),
    uploadPackButton: document.getElementById("uploadPackButton"),
    statusMessage: document.getElementById("statusMessage"),
    packMeta: document.getElementById("packMeta"),
    packDateValue: document.getElementById("packDateValue"),
    questionCountValue: document.getElementById("questionCountValue"),
    totalPlayersValue: document.getElementById("totalPlayersValue"),
    averageScoreValue: document.getElementById("averageScoreValue"),
    questionsContainer: document.getElementById("questionsContainer"),
    questionModal: document.getElementById("questionModal"),
    modalQIndex: document.getElementById("modalQIndex"),
    modalBody: document.getElementById("modalBody"),
    closeModalButton: document.getElementById("closeModalButton"),
    closeModalFooterButton: document.getElementById("closeModalFooterButton"),
    prevQuestionButton: document.getElementById("prevQuestionButton"),
    nextQuestionButton: document.getElementById("nextQuestionButton"),
    deleteModalButton: document.getElementById("deleteModalButton")
  };

  const state = {
    packDate: "",
    questions: [],
    altQuestions: {},
    results: null,
    uploadApiKey: "",
    region: DEFAULT_REGION,
    hasLoadedPack: false,
    dragIndex: -1,
    lastDragEndedAt: 0,
    dropIndicator: null
  };

  function setUploadApiKey(nextApiKey) {
    const safeApiKey = String(nextApiKey || "");
    state.uploadApiKey = safeApiKey;

    try {
      localStorage.setItem(UPLOAD_API_KEY_STORAGE_KEY, safeApiKey);
    } catch {
      // Ignore storage failures (private mode, storage limits, etc.).
    }
  }

  function hydrateUploadApiKey() {
    let savedApiKey = "";

    try {
      savedApiKey = String(localStorage.getItem(UPLOAD_API_KEY_STORAGE_KEY) || "");
    } catch {
      savedApiKey = "";
    }

    state.uploadApiKey = savedApiKey;
    if (elements.uploadApiKeyInput) {
      elements.uploadApiKeyInput.value = savedApiKey;
    }
  }

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
    const hasUkOnly =
      Object.prototype.hasOwnProperty.call(question || {}, "uk_only") ||
      Object.prototype.hasOwnProperty.call(question || {}, "ukOnly");
    const ukOnlyValue = hasUkOnly ? question?.uk_only ?? question?.ukOnly : undefined;

    return {
      id: String(question?.id || question?.question_id || `question${index + 1}`),
      q: String(question?.q || question?.question || ""),
      short_answer: String(question?.short_answer || question?.answer || ""),
      long_answer: String(question?.long_answer || question?.longAnswer || ""),
      type_code: String(question?.type_code || question?.typeCode || "L").toUpperCase(),
      difficulty: String(question?.difficulty || "normal"),
      ...(hasUkOnly && { uk_only: ukOnlyValue }),
      ...(options?.length > 0 && { options })
    };
  }

  function normalizeAltQuestions(altQuestionsPayload) {
    if (!altQuestionsPayload || typeof altQuestionsPayload !== "object") {
      return {};
    }

    return Object.entries(altQuestionsPayload).reduce((acc, [id, value]) => {
      if (!value || typeof value !== "object") {
        return acc;
      }

      const normalized = normalizeQuestion({ ...value, id }, 0);
      const { id: _ignoredId, ...withoutId } = normalized;
      acc[String(id)] = withoutId;
      return acc;
    }, {});
  }

  function normalizePack(payload) {
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    const results = payload?.results && typeof payload.results === "object" ? payload.results : null;
    const altQuestions = normalizeAltQuestions(payload?.alt_questions);

    return {
      pack_date: String(payload?.pack_date || payload?.packDate || elements.quizDateInput.value || ""),
      questions: questions.map((question, index) => normalizeQuestion(question, index)),
      results,
      alt_questions: altQuestions
    };
  }

  function formatResultMetric(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return String(value);
  }

  function formatAdjustedTotalPlayers(value) {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return String(value);
    }

    return String(numericValue);
  }

  function cloneQuestionForAlt(question) {
    const alt = {
      q: String(question?.q || ""),
      short_answer: String(question?.short_answer || ""),
      long_answer: String(question?.long_answer || ""),
      type_code: String(question?.type_code || "L").toUpperCase(),
      difficulty: String(question?.difficulty || "normal")
    };

    if (Object.prototype.hasOwnProperty.call(question || {}, "uk_only")) {
      alt.uk_only = question.uk_only;
    }

    if (Array.isArray(question?.options) && question.options.length > 0) {
      alt.options = question.options.map((item) => String(item ?? ""));
    }

    return alt;
  }

  function getQuestionIdByIndex(index) {
    const baseQuestion = state.questions[index];
    if (!baseQuestion) {
      return "";
    }

    return String(baseQuestion.id || "");
  }

  function getQuestionForRegion(index, region = state.region) {
    const baseQuestion = state.questions[index];
    if (!baseQuestion) {
      return null;
    }

    if (region === DEFAULT_REGION) {
      return baseQuestion;
    }

    const id = String(baseQuestion.id || "");
    const altQuestion = id ? state.altQuestions[id] : null;
    if (!altQuestion) {
      return baseQuestion;
    }

    return {
      ...baseQuestion,
      ...altQuestion,
      id
    };
  }

  function ensureAltQuestionByIndex(index) {
    const baseQuestion = state.questions[index];
    if (!baseQuestion) {
      return null;
    }

    const id = String(baseQuestion.id || "");
    if (!id) {
      return null;
    }

    if (!state.altQuestions[id]) {
      state.altQuestions[id] = cloneQuestionForAlt(baseQuestion);
    }

    return state.altQuestions[id];
  }

  function moveAltQuestionKey(previousId, nextId) {
    const oldId = String(previousId || "").trim();
    const newId = String(nextId || "").trim();

    if (!oldId || !newId || oldId === newId || !state.altQuestions[oldId]) {
      return;
    }

    state.altQuestions[newId] = state.altQuestions[oldId];
    delete state.altQuestions[oldId];
  }

  function removeAltQuestionByIndex(index) {
    const id = getQuestionIdByIndex(index);
    if (!id) {
      return;
    }

    delete state.altQuestions[id];
  }

  function buildEndpointUrl() {
    const dateStamp = String(elements.quizDateInput.value || "").trim();

    if (!QUIZ_DATE_REGEX.test(dateStamp)) {
      return "";
    }

    return `${DAILY_QUIZ_API_BASE_URL}/${dateStamp}/${DAILY_QUIZ_PATH_SUFFIX}`;
  }

  function buildUploadEndpointUrl(packDate, apiKey) {
    const safeDate = String(packDate || "").trim();
    const safeApiKey = String(apiKey || "").trim();
    if (!QUIZ_DATE_REGEX.test(safeDate)) {
      return "";
    }

    if (!safeApiKey) {
      return "";
    }

    return `${DAILY_QUIZ_UPLOAD_BASE_URL}/${safeDate}?api_key=${encodeURIComponent(safeApiKey)}`;
  }

  function setStatus(message, isWarning) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.classList.toggle("warn", Boolean(isWarning));
  }

  let currentModalIndex = -1;
  let currentModalRegion = DEFAULT_REGION;

  function renderQuestionCard(question, index) {
    const card = document.createElement("div");
    card.className = "question-card";
    card.dataset.index = String(index);
    card.draggable = true;

    const previewText = String(question.q || "").trim();
    const snippet = previewText.length > 90 ? `${previewText.slice(0, 87)}...` : previewText;

    const answerText = String(question.short_answer || "").trim();
    const answerSnippet = answerText.length > 60 ? `${answerText.slice(0, 57)}...` : answerText;
    const typeCodeText = String(question.type_code || "").trim().toUpperCase();
    const difficultyCode = String(question.difficulty || "").trim();
    const hasUkOnly = Object.prototype.hasOwnProperty.call(question || {}, "uk_only");
    const ukOnlyValue = hasUkOnly ? question.uk_only : undefined;
    const showUkOnlyAsterisk = hasUkOnly && ukOnlyValue === true;
    const questionId = getQuestionIdByIndex(index);
    const hasAlternativeQuestion = Boolean(questionId && state.altQuestions[questionId]);

    card.innerHTML = `
      <div class="card-header">
        <div class="card-meta">
          <span class="question-meta">${escapeHtml(typeCodeText)}</span>
          ${difficultyCode ? `<span class="question-meta difficulty-meta">${escapeHtml(difficultyCode)}</span>` : ""}
          ${hasAlternativeQuestion ? `<span class="question-meta alt-question-asterisk" title="Alternative region question exists">*</span>` : ""}
          ${showUkOnlyAsterisk ? `<span class="question-meta uk-only-asterisk" title="uk_only is true">*</span>` : ""}
        </div>
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

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      }

      // Defer so the browser captures the drag image before we hide the element.
      requestAnimationFrame(() => card.classList.add("dragging"));
    });

    card.addEventListener("dragend", () => {
      state.dragIndex = -1;
      state.lastDragEndedAt = Date.now();
      card.classList.remove("dragging");
      removeDropIndicator();
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

  function removeDropIndicator() {
    if (state.dropIndicator && state.dropIndicator.parentNode) {
      state.dropIndicator.parentNode.removeChild(state.dropIndicator);
    }
  }

  function getDropBeforeElement(clientX, clientY) {
    const cards = [
      ...elements.questionsContainer.querySelectorAll(".question-card:not(.dragging):not(.add-card)")
    ];

    // Reading-order detection: a cursor is "before" a card if it is above the card's
    // top edge (i.e. in a previous row), or within the card's row but left of its centre.
    return (
      cards.find((card) => {
        const rect = card.getBoundingClientRect();
        if (clientY < rect.top) return true;
        if (clientY < rect.bottom && clientX < rect.left + rect.width / 2) return true;
        return false;
      }) ?? null
    );
  }

  function getDropIndicatorTargetIndex() {
    let next = state.dropIndicator ? state.dropIndicator.nextElementSibling : null;
    while (next) {
      if (next.classList.contains("question-card") && !next.classList.contains("add-card")) {
        return parseInt(next.dataset.index, 10);
      }
      next = next.nextElementSibling;
    }
    // Indicator is after the last card — append at end.
    return state.questions.length;
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

    // toIndex === state.questions.length means "append at end", which is valid.
    if (fromIndex >= state.questions.length || toIndex > state.questions.length) {
      return;
    }

    const [moved] = state.questions.splice(fromIndex, 1);
    const adjustedTargetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    state.questions.splice(adjustedTargetIndex, 0, moved);
    renderQuestions();
  }

  function refreshCard(index) {
    const question = getQuestionForRegion(index, state.region);
    if (!question) {
      return;
    }

    const old = elements.questionsContainer.querySelector(`[data-index="${index}"]`);
    if (!old) {
      return;
    }

    old.replaceWith(renderQuestionCard(question, index));
  }

  function openQuestionModal(index, region = state.region) {
    const question = getQuestionForRegion(index, region);
    if (!question) {
      return;
    }

    currentModalIndex = index;
    currentModalRegion = region;
    const optionsText = (question.options || []).join("\n");
    const baseQuestionId = getQuestionIdByIndex(index);

    const regionOptions = REGIONS.map(
      (code) =>
        `<option value="${code}" ${currentModalRegion === code ? "selected" : ""}>${code.toUpperCase()}</option>`
    ).join("");

    elements.modalQIndex.textContent = `Q${index + 1}`;
    elements.modalBody.innerHTML = `
      <div class="grid-two">
        <div class="card-field">
          <label>Region</label>
          <select data-field="region" data-index="${index}">
            ${regionOptions}
          </select>
        </div>
        <div class="card-field">
          <label>ID</label>
          <input
            data-field="id"
            data-index="${index}"
            type="text"
            value="${escapeAttr(baseQuestionId)}"
            ${currentModalRegion !== DEFAULT_REGION ? "readonly" : ""}
          />
        </div>
      </div>
      <div class="grid-two">
        <div class="card-field">
          <label>Type Code E M H</label>
          <select data-field="type_code" data-index="${index}" data-region="${currentModalRegion}">
            ${TYPE_CODES.map((code) => `<option value="${code}" ${question.type_code === code ? "selected" : ""}>${code}</option>`).join("")}
          </select>
        </div>
        <div class="card-field">
          <label>UK Only</label>
          <select data-field="uk_only" data-index="${index}" data-region="${currentModalRegion}">
            <option value="true" ${question.uk_only === true ? "selected" : ""}>true</option>
            <option value="false" ${question.uk_only !== true ? "selected" : ""}>false</option>
          </select>
        </div>
      </div>
      <div class="card-field">
        <label>Question Text</label>
        <textarea data-field="q" data-index="${index}" data-region="${currentModalRegion}">${escapeHtml(question.q)}</textarea>
      </div>
      <div class="grid-two">
        <div class="card-field">
          <label>Short Answer</label>
          <input data-field="short_answer" data-index="${index}" data-region="${currentModalRegion}" type="text" value="${escapeAttr(question.short_answer)}" />
        </div>
        <div class="card-field">
          <label>Long Answer</label>
          <input data-field="long_answer" data-index="${index}" data-region="${currentModalRegion}" type="text" value="${escapeAttr(question.long_answer)}" />
        </div>
      </div>
      <div class="card-field">
        <label>Difficulty</label>
        <input data-field="difficulty" data-index="${index}" data-region="${currentModalRegion}" type="text" value="${escapeAttr(question.difficulty)}" />
      </div>
      <div class="card-field">
        <label>Options (one per line)</label>
        <textarea data-field="options" data-index="${index}" data-region="${currentModalRegion}">${escapeHtml(optionsText)}</textarea>
      </div>
    `;

    elements.questionModal.hidden = false;
    updateModalNavigationButtons();
  }

  function updateModalNavigationButtons() {
    const hasCurrent = currentModalIndex >= 0 && currentModalIndex < state.questions.length;
    const canGoPrev = hasCurrent && currentModalIndex > 0;
    const canGoNext = hasCurrent && currentModalIndex < state.questions.length - 1;

    if (elements.prevQuestionButton) {
      elements.prevQuestionButton.disabled = !canGoPrev;
    }

    if (elements.nextQuestionButton) {
      elements.nextQuestionButton.disabled = !canGoNext;
    }
  }

  function navigateModalQuestion(delta) {
    if (!Number.isInteger(delta) || currentModalIndex < 0) {
      return;
    }

    const targetIndex = currentModalIndex + delta;
    if (targetIndex < 0 || targetIndex >= state.questions.length) {
      return;
    }

    openQuestionModal(targetIndex, currentModalRegion);
  }

  function closeQuestionModal() {
    elements.questionModal.hidden = true;
    if (currentModalIndex >= 0) {
      refreshCard(currentModalIndex);
    }
    currentModalIndex = -1;
    updateModalNavigationButtons();
  }

  function renderAddCard() {
    const card = document.createElement("div");
    card.className = "question-card add-card";
    card.innerHTML = `<span class="add-icon">+</span><span>Add Question</span>`;
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
    removeAltQuestionByIndex(idx);
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
      fragment.appendChild(renderQuestionCard(getQuestionForRegion(index, state.region), index));
    });
    fragment.appendChild(renderAddCard());
    elements.questionsContainer.appendChild(fragment);

    if (state.questions.length) {
      elements.packDateValue.textContent = state.packDate;
      elements.questionCountValue.textContent = String(state.questions.length);
      elements.totalPlayersValue.textContent = formatAdjustedTotalPlayers(state.results?.total_players);
      elements.averageScoreValue.textContent = formatResultMetric(state.results?.average_score);
      elements.packMeta.hidden = false;
    } else {
      elements.packMeta.hidden = true;
    }
  }

  function syncQuestionFromInput(target) {
    const field = target.dataset.field;
    const index = Number(target.dataset.index);
    const region = target.dataset.region || currentModalRegion;

    if (!field || Number.isNaN(index) || !state.questions[index]) {
      return;
    }

    if (field === "region") {
      const selectedRegion = String(target.value || "").toLowerCase();
      const nextRegion = REGIONS.includes(selectedRegion) ? selectedRegion : DEFAULT_REGION;
      currentModalRegion = nextRegion;
      openQuestionModal(index, nextRegion);
      return;
    }

    if (field === "uk_only") {
      const nextValue = target.value === "true";

      if (region !== DEFAULT_REGION) {
        const altQuestion = ensureAltQuestionByIndex(index);
        if (!altQuestion) {
          return;
        }

        altQuestion.uk_only = nextValue;
      } else {
        state.questions[index].uk_only = nextValue;
      }

      refreshCard(index);
      return;
    }

    if (field === "id") {
      const previousId = String(state.questions[index].id || "");
      state.questions[index].id = target.value;
      moveAltQuestionKey(previousId, target.value);
      refreshCard(index);
      return;
    }

    if (field === "options") {
      const nextOptions = target.value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      if (region !== DEFAULT_REGION) {
        const altQuestion = ensureAltQuestionByIndex(index);
        if (!altQuestion) {
          return;
        }

        altQuestion.options = nextOptions;
      } else {
        state.questions[index].options = nextOptions;
      }

      refreshCard(index);
      return;
    }

    if (region !== DEFAULT_REGION) {
      const altQuestion = ensureAltQuestionByIndex(index);
      if (!altQuestion) {
        return;
      }

      altQuestion[field] = target.value;
    } else {
      state.questions[index][field] = target.value;
    }

    refreshCard(index);
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
      state.altQuestions = normalized.alt_questions;
      state.results = normalized.results;
      state.region = DEFAULT_REGION;
      if (elements.regionInput) {
        elements.regionInput.value = DEFAULT_REGION;
      }
      state.hasLoadedPack = true;
      renderQuestions();

      console.log("Daily quiz results:", {
        total_players: normalized.results?.total_players,
        average_score: normalized.results?.average_score
      });

      setStatus("", false);
    } catch (error) {
      setStatus(`Failed to load pack: ${error.message}`, true);
    }
  }

  function getCurrentPack() {
    return {
      pack_date: state.packDate || elements.quizDateInput.value || "",
      questions: state.questions,
      results: state.results,
      alt_questions: state.altQuestions
    };
  }

  async function uploadPack() {
    const pack = getCurrentPack();
    const dateToken = (pack.pack_date || elements.quizDateInput.value || "").trim();
    const uploadApiKey = String(state.uploadApiKey || elements.uploadApiKeyInput?.value || "").trim();

    if (!uploadApiKey) {
      setStatus("Upload failed: please enter the upload API key.", true);
      elements.uploadApiKeyInput?.focus();
      return;
    }

    if (!QUIZ_DATE_REGEX.test(dateToken)) {
      setStatus("Upload failed: pack date must be a valid YYYY-MM-DD value.", true);
      return;
    }

    const uploadUrl = buildUploadEndpointUrl(dateToken, uploadApiKey);
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

      formData.append("api_key", uploadApiKey);
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
    hydrateUploadApiKey();

    const openDatePicker = () => {
      if (typeof elements.quizDateInput.showPicker === "function") {
        try {
          elements.quizDateInput.showPicker();
        } catch {
          // Some browsers enforce strict gesture rules for showPicker.
        }
      }
    };

    state.dropIndicator = document.createElement("div");
    state.dropIndicator.className = "drop-indicator";
    state.dropIndicator.setAttribute("aria-hidden", "true");

    elements.questionsContainer.addEventListener("dragover", (event) => {
      if (state.dragIndex < 0) return;
      event.preventDefault();

      const beforeElement = getDropBeforeElement(event.clientX, event.clientY);
      if (beforeElement === null) {
        const addCard = elements.questionsContainer.querySelector(".add-card");
        if (addCard) {
          elements.questionsContainer.insertBefore(state.dropIndicator, addCard);
        } else {
          elements.questionsContainer.appendChild(state.dropIndicator);
        }
      } else {
        elements.questionsContainer.insertBefore(state.dropIndicator, beforeElement);
      }
    });

    elements.questionsContainer.addEventListener("dragleave", (event) => {
      if (!elements.questionsContainer.contains(event.relatedTarget)) {
        removeDropIndicator();
      }
    });

    elements.questionsContainer.addEventListener("drop", (event) => {
      event.preventDefault();
      const fromIndex = getDragSourceIndex(event);
      const toIndex = getDropIndicatorTargetIndex();
      removeDropIndicator();
      moveQuestion(fromIndex, toIndex);
    });

    elements.loadButton.addEventListener("click", loadPack);
    elements.uploadPackButton.addEventListener("click", uploadPack);
    elements.quizDateInput.addEventListener("pointerdown", openDatePicker);
    elements.quizDateInput.addEventListener("click", openDatePicker);
    elements.quizDateInput.addEventListener("change", loadPack);
    elements.regionInput?.addEventListener("change", (event) => {
      if (!(event.target instanceof HTMLSelectElement)) {
        return;
      }

      const selectedRegion = String(event.target.value || "").toLowerCase();
      state.region = REGIONS.includes(selectedRegion) ? selectedRegion : DEFAULT_REGION;
      renderQuestions();
    });
    elements.uploadApiKeyInput?.addEventListener("input", (event) => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      setUploadApiKey(event.target.value);
    });
    elements.closeModalButton.addEventListener("click", closeQuestionModal);
    elements.closeModalFooterButton.addEventListener("click", closeQuestionModal);
    elements.prevQuestionButton?.addEventListener("click", () => navigateModalQuestion(-1));
    elements.nextQuestionButton?.addEventListener("click", () => navigateModalQuestion(1));
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
    updateModalNavigationButtons();
    loadPack();
  }

  initialize();
})();
