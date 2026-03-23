(function attachDailyQuizApi(globalScope) {
  const DAILY_QUIZ_QUESTIONS_URL = "https://www.speedquizzing.com/utils/dailyquiz/get_daily_quiz_questions";
  const DAILY_QUIZ_RESULT_URL_BASE = "https://www.speedquizzing.com/utils/dailyquiz/get_daily_quiz_result";

  function normalizeString(value) {
    return String(value || "").trim();
  }

  function mapTypeCode(typeCode) {
    const normalizedCode = normalizeString(typeCode).toUpperCase();

    if (normalizedCode === "M") {
      return "multiple";
    }

    if (normalizedCode === "S") {
      return "sequence";
    }

    if (normalizedCode === "N") {
      return "numbers";
    }

    return "letters";
  }

  function toBase64WithoutPadding(rawValue) {
    return btoa(rawValue).replace(/=+$/g, "");
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }

    return response.json();
  }

  function transformQuestions(apiQuestions) {
    if (!Array.isArray(apiQuestions)) {
      return [];
    }

    return apiQuestions.map((question, index) => {
      const mappedQuestion = {
        id: "question" + String(index + 1),
        type: mapTypeCode(question?.type_code),
        question: normalizeString(question?.q)
      };

      if (Array.isArray(question?.options)) {
        mappedQuestion.choices = question.options.map((option) => normalizeString(option));
      }

      return mappedQuestion;
    });
  }

  async function getDailyQuizQuestions() {
    const payload = await fetchJson(DAILY_QUIZ_QUESTIONS_URL);

    return {
      pack_id: normalizeString(payload?.pack_id),
      uniq_sess_id: normalizeString(payload?.uniq_sess_id),
      questions: transformQuestions(payload?.questions)
    };
  }

  async function getDailyQuizResult(params) {
    const requestPayload = {
      pack_id: normalizeString(params?.pack_id),
      uniq_sess_id: normalizeString(params?.uniq_sess_id),
      question_index: Number.isInteger(params?.question_index) ? params.question_index : 0,
      answer: normalizeString(params?.answer),
      speed: Number.isFinite(params?.speed) ? params.speed : 0
    };

    const encodedPayload = toBase64WithoutPadding(JSON.stringify(requestPayload));
    const resultUrl = DAILY_QUIZ_RESULT_URL_BASE + "/" + encodedPayload;
    console.log("Requesting daily quiz result with URL:", resultUrl, "and payload:", requestPayload);
    const payload = await fetchJson(resultUrl);

    return {
      short_answer: normalizeString(payload?.short_answer),
      long_answer: normalizeString(payload?.long_answer)
    };
  }

  globalScope.DailyQuizApi = {
    getDailyQuizQuestions,
    getDailyQuizResult
  };
}(window));
