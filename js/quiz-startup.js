function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchQuestionsWithTimeout(fetchQuestions, timeoutMs) {
  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchQuestions({ signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Daily quiz request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

export async function fetchQuizPackWithRetry({
  fetchQuestions,
  setStartupStatus,
  timeoutMs = 8000,
  maxAttempts = 2,
  retryDelayMs = 450
}) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (attempt > 1 && typeof setStartupStatus === "function") {
        setStartupStatus(`Retrying daily quiz (${attempt}/${maxAttempts})...`);
      }

      const result = await fetchQuestionsWithTimeout(fetchQuestions, timeoutMs);
      return { result, usedFallbackPack: false, lastError: null };
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await sleep(retryDelayMs);
      }
    }
  }

  return { result: null, usedFallbackPack: true, lastError };
}
