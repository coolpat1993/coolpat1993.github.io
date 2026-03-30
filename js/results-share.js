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
  totalPossible,
  resultEntries,
  shareUrl
}) {
  const heading = `I scored ${score}/${totalPossible}`;
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

export function normalizeAddressBarUrl() {
  if (!window.history?.replaceState) {
    return;
  }

  const canonicalUrl = buildCanonicalQuizUrl();
  if (canonicalUrl !== window.location.href) {
    window.history.replaceState(window.history.state, "", canonicalUrl);
  }
}

export async function shareResults({
  score,
  totalPossible,
  resultEntries,
  shareTitle = "SpeedQuizzing score",
  shareUrl = window.location.href
}) {
  const shareText = buildShareText({
    score,
    totalPossible,
    resultEntries,
    shareUrl
  });
  const shareData = {
    title: shareTitle,
    text: shareText
  };

  if (navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({
          title: shareData.title,
          text: shareData.text
        });
      }
      return true;
    } catch (error) {
      if (error?.name === "AbortError") {
        return false;
      }
    }
  }

  try {
    await copyTextToClipboard(shareText);
    return true;
  } catch (_) {
    return false;
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
    questions.map((question) => [String(question.id), question.typeCode])
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
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = text;
  fallbackInput.setAttribute("readonly", "readonly");
  fallbackInput.style.position = "fixed";
  fallbackInput.style.top = "-1000px";
  fallbackInput.style.left = "-1000px";
  document.body.appendChild(fallbackInput);
  fallbackInput.focus();
  fallbackInput.select();

  let didCopy = false;
  try {
    didCopy = document.execCommand("copy");
  } finally {
    document.body.removeChild(fallbackInput);
  }

  if (!didCopy) {
    throw new Error("Clipboard copy failed");
  }

  return true;
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

  console.log("Submitting results to", submissionUrl);

  await fetch(submissionUrl, {
    method: "POST"
  });
}
