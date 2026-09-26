import { describe, expect, it } from "vitest";

import { sampleProblems, validateConfig } from "./session.js";
import type { Difficulty, Problem, QuizSessionConfig } from "./types.js";

function makeProblem(id: string, difficulty: Difficulty): Problem {
  return {
    id,
    title: id,
    difficulty,
    operation: "find",
    statement: "s",
    clues: ["s"],
    collection: "c",
    sampleDocuments: [],
    hints: ["a", "b"],
    referenceAnswer: "db.c.find({})",
    rubric: [],
  };
}

const bank: Problem[] = [
  makeProblem("e1", "easy"),
  makeProblem("e2", "easy"),
  makeProblem("e3", "easy"),
  makeProblem("e4", "easy"),
  makeProblem("e5", "easy"),
  makeProblem("m1", "moderate"),
  makeProblem("m2", "moderate"),
  makeProblem("m3", "moderate"),
  makeProblem("m4", "moderate"),
  makeProblem("m5", "moderate"),
  makeProblem("d1", "difficult"),
  makeProblem("d2", "difficult"),
  makeProblem("d3", "difficult"),
  makeProblem("d4", "difficult"),
  makeProblem("d5", "difficult"),
];

function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const config = (overrides: Partial<QuizSessionConfig>): QuizSessionConfig => ({
  difficulties: [],
  count: 5,
  ...overrides,
});

describe("sampleProblems", () => {
  it("filters to a single difficulty", () => {
    const session = sampleProblems(bank, config({ difficulties: ["easy"] }), seeded(1));
    expect(session.problems).toHaveLength(5);
    expect(session.problems.every((problem) => problem.difficulty === "easy")).toBe(true);
    expect(session.capped).toBe(false);
    expect(session.availableCount).toBe(5);
  });

  it("honors each count preset", () => {
    expect(sampleProblems(bank, config({ count: 5 }), seeded(2)).problems).toHaveLength(5);
    expect(sampleProblems(bank, config({ count: 10 }), seeded(2)).problems).toHaveLength(10);
    expect(sampleProblems(bank, config({ count: 15 }), seeded(2)).problems).toHaveLength(15);
  });

  it("caps when fewer problems match than requested", () => {
    const session = sampleProblems(bank, config({ difficulties: ["easy"], count: 15 }), seeded(3));
    expect(session.capped).toBe(true);
    expect(session.problems).toHaveLength(5);
    expect(session.availableCount).toBe(5);
  });

  it("interleaves difficulties in a mixed run", () => {
    const session = sampleProblems(
      bank,
      config({ difficulties: ["easy", "moderate", "difficult"], count: 5 }),
      seeded(4),
    );
    const firstThree = session.problems.slice(0, 3).map((problem) => problem.difficulty);
    expect(new Set(firstThree).size).toBe(3);
  });

  it("is deterministic for a fixed RNG seed", () => {
    const a = sampleProblems(bank, config({ count: 10 }), seeded(42));
    const b = sampleProblems(bank, config({ count: 10 }), seeded(42));
    expect(a.problems.map((problem) => problem.id)).toEqual(b.problems.map((problem) => problem.id));
  });

  it("does not repeat problems", () => {
    const session = sampleProblems(bank, config({ count: 15 }), seeded(5));
    expect(new Set(session.problems.map((problem) => problem.id)).size).toBe(15);
  });
});

describe("validateConfig", () => {
  it("rejects non-preset counts", () => {
    expect(() => validateConfig(config({ count: 7 }))).toThrow(/Invalid count/);
  });

  it("rejects unknown difficulties", () => {
    expect(() => validateConfig(config({ difficulties: ["impossible" as Difficulty] }))).toThrow(
      /Unknown difficulty/,
    );
  });

  it("accepts an empty difficulty list as All", () => {
    expect(() => validateConfig(config({ difficulties: [] }))).not.toThrow();
  });
});
