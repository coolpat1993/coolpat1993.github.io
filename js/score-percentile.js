function toValidDateString(dateValue) {
  const normalized = String(dateValue || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function toNormalizedScoreBands(rawScoreBands) {
  if (!Array.isArray(rawScoreBands)) {
    return [];
  }

  return rawScoreBands
    .map((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) {
        return null;
      }

      const score = Number(entry[0]);
      const count = Number(entry[1]);

      if (!Number.isFinite(score) || !Number.isFinite(count) || count <= 0) {
        return null;
      }

      return {
        score,
        count
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);
}

function toNormalizedStats(rawStats, fallbackDate) {
  if (!rawStats || typeof rawStats !== "object") {
    return null;
  }

  const scoreBands = toNormalizedScoreBands(rawStats.score_bands);
  const totalPlayersFromBands = scoreBands.reduce((sum, band) => sum + band.count, 0);

  return {
    packDate: toValidDateString(rawStats.pack_date) || fallbackDate,
    totalPlayers: totalPlayersFromBands,
    scoreBands
  };
}

export function normalizeDailyQuizResultStatsFromPack(pack) {
  if (!pack || typeof pack !== "object") {
    return null;
  }

  const packDate = toValidDateString(pack.packDate || pack.pack_date);
  const results = pack.results && typeof pack.results === "object"
    ? pack.results
    : null;

  if (!results) {
    return null;
  }

  return toNormalizedStats(
    {
      ...results,
      pack_date: packDate || results.pack_date
    },
    packDate
  );
}

function formatPercentValue(percent) {
  if (!Number.isFinite(percent)) {
    return "0";
  }

  const roundedToOneDecimal = Math.round(percent * 10) / 10;
  const isWholeNumber = Math.abs(roundedToOneDecimal - Math.round(roundedToOneDecimal)) < 1e-9;

  return isWholeNumber
    ? String(Math.round(roundedToOneDecimal))
    : roundedToOneDecimal.toFixed(1);
}

export function calculateBetterThanPercentage(score, stats) {
  const normalizedScore = Number(score);

  if (!Number.isFinite(normalizedScore) || !stats || !Array.isArray(stats.scoreBands)) {
    return null;
  }

  const totalPlayers = Number(stats.totalPlayers);
  if (!Number.isFinite(totalPlayers) || totalPlayers <= 0) {
    return null;
  }

  const playersScoredLower = stats.scoreBands.reduce((sum, band) => {
    if (band.score < normalizedScore) {
      return sum + band.count;
    }

    return sum;
  }, 0);

  const percent = (playersScoredLower / totalPlayers) * 100;
  return Math.max(0, Math.min(100, percent));
}

export function buildBetterThanText(score, stats) {
  const percent = calculateBetterThanPercentage(score, stats);
  if (!Number.isFinite(percent)) {
    return "";
  }

  return `You scored better than ${formatPercentValue(percent)}% of players`;
}
