export const SEARCH_HINTS_LIMIT = 5;

export type HintHighlightPart = {
  text: string;
  bold: boolean;
};

type ScoredHint = {
  hint: string;
  score: number;
};

export type SearchHintsIndex = {
  hints: string[];
  lowerHints: string[];
};

function mergeRanges(
  ranges: { start: number; end: number }[],
): { start: number; end: number }[] {
  if (ranges.length === 0) {
    return [];
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function getQueryTokens(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function scoreHint(hint: string, lowerHint: string, tokens: string[]): number {
  const firstToken = tokens[0];
  const firstIndex = lowerHint.indexOf(firstToken);
  let score = firstIndex >= 0 ? firstIndex : Number.MAX_SAFE_INTEGER;

  if (lowerHint.startsWith(tokens.join(" "))) {
    score -= 2000;
  } else if (lowerHint.startsWith(firstToken)) {
    score -= 1000;
  }

  score += hint.length / 1000;
  return score;
}

function compareScoredHints(a: ScoredHint, b: ScoredHint): number {
  return a.score - b.score || a.hint.localeCompare(b.hint, "ru");
}

function pushTopScored(
  top: ScoredHint[],
  candidate: ScoredHint,
  limit: number,
): void {
  if (top.length < limit) {
    top.push(candidate);
    if (top.length === limit) {
      top.sort(compareScoredHints);
    }
    return;
  }

  const worst = top[top.length - 1];
  if (compareScoredHints(candidate, worst) >= 0) {
    return;
  }

  top[limit - 1] = candidate;
  top.sort(compareScoredHints);
}

export function createSearchHintsIndex(
  hints: string[],
  lowerHints?: string[],
): SearchHintsIndex {
  const normalizedLowerHints =
    lowerHints && lowerHints.length === hints.length
      ? lowerHints
      : hints.map((hint) => hint.toLowerCase());

  return {
    hints,
    lowerHints: normalizedLowerHints,
  };
}

function getCandidateIndices(
  index: SearchHintsIndex,
  tokens: string[],
): number[] {
  if (tokens.length === 0) {
    return [];
  }

  const candidates: number[] = [];

  for (let hintIndex = 0; hintIndex < index.hints.length; hintIndex++) {
    const lowerHint = index.lowerHints[hintIndex];

    if (tokens.every((token) => lowerHint.includes(token))) {
      candidates.push(hintIndex);
    }
  }

  return candidates;
}

export function filterSearchHintsFromIndex(
  index: SearchHintsIndex,
  query: string,
  limit = SEARCH_HINTS_LIMIT,
): string[] {
  const tokens = getQueryTokens(query);
  if (tokens.length === 0 || index.hints.length === 0) {
    return [];
  }

  const candidateIndices = getCandidateIndices(index, tokens);
  const top: ScoredHint[] = [];

  for (let i = 0; i < candidateIndices.length; i++) {
    const hintIndex = candidateIndices[i];
    const hint = index.hints[hintIndex];
    const lowerHint = index.lowerHints[hintIndex];

    pushTopScored(
      top,
      {
        hint,
        score: scoreHint(hint, lowerHint, tokens),
      },
      limit,
    );
  }

  return top.map((item) => item.hint);
}

export function filterSearchHints(
  hints: string[],
  query: string,
  limit = SEARCH_HINTS_LIMIT,
  lowerHints?: string[],
): string[] {
  return filterSearchHintsFromIndex(
    createSearchHintsIndex(hints, lowerHints),
    query,
    limit,
  );
}

export function getHintHighlightParts(
  hint: string,
  query: string,
): HintHighlightPart[] {
  const tokens = getQueryTokens(query);
  if (tokens.length === 0) {
    return [{ text: hint, bold: false }];
  }

  const lowerHint = hint.toLowerCase();
  const ranges: { start: number; end: number }[] = [];

  for (const token of tokens) {
    const tokenIndex = lowerHint.indexOf(token);
    if (tokenIndex === -1) {
      continue;
    }

    ranges.push({ start: tokenIndex, end: tokenIndex + token.length });
  }

  const merged = mergeRanges(ranges);
  if (merged.length === 0) {
    return [{ text: hint, bold: false }];
  }

  const parts: HintHighlightPart[] = [];
  let cursor = 0;

  for (const range of merged) {
    if (range.start > cursor) {
      parts.push({ text: hint.slice(cursor, range.start), bold: false });
    }

    parts.push({ text: hint.slice(range.start, range.end), bold: true });
    cursor = range.end;
  }

  if (cursor < hint.length) {
    parts.push({ text: hint.slice(cursor), bold: false });
  }

  return parts;
}
