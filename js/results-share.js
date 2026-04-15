const POINTS_EMOJI = {
  0: "❌",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
  10: "🔟"
};

export function getPointsEmoji(points) {
  return POINTS_EMOJI[points] || "❌";
}

export function buildShareText({
  score,
  resultEntries,
  shareUrl
}) {
  const heading = `I scored ${score} points!`;
  const breakdown = buildAnswerBreakdownText(resultEntries);
  return `${heading}\n\n${breakdown}\n${shareUrl}`;
}

export function buildCanonicalQuizUrl(packDate = null) {
  const normalizedPackDate = String(packDate || "").trim();
  const shareUrl = new URL("https://coolpat1993.github.io/");

  if (normalizedPackDate) {
    shareUrl.searchParams.set("quiz", normalizedPackDate);
  }

  return shareUrl.toString();
}


export async function shareResults({
  score,
  resultEntries,
  shareUrl = window.location.href
}) {
  const shareText = buildShareText({
    score,
    resultEntries,
    shareUrl
  });

  try {
    await copyTextToClipboard(shareText);
    return { success: true, text: shareText};
  } catch (_) {
    return { success: false, text: shareText };
  }
}

function buildAnswerBreakdownText(resultEntries) {
  return resultEntries
    .map((entry) => getPointsEmoji(entry.earnedPoints))
    .join(" ");
}


export function buildSubmissionPayload({
  gameProgressStorageKey,
  playerUnid,
  score,
  totalPossible,
  resultEntries,
  questions,
  completedAt,
}) {
  const typeCodeById = new Map(
    questions.map((question) => [String(question.question_id), question.typeCode])
  );

  return {
    pack_date: gameProgressStorageKey.split(":").slice(1).join(":"),
    player_unid: playerUnid,
    name: "",
    score,
    total_possible: totalPossible,
    results: resultEntries.map((entry) => {
      const id = entry.questionId;

      return {
        question_id: id,
        type_code: entry.typeCode || typeCodeById.get(String(id)) || null,
        points: entry.earnedPoints,
        timed_out: entry.timedOut
      };
    }),
    completed_at: completedAt
  };
}

export function buildCompletedProgress({
  savedProgress,
  score,
  questionCount,
  totalPossible,
  resultsByQuestionIndex,
  answerHistory,
  completedAt
}) {
  return {
    ...savedProgress,
    completed: true,
    firstScore: score,
    currentScore: score,
    currentQuestionIndex: Math.max(0, questionCount - 1),
    totalPossible,
    results: { ...resultsByQuestionIndex },
    answerHistory: answerHistory.map((entry) => ({ ...entry })),
    completedAt
  };
}

export function buildSubmittedProgress({ savedProgress, submittedAt }) {
  return {
    ...savedProgress,
    submitted: true,
    submittedAt
  };
}

export async function copyTextToClipboard(text) {
  // Try modern Clipboard API first
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err);
    }
  }

  // Fallback for older browsers and mobile devices
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  
  try {
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
    const success = document.execCommand("copy");
    
    if (!success) {
      throw new Error("execCommand('copy') failed");
    }
    
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
}

function encodeJsonPayloadForUrl(payload) {
  const json = JSON.stringify(payload);
  const utf8Bytes = new TextEncoder().encode(json);
  let binary = "";

  utf8Bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll("=", "");
}

export async function postResultsToEndpoint(payload) {
  const encodedPayload = encodeJsonPayloadForUrl(payload);
  const submissionUrl = `https://www.speedquizzing.com/utils/dailyquiz/daily_quiz_submit_results/${encodedPayload}`;

  await fetch(submissionUrl, {
    method: "POST"
  });
}
