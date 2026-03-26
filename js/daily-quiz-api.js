const DAILY_QUIZ_API_BASE_URL =
  "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";

const QUIZ_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const FALLBACK_QUIZ_PACK = {
  pack_date: "back-up-quiz-pack-1",
  questions: [
    {
      id: "question1",
      type_code: "M",
      question: "Which of the following actors stars in the film 'Inception'?",
      choices: [
        "Matt Damon",
        "Brad Pitt",
        "Keanu Reeves",
        "Leonardo DiCaprio"
      ],
      answer: "D"
    },
    {
      id: "question2",
      type_code: "N",
      question: "How many lanes are there on an Olympic athletics track?",
      answer: "8",
      longAnswer: "8"
    },
    {
      id: "question3",
      type_code: "L",
      question: "In which city did the first 'Hard Rock Cafe' open?",
      answer: "L",
      longAnswer: "London"
    },
    {
      id: "question4",
      type_code: "N",
      question: "What is 102 x 5?",
      answer: "510",
      longAnswer: "510"
    },
    {
      id: "question5",
      type_code: "M",
      question: "At the start of a game of chess, who moves first?",
      choices: [
        "White",
        "Black"
      ],
      answer: "A"
    },
    {
      id: "question6",
      type_code: "L",
      question: "In Greek mythology, who was the father and king of the gods?",
      answer: "Z",
      longAnswer: "Zeus"
    },
    {
      id: "question7",
      type_code: "M",
      question: "For how many years must Scotch whisky be aged in oak casks before it can legally be sold in the UK?",
      choices: [
        "3",
        "6",
        "9"
      ],
      answer: "A"
    },
    {
      id: "question8",
      type_code: "L",
      question: "What is the capital city of Norway?",
      answer: "O",
      longAnswer: "Oslo"
    },
    {
      id: "question9",
      type_code: "M",
      question: "In which country was the composer Chopin born?",
      choices: [
        "Poland",
        "Austria",
        "Italy",
        "Denmark"
      ],
      answer: "A"
    },
    {
      id: "question10",
      type_code: "L",
      question: "Which term for a hired detective is also the name of a popular satirical magazine?",
      answer: "P",
      longAnswer: "Private Eye"
    }
  ]
};

function decodeBase64Utf8(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function normalizeQuestionRecord(question, index) {
  return {
    ...question,
    id: String(question?.id || "").trim() || `question${index + 1}`,
    typeCode: String(question?.typeCode || question?.type_code || "L").trim().toUpperCase(),
    question: String(question?.question ?? question?.q ?? ""),
    choices: Array.isArray(question?.choices)
      ? question.choices
      : Array.isArray(question?.options)
      ? question.options
      : undefined
  };
}

export function normalizeQuestionSet(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((question, index) => normalizeQuestionRecord(question, index));
}

export function getFallbackQuizPack() {
  return {
    packId: String(FALLBACK_QUIZ_PACK.pack_date || "").trim(),
    questions: normalizeQuestionSet(FALLBACK_QUIZ_PACK.questions)
  };
}

function transformQuestion(raw, index) {
  const answer = decodeBase64Utf8(raw.short_answer);
  const longAnswer = raw.long_answer ? decodeBase64Utf8(raw.long_answer) : "";
  const question = {
    id: raw.id,
    type_code: raw.type_code || "L",
    question: raw.q,
    answer
  };

  if (longAnswer) {
    question.longAnswer = longAnswer;
  }

  if (Array.isArray(raw.options) && raw.options.length > 0) {
    question.options = raw.options;
  }

  return normalizeQuestionRecord(question, index);
}

async function fetchDailyQuizQuestions({ signal, quizDate = null } = {}) {
  const response = await fetch(getDailyQuizApiUrl(quizDate), { signal });
  if (!response.ok) {
    throw new Error(`Daily quiz fetch failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  const payload = JSON.parse(decodeBase64Utf8(json.data));

  return {
    packId: payload.pack_date,
    questions: payload.questions.map(transformQuestion)
  };
}

function getRawQuizParam() {
  const params = new URLSearchParams(window.location.search);
  const rawQuizParam = params.get("quiz");
  if (!rawQuizParam) {
    return null;
  }

  return String(rawQuizParam).trim() || null;
}

function isQuizDateParam(value) {
  return QUIZ_DATE_REGEX.test(String(value || "").trim());
}

function getDailyQuizApiUrl(quizDate = null) {
  if (!quizDate) {
    return DAILY_QUIZ_API_BASE_URL;
  }

  return `${DAILY_QUIZ_API_BASE_URL}/${quizDate}`;
}

function getQuizParamPack(rawQuizParam) {
  if (!rawQuizParam) {
    return null;
  }


  // Support both standard base64 and URL-safe base64 (- → +, _ → /)
  const base64 = rawQuizParam.replace(/-/g, "+").replace(/_/g, "/");
  const payload = JSON.parse(decodeBase64Utf8(base64));

  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  return {
    packId: String(payload.pack_date || "url-param-quiz").trim(),
    questions: questions.map((q, index) =>
      // Raw API format (has short_answer) vs pre-normalized format
      q.short_answer !== undefined
        ? transformQuestion(q, index)
        : normalizeQuestionRecord(q, index)
    )
  };
}

async function fetchWithTimeout(fetchFn, timeoutMs) {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchFn({ signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Daily quiz request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

export async function loadDailyQuizPack({
  setStartupStatus,
  timeoutMs = 8000,
  maxAttempts = 2,
  retryDelayMs = 450
} = {}) {
  const rawQuizParam = getRawQuizParam();

  if (rawQuizParam && !isQuizDateParam(rawQuizParam)) {
    try {
      const urlPack = getQuizParamPack(rawQuizParam);
      if (urlPack) {
        return { pack: urlPack, usedFallbackPack: false, lastError: null };
      }
    } catch (error) {
      return {
        pack: getFallbackQuizPack(),
        usedFallbackPack: true,
        lastError: error
      };
    }
  }

  let lastError = null;
  const quizDate = rawQuizParam && isQuizDateParam(rawQuizParam) ? rawQuizParam : null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (attempt > 1 && typeof setStartupStatus === "function") {
        setStartupStatus(`Retrying daily quiz (${attempt}/${maxAttempts})...`);
      }

      const result = await fetchWithTimeout(
        ({ signal }) => fetchDailyQuizQuestions({ signal, quizDate }),
        timeoutMs
      );
      return { pack: result, usedFallbackPack: false, lastError: null };
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await sleep(retryDelayMs);
      }
    }
  }

  return {
    pack: getFallbackQuizPack(),
    usedFallbackPack: true,
    lastError
  };
}
