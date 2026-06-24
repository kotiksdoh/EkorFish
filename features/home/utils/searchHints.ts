export const SEARCH_HINTS_LIMIT = 5;

export type HintHighlightPart = {
  text: string;
  bold: boolean;
};

type ScoredHint = {
  hint: string;
  score: number;
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

export function filterSearchHints(
  hints: string[],
  query: string,
  limit = SEARCH_HINTS_LIMIT,
): string[] {
  const tokens = getQueryTokens(query);
  if (tokens.length === 0 || hints.length === 0) {
    return [];
  }

  const scored: ScoredHint[] = [];

  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i];
    const lowerHint = hint.toLowerCase();

    if (!tokens.every((token) => lowerHint.includes(token))) {
      continue;
    }

    scored.push({
      hint,
      score: scoreHint(hint, lowerHint, tokens),
    });
  }

  scored.sort((a, b) => a.score - b.score || a.hint.localeCompare(b.hint, "ru"));
  return scored.slice(0, limit).map((item) => item.hint);
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
    const index = lowerHint.indexOf(token);
    if (index === -1) {
      continue;
    }

    ranges.push({ start: index, end: index + token.length });
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
