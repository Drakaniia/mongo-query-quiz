import { describe, expect, it } from "vitest";

import { sampleProblems, validateConfig } from "./session.js";
import type {
  Difficulty,
  Expectation,
  OperationKind,
  Problem,
  QuizSessionConfig,
  RubricItem,
} from "./types.js";

function makeProblem(
  id: string,
  difficulty: Difficulty,
  operation: OperationKind = "find",
  rubric: RubricItem[] = [],
): Problem {
  return {
    id,
    title: id,
    difficulty,
    operation,
    statement: "s",
    clues: ["s"],
    collection: "c",
    sampleDocuments: [],
    hints: ["a", "b"],
    referenceAnswer: "db.c.find({})",
    rubric,
  };
}

function item(id: string, expectation: Expectation): RubricItem {
  return { id, label: "r", expectation };
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
  operations: [],
  queryOperators: [],
  updateOperators: [],
  ...overrides,
});

const mixedBank: Problem[] = [
  makeProblem("f-in", "easy", "find", [
    item("a", { kind: "filter", doc: { status: { $in: ["a"] } } }),
  ]),
  makeProblem("f-or", "easy", "find", [
    item("a", { kind: "filter", doc: { $or: [{ a: { $lt: 1 } }] } }),
  ]),
  makeProblem("f-plain", "easy", "find", [item("a", { kind: "filter", doc: { status: "a" } })]),
  makeProblem("u-set", "easy", "update", [item("a", { kind: "update", doc: { $set: { a: 1 } } })]),
  makeProblem("u-inc", "easy", "update", [item("a", { kind: "update", doc: { $inc: { a: 1 } } })]),
];

/** Ten problems in one operation, five in the other, inside a single difficulty. */
const lopsidedBank: Problem[] = [
  ...Array.from({ length: 10 }, (_, i) => makeProblem(`sf${i}`, "easy", "find")),
  ...Array.from({ length: 5 }, (_, i) => makeProblem(`su${i}`, "easy", "update")),
];

/** An even find/update split inside a single difficulty. */
const balancedBank: Problem[] = [
  ...Array.from({ length: 5 }, (_, i) => makeProblem(`bf${i}`, "easy", "find")),
  ...Array.from({ length: 5 }, (_, i) => makeProblem(`bu${i}`, "easy", "update")),
];

/** Two problems in each of the four difficulty x operation buckets. */
const fourWayBank: Problem[] = [
  makeProblem("ef1", "easy", "find"),
  makeProblem("ef2", "easy", "find"),
  makeProblem("eu1", "easy", "update"),
  makeProblem("eu2", "easy", "update"),
  makeProblem("mf1", "moderate", "find"),
  makeProblem("mf2", "moderate", "find"),
  makeProblem("mu1", "moderate", "update"),
  makeProblem("mu2", "moderate", "update"),
];

/** Length of the longest run of consecutive items sharing one operation. */
function longestOperationRun(problems: Problem[]): number {
  let longest = 0;
  let run = 0;
  let previous: OperationKind | undefined;
  for (const problem of problems) {
    run = problem.operation === previous ? run + 1 : 1;
    previous = problem.operation;
    if (run > longest) longest = run;
  }
  return longest;
}

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
    expect(a.problems.map((problem) => problem.id)).toEqual(
      b.problems.map((problem) => problem.id),
    );
  });

  it("does not repeat problems", () => {
    const session = sampleProblems(bank, config({ count: 15 }), seeded(5));
    expect(new Set(session.problems.map((problem) => problem.id)).size).toBe(15);
  });
});

