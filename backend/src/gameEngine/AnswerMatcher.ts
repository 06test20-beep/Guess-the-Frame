// ─────────────────────────────────────────────────────────────────────────────
//  Fuzzy Answer Matcher — server-side only
//  Validates a player's guess against the correct answer + aliases.
//  Never called on the client; never exposes secret data.
// ─────────────────────────────────────────────────────────────────────────────

/** Normalize a string for comparison: lowercase, trim, collapse spaces, strip punctuation */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ');
}

/**
 * Levenshtein distance between two strings.
 * Returns the edit distance (integer).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Similarity ratio: 1.0 = identical, 0.0 = completely different.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return (maxLen - levenshtein(a, b)) / maxLen;
}

export type MatchResult =
  | { matched: true; isNearMiss: false }
  | { matched: false; isNearMiss: true }
  | { matched: false; isNearMiss: false };

/**
 * Check if a player's guess matches the correct answer or any alias.
 *
 * Matching pipeline (per spec §18):
 * 1. Trim whitespace
 * 2. Lowercase/normalize case
 * 3. Normalize punctuation
 * 4. Normalize repeated whitespace
 * 5. Exact normalized comparison
 * 6. Check normalized aliases
 * 7. Strict fuzzy comparison (≥ 0.82 similarity threshold)
 * 8. Near-miss range: 0.65–0.82 (notify player without revealing answer)
 *
 * For numeric year questions, use exact numeric matching only.
 */
export function checkGuess(
  guess: string,
  correctAnswer: string,
  aliases: string[],
  questionType: string,
): MatchResult {
  if (!guess || !guess.trim()) return { matched: false, isNearMiss: false };

  // Year questions: numeric exact match only
  if (questionType === 'frame' && /^\d{4}$/.test(correctAnswer)) {
    const guessYear = guess.trim().replace(/\D/g, '');
    const matched = guessYear === correctAnswer;
    return matched
      ? { matched: true, isNearMiss: false }
      : { matched: false, isNearMiss: false };
  }

  const normGuess = normalize(guess);
  const normAnswer = normalize(correctAnswer);

  // 1. Exact normalized match
  if (normGuess === normAnswer) return { matched: true, isNearMiss: false };

  // 2. Check aliases
  for (const alias of aliases) {
    if (normGuess === normalize(alias)) return { matched: true, isNearMiss: false };
  }

  // 3. Fuzzy match against answer
  const answerSim = similarity(normGuess, normAnswer);
  if (answerSim >= 0.82) return { matched: true, isNearMiss: false };

  // 4. Fuzzy match against aliases
  for (const alias of aliases) {
    const aliasSim = similarity(normGuess, normalize(alias));
    if (aliasSim >= 0.82) return { matched: true, isNearMiss: false };
  }

  // 5. Near-miss (close but not enough)
  if (answerSim >= 0.65) return { matched: false, isNearMiss: true };
  for (const alias of aliases) {
    if (similarity(normGuess, normalize(alias)) >= 0.65) {
      return { matched: false, isNearMiss: true };
    }
  }

  return { matched: false, isNearMiss: false };
}
