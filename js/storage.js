function safeGetStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}

export function generatePlayerUnid() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const targetLength = 28;

  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(targetLength);
    window.crypto.getRandomValues(randomBytes);
    let generated = "";

    for (let idx = 0; idx < targetLength; idx += 1) {
      generated += chars[randomBytes[idx] % chars.length];
    }

    return generated;
  }

  let fallbackValue = "";
  for (let idx = 0; idx < targetLength; idx += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    fallbackValue += chars[randomIndex];
  }

  return fallbackValue;
}

export function getOrCreatePlayerUnid(storageKey) {
  const existingValue = safeGetStorage(storageKey);
  const normalizedExisting = String(existingValue || "").trim();
  if (normalizedExisting) {
    return normalizedExisting;
  }

  const createdUnid = generatePlayerUnid();
  safeSetStorage(storageKey, createdUnid);
  return createdUnid;
}


export function loadSavedProgress(storageKey, totalPossibleScore) {
  const defaultProgress = {
    completed: false,
    submitted: false,
    replayed: false,
    firstScore: 0,
    currentScore: 0,
    currentQuestionIndex: 0,
    totalPossible: totalPossibleScore,
    results: {},
    answerHistory: [],
    completedAt: null,
    submittedAt: null
  };

  const rawValue = safeGetStorage(storageKey);
  if (!rawValue) {
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object") {
      return defaultProgress;
    }

    return {
      completed: Boolean(parsed.completed),
      submitted: Boolean(parsed.submitted),
      replayed: Boolean(parsed.replayed),
      firstScore: Number.isFinite(parsed.firstScore) ? parsed.firstScore : 0,
      currentScore: Number.isFinite(parsed.currentScore) ? parsed.currentScore : 0,
      currentQuestionIndex: Number.isInteger(parsed.currentQuestionIndex) ? parsed.currentQuestionIndex : 0,
      totalPossible: Number.isFinite(parsed.totalPossible) ? parsed.totalPossible : totalPossibleScore,
      results: (parsed.results && typeof parsed.results === "object" && !Array.isArray(parsed.results)) ? parsed.results : {},
      answerHistory: Array.isArray(parsed.answerHistory) ? parsed.answerHistory : [],
      completedAt: parsed.completedAt || null,
      submittedAt: parsed.submittedAt || null
    };
  } catch (error) {
    return defaultProgress;
  }
}

export function persistSavedProgress(storageKey, savedProgress) {
  safeSetStorage(storageKey, JSON.stringify(savedProgress));
}
