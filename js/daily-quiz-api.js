const DAILY_QUIZ_API_URL =
  "https://www.speedquizzing.com/utils/dailyquiz/get_daily_quiz_questions";

const TYPE_MAP = {
  L: "letters",
  M: "multiple",
  S: "sequence",
  N: "numbers"
};

function decodeBase64Utf8(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function transformQuestion(raw, index) {
  const type = TYPE_MAP[raw.type_code] || "letters";
  const answer = decodeBase64Utf8(raw.short_answer);
  const longAnswer = raw.long_answer ? decodeBase64Utf8(raw.long_answer) : "";

  const question = {
    id: `question${index + 1}`,
    type,
    question: raw.q,
    answer
  };

  if (longAnswer) {
    question.longAnswer = longAnswer;
  }

  if (Array.isArray(raw.options) && raw.options.length > 0) {
    question.choices = raw.options;
  }

  return question;
}

export async function fetchDailyQuizQuestions() {
  const response = await fetch(DAILY_QUIZ_API_URL);
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
