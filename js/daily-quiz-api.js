const DAILY_QUIZ_API_BASE_URL =
  "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";

const QUIZ_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const FALLBACK_QUIZ_PACK = {
  pack_date: "2026-01-01",
  questions: [
    {
      id: "47172",
      q: "Which American actor played Ike Turner in the film 'What's Love Got to Do with It' and Morpheus in 'The Matrix'?",
      short_answer: "L",
      long_answer: "Laurence Fishburne",
      type_code: "L"
    },
    {
      id: "881720",
      q: "What type of product is Calgon?",
      short_answer: "B",
      long_answer: "",
      type_code: "M",
      options: [
        "Disinfectant",
        "Water softener",
        "Multi-surface cleaner",
        "Mouthwash"
      ]
    },
    {
      id: "432885",
      q: "What name is given to the second full moon in a month?",
      short_answer: "B",
      long_answer: "Blue Moon",
      type_code: "L"
    },
    {
      id: "895959",
      q: "Sheer, Satin, Matte or Glossy are all finish types of which make-up item?",
      short_answer: "D",
      long_answer: "",
      type_code: "M",
      options: [
        "Blush",
        "Mascara",
        "Concealer",
        "Lipstick"
      ]
    },
    {
      id: "767046",
      q: "How many of the world's top ten highest mountains are located at least partially in Nepal?",
      short_answer: "8",
      long_answer: "8",
      type_code: "N"
    },
    {
      id: "885985",
      q: "Overworld, the Nether and the End are different dimensions in what video game?",
      short_answer: "M",
      long_answer: "Minecraft",
      type_code: "L"
    },
    {
      id: "357572",
      q: "What was the name of the '90s Transformers animated TV series where all the characters could morph into animals?",
      short_answer: "B",
      long_answer: "Beast Wars",
      type_code: "L"
    },
    {
      id: "853264",
      q: "Starting with the earliest, put these Katy Perry albums in order of when they were released.",
      short_answer: "BADC",
      long_answer: "One of the Boys 2008, Teenage Dream 2010, Witness 2017, Smile 2020",
      type_code: "S",
      options: [
        "Teenage Dream",
        "One of the Boys",
        "Smile",
        "Witness"
      ]
    },
    {
      id: "120128",
      q: "When Christianity was banned or persecuted, Christians identified each other without being caught by using the ichthus symbol, which resembles the profile of what creature?",
      short_answer: "F",
      long_answer: "Fish",
      type_code: "L"
    },
    {
      id: "927016",
      q: "Released at Christmas 2024, the latest Wallace & Gromit movie 'Vengeance Most Fowl' featured the return of which villain who first appeared in 'The Wrong Trousers'?",
      short_answer: "F",
      long_answer: "Feathers McGraw",
      type_code: "L"
    }
  ],
  results: {
    total_players: 3,
    average_score: 34,
    score_bands: [
      [6, 1],
      [9, 1],
      [13, 2],
      [15, 1],
      [16, 2],
      [19, 1],
      [20, 1],
      [25, 1],
      [28, 2],
      [31, 1],
      [34, 2],
      [39, 2],
      [40, 1],
      [43, 1],
      [44, 1],
      [49, 2],
      [54, 3],
      [59, 1],
      [63, 1],
      [70, 1]
    ]
  }
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
    question_id: String(question?.question_id || question?.id || "").trim() || `question${index + 1}`,
    typeCode: String(question?.type_code || "L").trim().toUpperCase(),
    question: String(question?.q ?? ""),
    options: Array.isArray(question?.options)
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
  const questions = FALLBACK_QUIZ_PACK.questions.map((rawQuestion, index) => {
    const question = {
      question_id: rawQuestion.id,
      type_code: rawQuestion.type_code,
      q: rawQuestion.q,
      answer: String(rawQuestion.short_answer)
    };

    if (rawQuestion.long_answer) {
      question.longAnswer = String(rawQuestion.long_answer);
    }

    if (rawQuestion.options) {
      question.options = rawQuestion.options;
    }

    return normalizeQuestionRecord(question, index);
  });

  return {
    packDate: String(FALLBACK_QUIZ_PACK.pack_date).trim(),
    questions,
    results: FALLBACK_QUIZ_PACK.results
  };
}

function transformQuestion(raw, index) {
  const answer = decodeBase64Utf8(raw.short_answer);
  const longAnswer = raw.long_answer ? decodeBase64Utf8(raw.long_answer) : "";
  const question = {
    question_id: raw.question_id || raw.id,
    type_code: raw.type_code || "L",
    q: raw.q,
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
    packDate: payload.pack_date,
    questions: payload.questions.map(transformQuestion),
    results: payload.results && typeof payload.results === "object" ? payload.results : null
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

function getLocalQuizDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    packDate: String(payload.pack_date || "01-01-1970").trim(),
    results: payload.results && typeof payload.results === "object" ? payload.results : null,
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
  const quizDate = rawQuizParam && isQuizDateParam(rawQuizParam)
    ? rawQuizParam
    : getLocalQuizDate();

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
