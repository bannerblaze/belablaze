/**
 * Lightweight fuzzy match scoring + highlight ranges.
 * Style: subsequence match with bonuses for consecutive runs, word boundaries
 * and case match. Returns `null` when the query doesn't subsequence-match.
 *
 * Approach: scan haystack left to right, consuming query chars in order.
 * Boost for: consecutive matches, matches after a separator, exact case match.
 */

export type FuzzyResult = {
  score: number;
  matches: number[]; // indexes in the haystack that matched the query
};

const SEPARATORS = /[\s\-_./,]/;

export function fuzzyMatch(query: string, haystack: string): FuzzyResult | null {
  if (!query) return { score: 0, matches: [] };
  const q = query.toLowerCase();
  const h = haystack.toLowerCase();
  if (q.length > h.length) return null;

  const matches: number[] = [];
  let score = 0;
  let qIdx = 0;
  let prevMatchIdx = -2;

  for (let i = 0; i < h.length && qIdx < q.length; i++) {
    if (h[i] !== q[qIdx]) continue;

    matches.push(i);

    let bonus = 1;
    // consecutive run bonus
    if (i === prevMatchIdx + 1) bonus += 2;
    // word-start bonus
    if (i === 0 || SEPARATORS.test(h[i - 1])) bonus += 3;
    // case match bonus
    if (haystack[i] === query[qIdx]) bonus += 0.5;

    score += bonus;
    prevMatchIdx = i;
    qIdx++;
  }

  if (qIdx < q.length) return null;

  // length penalty: prefer shorter haystacks for same match
  score -= h.length * 0.01;
  return { score, matches };
}

/**
 * Splits the haystack into segments, marking which were matched by `fuzzyMatch`.
 * Suitable for rendering highlighted text in JSX.
 */
export function highlightSegments(haystack: string, matches: number[]): Array<{ text: string; match: boolean }> {
  if (!matches.length) return [{ text: haystack, match: false }];
  const result: Array<{ text: string; match: boolean }> = [];
  const matchSet = new Set(matches);

  let i = 0;
  while (i < haystack.length) {
    const isMatch = matchSet.has(i);
    let j = i;
    while (j < haystack.length && matchSet.has(j) === isMatch) j++;
    result.push({ text: haystack.slice(i, j), match: isMatch });
    i = j;
  }
  return result;
}
