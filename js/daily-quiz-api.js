const DAILY_QUIZ_API_URL =
  "https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_get_questions";

const FALLBACK_QUIZ_PACK = {
  pack_id: "back-up-quiz-pack-1",
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
    packId: String(FALLBACK_QUIZ_PACK.pack_id || "").trim(),
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

export async function fetchDailyQuizQuestions({ signal } = {}) {
  const response = await fetch(DAILY_QUIZ_API_URL, { signal });
  if (!response.ok) {
    throw new Error(`Daily quiz fetch failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  const payload = JSON.parse(decodeBase64Utf8(json.data));

  return {
    packId: payload.pack_id,
    questions: payload.questions.map(transformQuestion)
  };
}
