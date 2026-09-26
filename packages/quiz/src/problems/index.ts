import type { Difficulty, Problem } from "../types.js";
import { difficultProblems } from "./difficult.js";
import { easyProblems } from "./easy.js";
import { moderateProblems } from "./moderate.js";

export { easyProblems, moderateProblems, difficultProblems };

/** The full problem bank: 30 problems per difficulty, 90 total. */
export const PROBLEM_BANK: Problem[] = [
  ...easyProblems,
  ...moderateProblems,
  ...difficultProblems,
];

export function getProblemById(id: string): Problem | undefined {
  return PROBLEM_BANK.find((problem) => problem.id === id);
}

export function getProblemsByDifficulty(difficulty: Difficulty): Problem[] {
  return PROBLEM_BANK.filter((problem) => problem.difficulty === difficulty);
}

export function countByDifficulty(): Record<Difficulty, number> {
  return {
    easy: easyProblems.length,
    moderate: moderateProblems.length,
    difficult: difficultProblems.length,
  };
}
