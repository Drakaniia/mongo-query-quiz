import { describe, expect, it } from "vitest";

import { PROBLEM_BANK } from "./problems/index.js";
import {
  OPERATION_KINDS,
  QUERY_OPERATOR_ORDER,
  UPDATE_OPERATOR_ORDER,
  collectQueryOperators,
  collectUpdateOperators,
  countMatching,
  matchesConfig,
  normalizeConfig,
  queryOperatorsOf,
  updateOperatorsOf,
} from "./filters.js";
import type {
  Expectation,
  NormalizedDocument,
  OperationKind,
  Problem,
  QuizSessionConfig,
} from "./types.js";
import { isoDate, objectId, rx } from "./values.js";

function makeProblem(
  id: string,
  operation: OperationKind,
  expectations: Expectation[] = [],
): Problem {
  return {
    id,
    title: id,
    difficulty: "easy",
    operation,
    statement: "s",
    clues: ["s"],
    collection: "c",
    sampleDocuments: [],
    hints: ["a", "b"],
    referenceAnswer: "db.c.find({})",
    rubric: expectations.map((expectation, index) => ({
      id: `${id}-${index}`,
      label: "r",
      expectation,
    })),
  };
}

const config = (overrides: Partial<QuizSessionConfig> = {}): QuizSessionConfig => ({
  difficulties: [],
  count: 30,
  operations: [],
  queryOperators: [],
  updateOperators: [],
  ...overrides,
});