describe("sampleProblems operation spread", () => {
  it("never repeats an operation twice in a row when the split is even", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const session = sampleProblems(balancedBank, config({ count: 10 }), seeded(seed));
      expect(longestOperationRun(session.problems), `seed ${seed}`).toBeLessThanOrEqual(2);
    }
  });

  it("keeps a lopsided operation mix from bunching into a long run", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const session = sampleProblems(lopsidedBank, config({ count: 15 }), seeded(seed));
      expect(longestOperationRun(session.problems), `seed ${seed}`).toBeLessThanOrEqual(4);
    }
  });

  it("surfaces a rare operation in the opening third of a lopsided run", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const session = sampleProblems(lopsidedBank, config({ count: 15 }), seeded(seed));
      const opening = session.problems.slice(0, 5);
      expect(
        opening.some((problem) => problem.operation === "update"),
        `seed ${seed} opened with ${opening.map((p) => p.operation).join(",")}`,
      ).toBe(true);
    }
  });

  it("does not end a lopsided run with every rare operation", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const session = sampleProblems(lopsidedBank, config({ count: 15 }), seeded(seed));
      const closing = session.problems.slice(-5);
      expect(
        closing.some((problem) => problem.operation === "find"),
        `seed ${seed}`,
      ).toBe(true);
    }
  });

  it("interleaves difficulty and operation together in a mixed run", () => {
    const session = sampleProblems(
      fourWayBank,
      config({ difficulties: ["easy", "moderate"], count: 5 }),
      seeded(9),
    );
    const opening = session.problems.slice(0, 4);
    const pairs = opening.map((problem) => `${problem.difficulty}:${problem.operation}`);
    expect(new Set(pairs).size, pairs.join(",")).toBe(4);
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

  it("rejects unknown operations", () => {
    expect(() => validateConfig(config({ operations: ["delete" as OperationKind] }))).toThrow(
      /Unknown operation "delete"/,
    );
  });

  it("accepts free-form operator strings", () => {
    expect(() =>
      validateConfig(config({ queryOperators: ["$whatever"], updateOperators: ["$nonsense"] })),
    ).not.toThrow();
  });

  it("accepts an empty difficulty list as All", () => {
    expect(() => validateConfig(config({ difficulties: [] }))).not.toThrow();
  });
});

describe("sampleProblems filtering", () => {
  it("keeps only find problems", () => {
    const session = sampleProblems(mixedBank, config({ operations: ["find"] }), seeded(6));
    expect(session.availableCount).toBe(3);
    expect(session.problems.every((problem) => problem.operation === "find")).toBe(true);
    expect(session.capped).toBe(true);
  });

  it("keeps only update problems", () => {
    const session = sampleProblems(mixedBank, config({ operations: ["update"] }), seeded(6));
    expect(session.availableCount).toBe(2);
    expect(session.problems.every((problem) => problem.operation === "update")).toBe(true);
  });

  it("keeps both when operations is empty or lists both", () => {
    expect(sampleProblems(mixedBank, config({}), seeded(6)).availableCount).toBe(5);
    expect(
      sampleProblems(mixedBank, config({ operations: ["find", "update"] }), seeded(6))
        .availableCount,
    ).toBe(5);
  });

  it("matches any selected query operator", () => {
    const session = sampleProblems(
      mixedBank,
      config({ operations: ["find"], queryOperators: ["$in", "$or"] }),
      seeded(7),
    );
    expect(session.availableCount).toBe(2);
    expect(session.problems.map((problem) => problem.id).sort()).toEqual(["f-in", "f-or"]);
  });

  it("matches any selected update operator", () => {
    const session = sampleProblems(
      mixedBank,
      config({ operations: ["update"], updateOperators: ["$inc"] }),
      seeded(7),
    );
    expect(session.availableCount).toBe(1);
    expect(session.problems.map((problem) => problem.id)).toEqual(["u-inc"]);
  });

  it("does not apply query operators to update problems or vice versa", () => {
    // Update problems ignore queryOperators, so the two update problems survive a $inc filter.
    const byQuery = sampleProblems(mixedBank, config({ queryOperators: ["$inc"] }), seeded(7));
    expect(byQuery.availableCount).toBe(2);
    expect(byQuery.problems.every((problem) => problem.operation === "update")).toBe(true);

    // Find problems ignore updateOperators, so the three find problems survive a $in filter.
    const byUpdate = sampleProblems(mixedBank, config({ updateOperators: ["$in"] }), seeded(7));
    expect(byUpdate.availableCount).toBe(3);
    expect(byUpdate.problems.every((problem) => problem.operation === "find")).toBe(true);
  });

  it("caps against the filtered available count", () => {
    const session = sampleProblems(
      mixedBank,
      config({ operations: ["update"], count: 5 }),
      seeded(8),
    );
    expect(session.availableCount).toBe(2);
    expect(session.capped).toBe(true);
    expect(session.problems).toHaveLength(2);
  });
});
