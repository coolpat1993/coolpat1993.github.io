(function () {
  const DAILY_QUIZ_BASE_URL = "https://www.speedquizzing.com/utils/ajax/get_daily_quiz_question";

  function buildEndpoint(pathSuffix = "") {
    return `${DAILY_QUIZ_BASE_URL}${pathSuffix}`;
  }

  function mapTypeCode(typeCode) {
    const normalizedTypeCode = String(typeCode || "").trim().toUpperCase();

    if (normalizedTypeCode === "L") {
      return "letters";
    }

    if (normalizedTypeCode === "N") {
      return "numbers";
    }

    if (normalizedTypeCode === "M") {
      return "multiple";
    }

    return "letters";
  }

  function getChoiceList(questionPayload) {
    if (Array.isArray(questionPayload.choices)) {
      return questionPayload.choices;
    }

    if (Array.isArray(questionPayload.options)) {
      return questionPayload.options;
    }

    return [];
  }

  function normalizeQuestion(questionPayload, index) {
    return {
      id: `question${index + 1}`,
      type: mapTypeCode(questionPayload.type_code),
      question: String(questionPayload.q || "").trim(),
      answer: String(questionPayload.short_answer || "").trim(),
      longAnswer: String(questionPayload.long_answer || "").trim(),
      choices: getChoiceList(questionPayload)
    };
  }

  async function fetchJson(url) {
    const response = await window.fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Daily quiz request failed with status ${response.status}`);
    }

    return response.json();
  }

  async function loadDailyQuizQuestionSet() {
    const quizMeta = await fetchJson(buildEndpoint("/"));
    const totalQuestions = Number.parseInt(quizMeta.total_questions, 10);

    if (!quizMeta.pack_id || !Number.isInteger(totalQuestions) || totalQuestions <= 0) {
      throw new Error("Daily quiz metadata was incomplete.");
    }

    const questionRequests = Array.from({ length: totalQuestions }, (_, index) => (
      fetchJson(buildEndpoint(`/${index}`))
    ));

    const questionPayloads = await Promise.all(questionRequests);

    return {
      unid: String(quizMeta.pack_id).trim(),
      questions: questionPayloads.map((questionPayload, index) => normalizeQuestion(questionPayload, index))
    };
  }

  window.dailyQuizApi = {
    loadDailyQuizQuestionSet
  };
})();