describe("queryOperatorsOf", () => {
  it("walks nested comparison operators under a field", () => {
    const problem = makeProblem("p", "find", [{ kind: "filter", doc: { price: { $lt: 20 } } }]);
    expect(queryOperatorsOf(problem)).toEqual(["$lt"]);
  });

  it("walks top-level logical operators and their nested operators in one pass", () => {
    const problem = makeProblem("p", "find", [
      {
        kind: "filter",
        doc: { $or: [{ price: { $lt: 20 } }, { tags: { $in: ["a", "b"] } }] },
      },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$lt", "$in", "$or"]);
  });

  it("recurses into plain nested documents and arrays", () => {
    const problem = makeProblem("p", "find", [
      {
        kind: "filter",
        doc: { $and: [{ lines: { $elemMatch: { qty: { $gte: 3 } } } }] },
      },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$gte", "$elemMatch", "$and"]);
  });

  it("includes operators from every variant", () => {
    const problem = makeProblem("p", "find", [
      { kind: "filter", doc: { a: 1 }, variants: [{ b: { $ne: 2 } }, { c: { $nor: [{ d: 1 }] } }] },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$ne", "$nor"]);
  });

  it("dedupes across rubric items and variants", () => {
    const problem = makeProblem("p", "find", [
      { kind: "filter", doc: { a: { $gt: 1 } } },
      { kind: "filter", doc: { a: { $gt: 2 } }, variants: [{ b: { $gt: 3 } }] },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$gt"]);
  });

  it("treats MongoRegex and MongoTypedValue as leaf values", () => {
    const problem = makeProblem("p", "find", [
      {
        kind: "filter",
        doc: {
          email: { $regex: rx("^a"), $options: "i" },
          _id: objectId("507f1f77bcf86cd799439011"),
          at: { $gt: isoDate("2024-01-01T00:00:00Z") },
        },
      },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$gt", "$regex", "$options"]);
  });

  it("ignores keys that do not start with $", () => {
    const problem = makeProblem("p", "find", [
      { kind: "filter", doc: { status: "open", "nested.field": 1 } },
    ]);
    expect(queryOperatorsOf(problem)).toEqual([]);
  });

  it("ignores non-filter expectations", () => {
    const problem = makeProblem("p", "update", [
      { kind: "update", doc: { count: { $inc: 1 } } },
      { kind: "projection", doc: { name: { $meta: "textScore" } } },
      { kind: "options", doc: { limit: 5 } },
    ]);
    expect(queryOperatorsOf(problem)).toEqual([]);
  });

  it("returns an empty list for an empty rubric", () => {
    expect(queryOperatorsOf(makeProblem("p", "find"))).toEqual([]);
  });

  it("survives a cyclic document", () => {
    const doc: Record<string, unknown> = { a: { $gt: 1 } };
    (doc["a"] as Record<string, unknown>)["self"] = doc;
    const problem = makeProblem("p", "find", [
      { kind: "filter", doc: doc as unknown as NormalizedDocument },
    ]);
    expect(queryOperatorsOf(problem)).toEqual(["$gt"]);
  });
});

describe("updateOperatorsOf", () => {
  it("collects update operators from doc and variants", () => {
    const problem = makeProblem("p", "update", [
      { kind: "update", doc: { $set: { a: 1 }, $inc: { b: 1 } }, variants: [{ $unset: ["c"] }] },
    ]);
    expect(updateOperatorsOf(problem)).toEqual(["$set", "$unset", "$inc"]);
  });

  it("ignores filter expectations", () => {
    const problem = makeProblem("p", "update", [
      { kind: "filter", doc: { status: { $in: ["a"] } } },
    ]);
    expect(updateOperatorsOf(problem)).toEqual([]);
  });
});

describe("collectQueryOperators", () => {
  it("sorts by the curated order, then alphabetically for the rest", () => {
    const bank = [
      makeProblem("a", "find", [{ kind: "filter", doc: { $zzz: 1 } }]),
      makeProblem("b", "find", [{ kind: "filter", doc: { a: { $aaa: 1 } } }]),
      makeProblem("c", "find", [{ kind: "filter", doc: { b: { $lt: 1 } } }]),
      makeProblem("d", "find", [{ kind: "filter", doc: { $or: [{ c: 1 }] } }]),
    ];
    expect(collectQueryOperators(bank)).toEqual(["$lt", "$or", "$aaa", "$zzz"]);
  });

  it("covers every query operator used by the real bank with the curated list", () => {
    for (const operator of collectQueryOperators(PROBLEM_BANK)) {
      expect(QUERY_OPERATOR_ORDER, operator).toContain(operator);
    }
  });
});

describe("collectUpdateOperators", () => {
  it("covers every update operator used by the real bank with the curated list", () => {
    for (const operator of collectUpdateOperators(PROBLEM_BANK)) {
      expect(UPDATE_OPERATOR_ORDER, operator).toContain(operator);
    }
  });

  it("is empty for a bank of find problems", () => {
    expect(
      collectUpdateOperators([makeProblem("a", "find", [{ kind: "filter", doc: {} }])]),
    ).toEqual([]);
  });
});

describe("matchesConfig", () => {
  const findOr = makeProblem("find-or", "find", [
    { kind: "filter", doc: { $or: [{ a: { $lt: 1 } }] } },
  ]);
  const findRegex = makeProblem("find-regex", "find", [
    { kind: "filter", doc: { a: { $regex: "x" } } },
  ]);
  const updateSet = makeProblem("update-set", "update", [
    { kind: "update", doc: { $set: { a: 1 } } },
  ]);
  const updateInc = makeProblem("update-inc", "update", [
    { kind: "update", doc: { $inc: { a: 1 } } },
  ]);

  it("passes when no dimension is constrained", () => {
    expect(matchesConfig(findOr, config())).toBe(true);
  });

  it("filters by operation", () => {
    expect(matchesConfig(findOr, config({ operations: ["find"] }))).toBe(true);
    expect(matchesConfig(updateSet, config({ operations: ["find"] }))).toBe(false);
    expect(matchesConfig(updateSet, config({ operations: ["update"] }))).toBe(true);
    expect(matchesConfig(findOr, config({ operations: ["find", "update"] }))).toBe(true);
  });

  it("matches query operators with any-match semantics", () => {
    const bank = [findOr, findRegex];
    expect(bank.filter((p) => matchesConfig(p, config({ queryOperators: ["$or"] })))).toEqual([
      findOr,
    ]);
    expect(bank.filter((p) => matchesConfig(p, config({ queryOperators: ["$regex"] })))).toEqual([
      findRegex,
    ]);
    expect(
      bank.filter((p) => matchesConfig(p, config({ queryOperators: ["$or", "$regex"] }))),
    ).toHaveLength(2);
    expect(
      bank.filter((p) => matchesConfig(p, config({ queryOperators: ["$expr"] }))),
    ).toHaveLength(0);
  });

  it("matches update operators with any-match semantics", () => {
    const bank = [updateSet, updateInc];
    expect(bank.filter((p) => matchesConfig(p, config({ updateOperators: ["$inc"] })))).toEqual([
      updateInc,
    ]);
    expect(
      bank.filter((p) => matchesConfig(p, config({ updateOperators: ["$set", "$inc"] }))),
    ).toHaveLength(2);
  });

  it("does not apply query-operator filters to update problems", () => {
    const updateWithFilter = makeProblem("u", "update", [
      { kind: "filter", doc: { a: { $gt: 1 } } },
      { kind: "update", doc: { $set: { a: 1 } } },
    ]);
    expect(queryOperatorsOf(updateWithFilter)).toEqual(["$gt"]);
    expect(matchesConfig(updateWithFilter, config({ queryOperators: ["$expr"] }))).toBe(true);
  });

  it("does not apply update-operator filters to find problems", () => {
    expect(matchesConfig(findOr, config({ updateOperators: ["$inc"] }))).toBe(true);
  });

  it("combines operation, difficulty and operator constraints", () => {
    const problem = { ...findOr, difficulty: "difficult" as const };
    expect(
      matchesConfig(
        problem,
        config({ difficulties: ["difficult"], operations: ["find"], queryOperators: ["$or"] }),
      ),
    ).toBe(true);
    expect(
      matchesConfig(
        problem,
        config({ difficulties: ["easy"], operations: ["find"], queryOperators: ["$or"] }),
      ),
    ).toBe(false);
    expect(
      matchesConfig(
        problem,
        config({ difficulties: ["difficult"], operations: ["update"], queryOperators: ["$or"] }),
      ),
    ).toBe(false);
  });
});

describe("countMatching", () => {
  const bank = [
    makeProblem("f1", "find", [{ kind: "filter", doc: { a: { $in: [1] } } }]),
    makeProblem("f2", "find", [{ kind: "filter", doc: { $or: [{ a: 1 }] } }]),
    makeProblem("u1", "update", [{ kind: "update", doc: { $set: { a: 1 } } }]),
  ];

  it("counts every problem for an unconstrained config", () => {
    expect(countMatching(bank, config())).toBe(3);
  });

  it("counts only the problems that satisfy the filters", () => {
    expect(countMatching(bank, config({ operations: ["find"] }))).toBe(2);
    expect(countMatching(bank, config({ operations: ["find"], queryOperators: ["$in"] }))).toBe(1);
    expect(countMatching(bank, config({ operations: ["update"], updateOperators: ["$set"] }))).toBe(
      1,
    );
    expect(countMatching(bank, config({ operations: ["find"], queryOperators: ["$expr"] }))).toBe(
      0,
    );
  });
});

describe("normalizeConfig", () => {
  it("falls back to the everything config for null and undefined", () => {
    const expected = config();
    expect(normalizeConfig(undefined)).toEqual(expected);
    expect(normalizeConfig(null)).toEqual(expected);
  });

  it("keeps a valid config as-is", () => {
    const value = config({
      difficulties: ["easy", "difficult"],
      count: 10,
      operations: ["update"],
      queryOperators: ["$set"],
      updateOperators: ["$inc", "$push"],
    });
    expect(normalizeConfig(value)).toEqual(value);
  });

  it("drops unknown operations and garbage operator entries", () => {
    expect(
      normalizeConfig({
        difficulties: ["easy", "impossible", 7],
        count: 5,
        operations: ["find", "delete", null, 3],
        queryOperators: ["$or", "not-an-operator", 12, ""],
        updateOperators: ["$set", {}],
      }),
    ).toEqual({
      difficulties: ["easy"],
      count: 5,
      operations: ["find"],
      queryOperators: ["$or"],
      updateOperators: ["$set"],
    });
  });

  it("falls back to 30 for a non-preset count and for a non-object", () => {
    expect(normalizeConfig({ count: 7 }).count).toBe(30);
    expect(normalizeConfig({ count: "10" }).count).toBe(30);
    expect(normalizeConfig([]).count).toBe(30);
    expect(normalizeConfig("nope").count).toBe(30);
  });

  it("never throws on hostile input", () => {
    for (const value of [undefined, null, 0, "", [], NaN, { count: {} }, { difficulties: {} }]) {
      expect(() => normalizeConfig(value)).not.toThrow();
    }
  });
});

describe("OPERATION_KINDS", () => {
  it("lists the two operation families in canonical order", () => {
    expect(OPERATION_KINDS).toEqual(["find", "update"]);
  });
});
