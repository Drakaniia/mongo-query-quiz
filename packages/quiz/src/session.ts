import { OPERATION_KINDS, matchesConfig } from "./filters.js";
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
 * Reject structurally impossible configs. Unknown difficulties, operations and non-preset
 * counts are errors; an empty difficulty list means "All".
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
  for (const operation of config.operations) {
    if (!OPERATION_KINDS.includes(operation)) {
      throw new Error(`Unknown operation "${operation}"`);
    }
  }
}

/**
 * Place each group's k-th item at its proportional slot, so a group's items land evenly
 * across the run instead of clumping. With an even split this alternates; with a lopsided
 * one it keeps the minority spread at its natural spacing rather than bunching it at an end.
 * Ties are broken by the RNG so the order stays unpredictable.
 */
function spread(groups: Problem[][], rng: () => number): Problem[] {
  const total = groups.reduce((sum, group) => sum + group.length, 0);
  if (total === 0) return [];

  const placed = groups.flatMap((group) =>
    group.map((problem, k) => ({
      problem,
      slot: ((k + 0.5) * total) / group.length,
      jitter: rng(),
    })),
  );

  placed.sort((a, b) => a.slot - b.slot || a.jitter - b.jitter);
  return placed.map((entry) => entry.problem);
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
  const matches = bank.filter((problem) => matchesConfig(problem, config));
  const availableCount = matches.length;
  const capped = availableCount < config.count;

  // One bucket per difficulty x operation, so both facets stay spread through the run.
  const groups: Problem[][] = activeDifficulties
    .flatMap((difficulty) => OPERATION_KINDS.map((operation) => [difficulty, operation] as const))
    .map(([difficulty, operation]) =>
      shuffle(
        matches.filter(
          (problem) => problem.difficulty === difficulty && problem.operation === operation,
        ),
        rng,
      ),
    )
    .filter((group) => group.length > 0);

  const ordered = spread(groups, rng);

  const problems = capped ? ordered : ordered.slice(0, config.count);

  return { config: { ...config }, problems, capped, availableCount };
}
