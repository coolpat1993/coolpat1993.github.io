(function quizPackEditor() {
  const DAILY_QUIZ_API_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";
  const DAILY_QUIZ_UPLOAD_BASE_URL =
    "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_upload_question_pack";
  const DAILY_QUIZ_PATH_SUFFIX = "d/o";
  const UPLOAD_API_KEY_STORAGE_KEY = "quiz-pack-editor.upload-api-key";
  const QUIZ_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const TYPE_CODES = ["L", "M", "N", "S"];
  const ANSWER_CODES = ["A", "B", "C", "D", "E", "F"];
  const MAX_CHOICE_OPTIONS = ANSWER_CODES.length;
  const REGIONS = ["gb", "us"];
  const DEFAULT_REGION = "gb";

  function createEmptyAltQuestions() {
    return REGIONS.reduce((acc, region) => {
      if (region !== DEFAULT_REGION) {
        acc[region] = {};
      }
      return acc;
    }, {});
  }

  const elements = {
    quizDateInput: document.getElementById("quizDateInput"),
    regionTabs: document.getElementById("regionTabs"),
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
    altQuestions: createEmptyAltQuestions(),
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
    const hasCategory = Object.prototype.hasOwnProperty.call(question || {}, "category");
    const hasUkOnly =
      Object.prototype.hasOwnProperty.call(question || {}, "uk_only") ||
      Object.prototype.hasOwnProperty.call(question || {}, "ukOnly");
    const ukOnlyValue = hasUkOnly ? question?.uk_only ?? question?.ukOnly : undefined;

    return sanitizeQuestionByType({
      id: String(question?.id || question?.question_id || `question${index + 1}`),
      q: String(question?.q || question?.question || ""),
      short_answer: String(question?.short_answer || question?.answer || ""),
      long_answer: String(question?.long_answer || question?.longAnswer || ""),
      type_code: String(question?.type_code || question?.typeCode || "L").toUpperCase(),
      difficulty: String(question?.difficulty || "normal"),
      ...(hasCategory && { category: String(question?.category || "") }),
      ...(hasUkOnly && { uk_only: ukOnlyValue }),
      ...(options?.length > 0 && { options })
    });
  }

  function normalizeTypeCode(typeCode) {
    const normalized = String(typeCode || "").trim().toUpperCase();
    return TYPE_CODES.includes(normalized) ? normalized : "L";
  }

  function trimTrailingEmptyOptions(options) {
    const next = Array.isArray(options) ? options.map((item) => String(item || "")) : [];
    while (next.length > 0 && !next[next.length - 1].trim()) {
      next.pop();
    }

    return next.slice(0, MAX_CHOICE_OPTIONS);
  }

  function sanitizeLetterShortAnswer(value) {
    const upper = String(value || "").toUpperCase();
    const lettersOnly = upper.replace(/[^A-Z]/g, "");
    return lettersOnly.slice(0, 1);
  }

  function sanitizeNumberShortAnswer(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    const chars = raw.replace(/[^0-9.-]/g, "");
    let result = "";
    let hasDot = false;

    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];

      if (/\d/.test(char)) {
        result += char;
        continue;
      }

      if (char === "-" && result.length === 0) {
        result += char;
        continue;
      }

      if (char === "." && !hasDot) {
        if (result.length === 0 || result === "-") {
          result += "0";
        }
        result += ".";
        hasDot = true;
      }
    }

    return result;
  }

  function sanitizeMultipleChoiceShortAnswer(question) {
    const normalized = sanitizeLetterShortAnswer(question.short_answer);
    const optionCount = Array.isArray(question.options) ? question.options.length : 0;
    if (!normalized || optionCount === 0) {
      return "";
    }

    const selectedIndex = normalized.charCodeAt(0) - 65;
    return selectedIndex >= 0 && selectedIndex < optionCount ? normalized : "";
  }

  function buildSequentialAnswerCode(optionCount) {
    return ANSWER_CODES.slice(0, Math.max(0, optionCount)).join("");
  }

  function sanitizeSequenceShortAnswer(question) {
    const optionCount = Array.isArray(question.options) ? question.options.length : 0;
    if (optionCount === 0) {
      return "";
    }

    const raw = String(question.short_answer || "")
      .toUpperCase()
      .replace(/[^A-F]/g, "");

    if (!raw) {
      return buildSequentialAnswerCode(optionCount);
    }

    const used = new Set();
    const sanitized = [];
    for (const code of raw) {
      const idx = code.charCodeAt(0) - 65;
      if (idx < 0 || idx >= optionCount || used.has(code)) {
        continue;
      }

      used.add(code);
      sanitized.push(code);
    }

    if (sanitized.length !== optionCount) {
      return buildSequentialAnswerCode(optionCount);
    }

    return sanitized.join("");
  }

  function sanitizeQuestionByType(question) {
    const sanitized = {
      ...question,
      type_code: normalizeTypeCode(question?.type_code)
    };

    if (sanitized.type_code === "L") {
      sanitized.short_answer = sanitizeLetterShortAnswer(sanitized.short_answer);
      return sanitized;
    }

    if (sanitized.type_code === "N") {
      sanitized.short_answer = sanitizeNumberShortAnswer(sanitized.short_answer);
      delete sanitized.options;
      return sanitized;
    }

    if (sanitized.type_code === "M") {
      sanitized.options = trimTrailingEmptyOptions(sanitized.options).filter((item) => item.trim().length > 0);
      sanitized.short_answer = sanitizeMultipleChoiceShortAnswer(sanitized);
      return sanitized;
    }

    if (sanitized.type_code === "S") {
      sanitized.options = trimTrailingEmptyOptions(sanitized.options).filter((item) => item.trim().length > 0);
      sanitized.short_answer = sanitizeSequenceShortAnswer(sanitized);
      return sanitized;
    }

    return sanitized;
  }

  function normalizeAltQuestions(altQuestionsPayload) {
    const normalizedByRegion = createEmptyAltQuestions();

    if (!altQuestionsPayload || typeof altQuestionsPayload !== "object") {
      return normalizedByRegion;
    }

    Object.entries(altQuestionsPayload).forEach(([regionKey, entries]) => {
      const normalizedRegion = String(regionKey || "").trim().toLowerCase();
      if (!REGIONS.includes(normalizedRegion) || normalizedRegion === DEFAULT_REGION) {
        return;
      }

      if (!Array.isArray(entries)) {
        return;
      }

      entries.forEach((entry) => {
        if (!entry || typeof entry !== "object") {
          return;
        }

        const altId = String(entry.alt_id || "").trim();
        if (!altId) {
          return;
        }

        const normalized = normalizeQuestion({ ...entry, id: altId }, 0);
        const { id: _ignoredId, ...withoutId } = normalized;
        normalizedByRegion[normalizedRegion][altId] = withoutId;
      });
    });

    return normalizedByRegion;
  }

  function serializeAltQuestions(altQuestionsByRegion) {
    if (!altQuestionsByRegion || typeof altQuestionsByRegion !== "object") {
      return {};
    }

    return Object.entries(altQuestionsByRegion).reduce((acc, [region, questionsById]) => {
      const normalizedRegion = String(region || "").trim().toLowerCase();
      if (!REGIONS.includes(normalizedRegion) || normalizedRegion === DEFAULT_REGION) {
        return acc;
      }

      const entries = Object.entries(questionsById || {}).reduce((items, [altId, question]) => {
        if (!altId || !question || typeof question !== "object") {
          return items;
        }

        items.push({
          alt_id: String(altId),
          ...question
        });
        return items;
      }, []);

      if (entries.length > 0) {
        acc[normalizedRegion.toUpperCase()] = entries;
      }

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

    if (Object.prototype.hasOwnProperty.call(question || {}, "category")) {
      alt.category = String(question?.category || "");
    }

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

  function getRegionDisplayLabel(region) {
    const normalizedRegion = String(region || "").trim().toLowerCase();
    if (normalizedRegion === "gb") {
      return "UK";
    }

    if (normalizedRegion === "us") {
      return "US";
    }

    return normalizedRegion.toUpperCase();
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
    const altRegion = state.altQuestions[region] || {};
    const altQuestion = id ? altRegion[id] : null;
    if (!altQuestion) {
      return baseQuestion;
    }

    return {
      ...baseQuestion,
      ...altQuestion,
      id
    };
  }

  function buildRegionTabsMarkup(selectedRegion, { field, index, className = "", includeLabel = true } = {}) {
    const normalizedRegion = REGIONS.includes(String(selectedRegion || "").toLowerCase())
      ? String(selectedRegion || "").toLowerCase()
      : DEFAULT_REGION;
    const classes = ["region-tabs", className].filter(Boolean).join(" ");

    return `
      <div class="${classes}" role="tablist" ${includeLabel ? 'aria-label="Region"' : ""}>
        ${REGIONS.map((code) => {
          const isSelected = normalizedRegion === code;
          const fieldAttr = field ? ` data-field="${field}"` : "";
          const indexAttr = Number.isInteger(index) ? ` data-index="${index}"` : "";

          return `
            <button
              type="button"
              class="region-tab ${isSelected ? "is-active" : ""}"
              data-region-tab="${code}"
              ${fieldAttr}
              ${indexAttr}
              role="tab"
              aria-selected="${isSelected ? "true" : "false"}"
            >
              ${escapeHtml(getRegionDisplayLabel(code))}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function updateTopRegionTabs(activeRegion) {
    if (!elements.regionTabs) {
      return;
    }

    const normalizedRegion = REGIONS.includes(String(activeRegion || "").toLowerCase())
      ? String(activeRegion || "").toLowerCase()
      : DEFAULT_REGION;

    const tabs = elements.regionTabs.querySelectorAll("[data-region-tab]");
    tabs.forEach((tab) => {
      if (!(tab instanceof HTMLButtonElement)) {
        return;
      }

      const isActive = tab.dataset.regionTab === normalizedRegion;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function ensureAltQuestionByIndex(index, region) {
    const baseQuestion = state.questions[index];
    if (!baseQuestion) {
      return null;
    }

    const normalizedRegion = String(region || "").trim().toLowerCase();
    if (!REGIONS.includes(normalizedRegion) || normalizedRegion === DEFAULT_REGION) {
      return null;
    }

    const id = String(baseQuestion.id || "");
    if (!id) {
      return null;
    }

    if (!state.altQuestions[normalizedRegion]) {
      state.altQuestions[normalizedRegion] = {};
    }

    if (!state.altQuestions[normalizedRegion][id]) {
      state.altQuestions[normalizedRegion][id] = cloneQuestionForAlt(baseQuestion);
    }

    return state.altQuestions[normalizedRegion][id];
  }

  function moveAltQuestionKey(previousId, nextId) {
    const oldId = String(previousId || "").trim();
    const newId = String(nextId || "").trim();

    if (!oldId || !newId || oldId === newId) {
      return;
    }

    REGIONS.forEach((region) => {
      if (region === DEFAULT_REGION) {
        return;
      }

      const regionQuestions = state.altQuestions[region];
      if (!regionQuestions || !regionQuestions[oldId]) {
        return;
      }

      regionQuestions[newId] = regionQuestions[oldId];
      delete regionQuestions[oldId];
    });
  }

  function removeAltQuestionByIndex(index, region) {
    const id = getQuestionIdByIndex(index);
    if (!id) {
      return;
    }

    const normalizedRegion = String(region || "").trim().toLowerCase();
    if (normalizedRegion && normalizedRegion !== DEFAULT_REGION) {
      if (state.altQuestions[normalizedRegion]) {
        delete state.altQuestions[normalizedRegion][id];
      }
      return;
    }

    REGIONS.forEach((region) => {
      if (region === DEFAULT_REGION) {
        return;
      }

      if (state.altQuestions[region]) {
        delete state.altQuestions[region][id];
      }
    });
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
    const hasAlternativeQuestion =
      Boolean(questionId) &&
      REGIONS.some((region) => {
        if (region === DEFAULT_REGION) {
          return false;
        }

        return Boolean(state.altQuestions[region]?.[questionId]);
      });

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

  function getEditableQuestionForRegion(index, region = currentModalRegion) {
    if (!state.questions[index]) {
      return null;
    }

    if (region !== DEFAULT_REGION) {
      return ensureAltQuestionByIndex(index, region);
    }

    return state.questions[index];
  }

  function getSequenceAnswerList(question) {
    const options = Array.isArray(question?.options)
      ? question.options.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const answerCodes = String(question?.short_answer || "")
      .toUpperCase()
      .replace(/[^A-F]/g, "");

    if (answerCodes && options.length > 0) {
      const labels = answerCodes
        .split("")
        .map((code) => {
          const idx = code.charCodeAt(0) - 65;
          return options[idx] || "";
        })
        .filter(Boolean);

      if (labels.length > 0) {
        return labels.slice(0, MAX_CHOICE_OPTIONS);
      }
    }

    return options.slice(0, MAX_CHOICE_OPTIONS);
  }

  function getSequenceAnswerListFromModal(index) {
    const inputs = Array.from(
      elements.modalBody.querySelectorAll(
        `input[data-field="sequence_answer_label"][data-index="${index}"]`
      )
    );

    return inputs
      .sort((a, b) => Number(a.dataset.optionIndex) - Number(b.dataset.optionIndex))
      .map((input) => String(input.value || "").trim())
      .filter(Boolean)
      .slice(0, MAX_CHOICE_OPTIONS);
  }

  function syncSequenceFromAnswerList(index, region) {
    const editableQuestion = getEditableQuestionForRegion(index, region);
    if (!editableQuestion) {
      return;
    }

    const answerList = getSequenceAnswerListFromModal(index);
    editableQuestion.options = answerList;
    editableQuestion.short_answer = buildSequentialAnswerCode(answerList.length);
    sanitizeQuestionByType(editableQuestion);
    updateSequencePreviewInModal(index, editableQuestion);
  }

  function getSequencePreviewText(question) {
    const codes = String(question?.short_answer || "")
      .toUpperCase()
      .replace(/[^A-F]/g, "");

    if (!codes) {
      return "-";
    }

    return codes.split("").join(" - ");
  }

  function getSequencePreviewLabels(question) {
    const options = Array.isArray(question?.options)
      ? question.options.map((item) => String(item || "").trim())
      : [];
    const codes = String(question?.short_answer || "")
      .toUpperCase()
      .replace(/[^A-F]/g, "");

    if (!codes) {
      return "";
    }

    return codes
      .split("")
      .map((code) => {
        const idx = code.charCodeAt(0) - 65;
        const label = options[idx] || "";
        return label ? `${code}: ${label}` : code;
      })
      .join(" | ");
  }

  function updateSequencePreviewInModal(index, question) {
    const codePreviewInput = elements.modalBody.querySelector(
      `input[data-field="sequence_code_preview"][data-index="${index}"]`
    );
    const labelPreview = elements.modalBody.querySelector(
      `[data-field="sequence_label_preview"][data-index="${index}"]`
    );

    if (codePreviewInput instanceof HTMLInputElement) {
      codePreviewInput.value = getSequencePreviewText(question);
    }

    if (labelPreview instanceof HTMLElement) {
      const labelText = getSequencePreviewLabels(question);
      labelPreview.textContent = labelText || "";
      labelPreview.hidden = !labelText;
    }
  }

  function scrambleSequenceOptions(index, region) {
    const editableQuestion = getEditableQuestionForRegion(index, region);
    if (!editableQuestion) {
      return;
    }

    const answerList = getSequenceAnswerListFromModal(index);
    if (answerList.length < 2) {
      setStatus("Add at least two sequence answers before scrambling.", true);
      return;
    }

    const entries = answerList.map((label, position) => ({
      label,
      position
    }));
    const shuffled = [...entries];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    editableQuestion.options = shuffled.map((item) => item.label);
    editableQuestion.short_answer = entries
      .map((item) => {
        const shuffledIndex = shuffled.findIndex((candidate) => candidate.position === item.position);
        return ANSWER_CODES[shuffledIndex] || "";
      })
      .join("");

    sanitizeQuestionByType(editableQuestion);
    refreshCard(index);
    setStatus("Sequence options scrambled.", false);
    openQuestionModal(index, region);
  }

  function buildAnswerEditorMarkup(question, index, region) {
    const typeCode = normalizeTypeCode(question?.type_code);

    if (typeCode === "L") {
      return `
        <div class="card-field">
          <label>Short Answer (single capital letter)</label>
          <input
            data-field="short_answer"
            data-index="${index}"
            data-region="${region}"
            type="text"
            maxlength="1"
            inputmode="text"
            value="${escapeAttr(sanitizeLetterShortAnswer(question.short_answer))}"
          />
        </div>
      `;
    }

    if (typeCode === "N") {
      return `
        <div class="card-field">
          <label>Short Answer (number only)</label>
          <input
            data-field="short_answer"
            data-index="${index}"
            data-region="${region}"
            type="text"
            inputmode="decimal"
            value="${escapeAttr(sanitizeNumberShortAnswer(question.short_answer))}"
          />
        </div>
      `;
    }

    if (typeCode === "M") {
      const options = Array.isArray(question.options) ? question.options.slice(0, MAX_CHOICE_OPTIONS) : [];
      const selectedCode = sanitizeLetterShortAnswer(question.short_answer);
      const radioName = `choice-correct-${index}-${region}`;

      return `
        <div class="card-field">
          <label>Multiple Choice Options</label>
          <div class="choice-editor-list">
            ${ANSWER_CODES.map((code, optionIndex) => {
              const value = options[optionIndex] || "";
              const isChecked = selectedCode === code;
              return `
                <label class="choice-editor-row">
                  <span class="choice-editor-code">${code}</span>
                  <input
                    data-field="choice_option"
                    data-index="${index}"
                    data-region="${region}"
                    data-option-index="${optionIndex}"
                    type="text"
                    value="${escapeAttr(value)}"
                  />
                  <input
                    data-field="choice_correct"
                    data-index="${index}"
                    data-region="${region}"
                    data-option-index="${optionIndex}"
                    data-answer-code="${code}"
                    type="radio"
                    name="${radioName}"
                    ${isChecked ? "checked" : ""}
                    ${value.trim() ? "" : "disabled"}
                  />
                </label>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }

    const sequenceAnswers = getSequenceAnswerList(question);
    const sequenceCodePreview = getSequencePreviewText(question);
    const sequenceLabelPreview = getSequencePreviewLabels(question);

    return `
      <div class="card-field">
        <label>Sequence Answer List (A-F in correct order)</label>
        <div class="choice-editor-list">
          ${ANSWER_CODES.map((code, optionIndex) => {
            const value = sequenceAnswers[optionIndex] || "";
            return `
              <label class="choice-editor-row">
                <span class="choice-editor-code">${code}</span>
                <input
                  data-field="sequence_answer_label"
                  data-index="${index}"
                  data-region="${region}"
                  data-option-index="${optionIndex}"
                  type="text"
                  value="${escapeAttr(value)}"
                />
              </label>
            `;
          }).join("")}
        </div>
        <label>Scramble Sequence</label>
        <input
          data-field="sequence_code_preview"
          data-index="${index}"
          type="text"
          value="${escapeAttr(sequenceCodePreview)}"
          readonly
        />
        <p class="sequence-preview-labels" data-field="sequence_label_preview" data-index="${index}" ${sequenceLabelPreview ? "" : "hidden"}>${escapeHtml(sequenceLabelPreview)}</p>
        <button
          type="button"
          class="secondary"
          data-action="scramble_sequence"
          data-index="${index}"
          data-region="${region}"
        >
          Scramble Sequence
        </button>
      </div>
    `;
  }

  function openQuestionModal(index, region = state.region) {
    const question = getQuestionForRegion(index, region);
    if (!question) {
      return;
    }

    currentModalIndex = index;
    currentModalRegion = region;
    const baseQuestionId = getQuestionIdByIndex(index);

    elements.modalQIndex.textContent = `Q${index + 1} - ${getRegionDisplayLabel(currentModalRegion)}`;
    elements.modalBody.innerHTML = `
      ${buildRegionTabsMarkup(currentModalRegion, {
        field: "region",
        index,
        className: "modal-region-tabs"
      })}
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
      <div class="grid-two">
        <div class="card-field">
          <label>Type Code</label>
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
      <div class="card-field">
        <label>Long Answer</label>
        <input data-field="long_answer" data-index="${index}" data-region="${currentModalRegion}" type="text" value="${escapeAttr(question.long_answer)}" />
      </div>
      ${buildAnswerEditorMarkup(question, index, currentModalRegion)}
      <div class="card-field">
        <label>Difficulty</label>
        <input data-field="difficulty" data-index="${index}" data-region="${currentModalRegion}" type="text" value="${escapeAttr(question.difficulty)}" />
      </div>
    `;

    elements.questionModal.hidden = false;
    updateModalActionButtonLabels(currentModalRegion);
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

  function updateModalActionButtonLabels(region = currentModalRegion) {
    const normalizedRegion = String(region || "").trim().toLowerCase();
    const isAltRegion = normalizedRegion !== DEFAULT_REGION;

    if (elements.deleteModalButton) {
      elements.deleteModalButton.textContent = isAltRegion ? "Delete Alt" : "Delete Question";
    }

    if (elements.closeModalFooterButton) {
      elements.closeModalFooterButton.textContent = isAltRegion ? "Save Alt" : "Done";
    }
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

    const isAltRegion = currentModalRegion !== DEFAULT_REGION;
    const questionLabel = `Q${currentModalIndex + 1} (${getRegionDisplayLabel(currentModalRegion)})`;
    const confirmMessage = isAltRegion
      ? `Delete alt question for ${questionLabel}? This cannot be undone.`
      : `Delete ${questionLabel}? This cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    const idx = currentModalIndex;

    if (isAltRegion) {
      removeAltQuestionByIndex(idx, currentModalRegion);
      currentModalIndex = -1;
      elements.questionModal.hidden = true;
      renderQuestions();
      updateModalNavigationButtons();
      return;
    }

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
      const selectedRegion = String(
        target instanceof HTMLButtonElement ? target.dataset.regionTab : target.value || ""
      ).toLowerCase();
      const nextRegion = REGIONS.includes(selectedRegion) ? selectedRegion : DEFAULT_REGION;
      currentModalRegion = nextRegion;
      openQuestionModal(index, nextRegion);
      return;
    }

    if (field === "uk_only") {
      const nextValue = target.value === "true";
      const editableQuestion = getEditableQuestionForRegion(index, region);
      if (!editableQuestion) {
        return;
      }

      editableQuestion.uk_only = nextValue;

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

    const editableQuestion = getEditableQuestionForRegion(index, region);
    if (!editableQuestion) {
      return;
    }

    if (field === "type_code") {
      editableQuestion.type_code = normalizeTypeCode(target.value);
      sanitizeQuestionByType(editableQuestion);
      refreshCard(index);
      openQuestionModal(index, region);
      return;
    }

    if (field === "short_answer") {
      if (editableQuestion.type_code === "L") {
        editableQuestion.short_answer = sanitizeLetterShortAnswer(target.value);
      } else if (editableQuestion.type_code === "N") {
        editableQuestion.short_answer = sanitizeNumberShortAnswer(target.value);
      } else {
        editableQuestion.short_answer = String(target.value || "");
      }

      target.value = editableQuestion.short_answer;
      refreshCard(index);
      return;
    }

    if (field === "choice_option") {
      const optionIndex = Number(target.dataset.optionIndex);
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= MAX_CHOICE_OPTIONS) {
        return;
      }

      const nextOptions = Array.isArray(editableQuestion.options)
        ? editableQuestion.options.slice(0, MAX_CHOICE_OPTIONS)
        : [];
      nextOptions[optionIndex] = String(target.value || "");
      editableQuestion.options = trimTrailingEmptyOptions(nextOptions)
        .map((item) => item.trim())
        .filter(Boolean);
      editableQuestion.short_answer = sanitizeMultipleChoiceShortAnswer(editableQuestion);

      refreshCard(index);
      return;
    }

    if (field === "choice_correct") {
      if (target instanceof HTMLInputElement && target.checked) {
        editableQuestion.short_answer = sanitizeLetterShortAnswer(target.dataset.answerCode);
      }

      editableQuestion.short_answer = sanitizeMultipleChoiceShortAnswer(editableQuestion);
      refreshCard(index);
      return;
    }

    if (field === "sequence_answer_label") {
      syncSequenceFromAnswerList(index, region);
      refreshCard(index);
      return;
    }

    editableQuestion[field] = target.value;
    sanitizeQuestionByType(editableQuestion);
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
      updateTopRegionTabs(DEFAULT_REGION);
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
      alt_questions: serializeAltQuestions(state.altQuestions)
    };
  }

  async function uploadPack() {
    const pack = getCurrentPack();
    console.log("Quiz pack upload preview:", pack);
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
    elements.regionTabs?.addEventListener("click", (event) => {
      const button = event.target instanceof HTMLElement ? event.target.closest("[data-region-tab]") : null;
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const selectedRegion = String(button.dataset.regionTab || "").toLowerCase();
      state.region = REGIONS.includes(selectedRegion) ? selectedRegion : DEFAULT_REGION;
      updateTopRegionTabs(state.region);
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

    elements.modalBody.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const actionElement = event.target.closest("[data-action]");
      if (!(actionElement instanceof HTMLElement)) {
        return;
      }

      const action = actionElement.dataset.action;
      if (action !== "scramble_sequence") {
        return;
      }

      const index = Number(actionElement.dataset.index);
      const region = actionElement.dataset.region || currentModalRegion;
      if (Number.isNaN(index)) {
        return;
      }

      scrambleSequenceOptions(index, region);
    });

    elements.modalBody.addEventListener("click", (event) => {
      const regionTab = event.target instanceof HTMLElement ? event.target.closest('[data-field="region"][data-region-tab]') : null;
      if (!(regionTab instanceof HTMLButtonElement)) {
        return;
      }

      syncQuestionFromInput(regionTab);
    });

    renderQuestions();
    updateTopRegionTabs(state.region);
    updateModalActionButtonLabels(DEFAULT_REGION);
    updateModalNavigationButtons();
    loadPack();
  }

  initialize();
})();
