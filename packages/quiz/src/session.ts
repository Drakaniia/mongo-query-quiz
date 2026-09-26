import type { Difficulty, Problem, QuizSession, QuizSessionConfig } from "./types.js";

export const COUNT_PRESETS = [5, 10, 15, 30] as const;
export const DIFFICULTIES: readonly Difficulty[] = ["easy", "moderate", "difficult"];

/** Fisher-Yates shuffle using an injectable RNG for deterministic tests. */
export function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i] as T;
    const b = result[j] as T;
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/**
 * Reject structurally impossible configs. Unknown difficulties and non-preset counts
 * are errors; an empty difficulty list means "All".
 */
export function validateConfig(config: QuizSessionConfig): void {
  if (!COUNT_PRESETS.includes(config.count as (typeof COUNT_PRESETS)[number])) {
    throw new Error(`Invalid count ${config.count}; expected 5, 10, 15 or 30`);
  }
  for (const difficulty of config.difficulties) {
    if (!DIFFICULTIES.includes(difficulty)) {
      throw new Error(`Unknown difficulty "${difficulty}"`);
    }
  }
}

function matchesDifficulty(problem: Problem, difficulties: Difficulty[]): boolean {
  if (difficulties.length === 0) return true;
  return difficulties.includes(problem.difficulty);
}

/** Round-robin across difficulty buckets so a mixed run does not feel blocked. */
function interleave(groups: Problem[][]): Problem[] {
  const active = groups.filter((group) => group.length > 0);
  const result: Problem[] = [];
  let index = 0;
  while (active.some((group) => group.length > index)) {
    for (const group of active) {
      const item = group[index];
      if (item) result.push(item);
    }
    index += 1;
  }
  return result;
}

/**
 * Resolve a session config against a problem bank: filter, sample, and order.
 * Pure and deterministic given the same RNG.
 */
export function sampleProblems(
  bank: Problem[],
  config: QuizSessionConfig,
  rng: () => number = Math.random,
): QuizSession {
  validateConfig(config);

  const activeDifficulties =
    config.difficulties.length === 0
      ? [...DIFFICULTIES]
      : DIFFICULTIES.filter((d) => config.difficulties.includes(d));
  const matches = bank.filter((problem) => matchesDifficulty(problem, config.difficulties));
  const availableCount = matches.length;
  const capped = availableCount < config.count;

  // Shuffle within each difficulty, then interleave across difficulties.
  const groups: Problem[][] = activeDifficulties
    .map((difficulty) =>
      shuffle(
        matches.filter((problem) => problem.difficulty === difficulty),
        rng,
      ),
    )
    .filter((group) => group.length > 0);

  const firstGroup = groups[0];
  const ordered: Problem[] =
    groups.length <= 1 ? (firstGroup ?? []) : interleave(groups);

  const problems = capped ? ordered : ordered.slice(0, config.count);

  return { config: { ...config }, problems, capped, availableCount };
}
