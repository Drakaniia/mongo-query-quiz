import { describe, expect, it } from "vitest";

import { grade } from "./grade.js";
import type { Problem } from "./types.js";

const problem: Problem = {
  id: "test-problem",
  title: "Test",
  difficulty: "moderate",
  operation: "find",
  statement: "test",
  clues: ["test"],
  collection: "users",
  sampleDocuments: [],
  hints: ["a", "b"],
  referenceAnswer: 'db.users.find({ age: { $gt: 30 } }, { name: 1 })',
  rubric: [
    { id: "collection", label: "Collection", expectation: { kind: "collection", name: "users" } },
    { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
    {
      id: "filter",
      label: "Filter condition",
      expectation: { kind: "filter", doc: { age: { $gt: 30 } } },
    },
    {
      id: "projection",
      label: "Projection",
      expectation: { kind: "projection", doc: { name: 1 } },
    },
  ],
};

describe("grade", () => {
  it("awards 100 for the canonical answer", () => {
    const result = grade(problem, problem.referenceAnswer);
    expect(result.ok).toBe(true);
    expect(result.score).toBe(100);
    expect(result.itemResults.every((item) => item.passed)).toBe(true);
  });

  it("accepts normalized equivalent forms", () => {
    const result = grade(problem, "db.users.find({ age: { $gt: 30.0 } }, { name: 1 })");
    expect(result.score).toBe(100);
  });

  it("awards partial credit per facet", () => {
    const result = grade(problem, "db.users.find({ age: { $lt: 30 } }, { name: 1 })");
    expect(result.score).toBe(60);
    const collection = result.itemResults.find((item) => item.itemId === "collection");
    const method = result.itemResults.find((item) => item.itemId === "method");
    const filter = result.itemResults.find((item) => item.itemId === "filter");
    expect(collection?.passed).toBe(true);
    expect(method?.passed).toBe(true);
    expect(filter?.passed).toBe(false);
    expect(filter?.actual).toContain("$lt");
  });

  it("marks missing arguments", () => {
    const result = grade(problem, "db.users.find({ age: { $gt: 30 } })");
    const projection = result.itemResults.find((item) => item.itemId === "projection");
    expect(projection?.passed).toBe(false);
    expect(projection?.actual).toBe("missing");
  });

  it("fails the collection item for a different collection", () => {
    const result = grade(problem, "db.accounts.find({ age: { $gt: 30 } }, { name: 1 })");
    const collection = result.itemResults.find((item) => item.itemId === "collection");
    expect(collection?.passed).toBe(false);
    expect(collection?.expected).toBe("db.users");
    expect(collection?.actual).toBe("db.accounts");
  });

  it("blocks scoring on unparseable input", () => {
    const result = grade(problem, "db.users.find({");
    expect(result.ok).toBe(false);
    expect(result.score).toBe(0);
    expect(result.itemResults).toHaveLength(0);
    expect(result.parseError).toBeTruthy();
    expect(result.parseErrorPosition).toBeGreaterThanOrEqual(0);
  });

  it("applies variants and method equivalents", () => {
    const variantProblem: Problem = {
      ...problem,
      rubric: [
        { id: "method", label: "Method", expectation: { kind: "method", method: "findOne", equivalents: ["find"] } },
        {
          id: "filter",
          label: "Filter",
          expectation: {
            kind: "filter",
            doc: { status: "a" },
            variants: [{ status: { $in: ["a"] } }],
          },
        },
      ],
    };
    expect(grade(variantProblem, 'db.users.find({ status: { $in: ["a"] } })').score).toBe(100);
  });

  it("fails method items for the wrong method family", () => {
    const updateProblem: Problem = {
      ...problem,
      operation: "update",
      rubric: [
        { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
        {
          id: "update",
          label: "Update",
          expectation: { kind: "update", doc: { $set: { a: 1 } } },
        },
      ],
    };
    const result = grade(updateProblem, "db.users.find({})");
    expect(result.score).toBe(0);
    const update = result.itemResults.find((item) => item.itemId === "update");
    expect(update?.actual).toBe("missing");
  });

  it("normalizes weights to a percentage", () => {
    const weighted: Problem = {
      ...problem,
      rubric: [
        { id: "a", label: "A", weight: 1, expectation: { kind: "collection", name: "users" } },
        { id: "b", label: "B", weight: 3, expectation: { kind: "collection", name: "nope" } },
      ],
    };
    expect(grade(weighted, "db.users.find({})").score).toBe(25);
  });
});
