export interface StatementSegment {
  text: string;
  highlighted: boolean;
}

interface Match {
  start: number;
  end: number;
}

/** Clue phrases sorted longest-first so a longer clue wins over a shorter one inside it. */
function orderedClues(clues: string[]): string[] {
  return [...clues]
    .filter((clue) => clue.length > 0)
    .sort((a, b) => b.length - a.length);
}

function findMatches(statement: string, clues: string[]): Match[] {
  const matches: Match[] = [];
  for (const clue of orderedClues(clues)) {
    let from = 0;
    for (;;) {
      const index = statement.indexOf(clue, from);
      if (index === -1) break;
      matches.push({ start: index, end: index + clue.length });
      from = index + clue.length;
    }
  }
  return matches.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
}

/**
 * Split a problem statement into plain and highlighted runs so the UI can emphasise the
 * operator clues in place. Overlapping clues collapse to the longest match at each
 * position, and text is never lost or duplicated.
 */
export function splitStatement(statement: string, clues: string[]): StatementSegment[] {
  const matches = findMatches(statement, clues);
  const segments: StatementSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) {
      segments.push({ text: statement.slice(cursor, match.start), highlighted: false });
    }
    segments.push({ text: statement.slice(match.start, match.end), highlighted: true });
    cursor = match.end;
  }

  if (cursor < statement.length) {
    segments.push({ text: statement.slice(cursor), highlighted: false });
  }

  return segments;
}
