import { describe, expect, it } from "vitest";

import { grade, parse, resolveWeight, sampleProblems } from "../index.js";
import type { QuizSessionConfig } from "../types.js";
import { PROBLEM_BANK, countByDifficulty } from "./index.js";

describe("problem bank", () => {
  it("has a unique id for every problem", () => {
    expect(new Set(PROBLEM_BANK.map((problem) => problem.id)).size).toBe(PROBLEM_BANK.length);
  });

  it("gives every problem an equivalent SQL statement", () => {
    for (const problem of PROBLEM_BANK) {
      expect(problem.sql, problem.id).toBeTruthy();
    }
  });

  for (const problem of PROBLEM_BANK) {
    describe(problem.id, () => {
      it("parses its reference answer", () => {
        const result = parse(problem.referenceAnswer);
        expect(result.ok, result.ok ? "" : result.error).toBe(true);
      });

      it("grades its reference answer to 100", () => {
        const result = grade(problem, problem.referenceAnswer);
        expect(result.ok).toBe(true);
        expect(result.score).toBe(100);
      });

      it("has 2-3 hints", () => {
        expect(problem.hints.length).toBeGreaterThanOrEqual(2);
        expect(problem.hints.length).toBeLessThanOrEqual(3);
      });

      it("has 3-6 sample documents", () => {
        expect(problem.sampleDocuments.length).toBeGreaterThanOrEqual(3);
        expect(problem.sampleDocuments.length).toBeLessThanOrEqual(6);
      });

      it("has a non-empty rubric with positive weight", () => {
        expect(problem.rubric.length).toBeGreaterThan(0);
        const total = problem.rubric.reduce((sum, item) => sum + resolveWeight(item), 0);
        expect(total).toBeGreaterThan(0);
      });

      it("uses the declared operation family", () => {
        const methodItem = problem.rubric.find((item) => item.expectation.kind === "method");
        expect(methodItem?.expectation.kind).toBe("method");
        if (methodItem?.expectation.kind !== "method") return;
        const allowed =
          problem.operation === "find" ? ["find", "findOne"] : ["updateOne", "updateMany"];
        expect(allowed).toContain(methodItem.expectation.method);
      });

      it("declares clue substrings that occur verbatim in the statement", () => {
        expect(problem.clues.length).toBeGreaterThan(0);
        for (const clue of problem.clues) {
          expect(clue.length, `${problem.id}: empty clue`).toBeGreaterThan(0);
          expect(problem.statement, `${problem.id}: clue not in statement -> ${clue}`).toContain(
            clue,
          );
        }
      });
    });
  }
});

describe("bank size targets", () => {
  it("has thirty problems per difficulty", () => {
    expect(countByDifficulty()).toEqual({ easy: 30, moderate: 30, difficult: 30 });
  });

  it("has ninety problems in total", () => {
    expect(PROBLEM_BANK).toHaveLength(90);
  });

  for (const difficulty of ["easy", "moderate", "difficult"] as const) {
    it(`serves an uncapped random run of thirty ${difficulty} problems`, () => {
      const config: QuizSessionConfig = {
        difficulties: [difficulty],
        count: 30,
        operations: [],
        queryOperators: [],
        updateOperators: [],
      };
      const first = sampleProblems(PROBLEM_BANK, config);
      expect(first.problems).toHaveLength(30);
      expect(first.capped).toBe(false);
      expect(first.problems.every((problem) => problem.difficulty === difficulty)).toBe(true);

      // Two draws should differ, proving the run order is randomised rather than fixed.
      const second = sampleProblems(PROBLEM_BANK, config);
      expect(first.problems.map((problem) => problem.id)).not.toEqual(
        second.problems.map((problem) => problem.id),
      );
    });
  }
});
