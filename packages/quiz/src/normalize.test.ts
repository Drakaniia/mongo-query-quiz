import { describe, expect, it } from "vitest";

import { deepEqual, documentsMatch, normalize, normalizeDocument } from "./normalize.js";
import { MongoRegex, type MongoValue } from "./types.js";

function match(a: Record<string, MongoValue>, b: Record<string, MongoValue>): boolean {
  return documentsMatch(a, b);
}

describe("normalization", () => {
  it("sorts object keys", () => {
    expect(match({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual(normalizeDocument({ b: 2, a: 1 }), normalizeDocument({ a: 1, b: 2 }))).toBe(
      true,
    );
  });

  it("sorts nested keys", () => {
    expect(match({ x: { a: 1, b: 2 } }, { x: { b: 2, a: 1 } })).toBe(true);
  });

  it("flattens nested $and and merges plain clauses", () => {
    expect(
      match(
        { $and: [{ a: 1 }, { $and: [{ b: 2 }] }] },
        { a: 1, b: 2 },
      ),
    ).toBe(true);
  });

  it("drops a single-clause $and wrapper", () => {
    expect(match({ $and: [{ a: 1 }] }, { a: 1 })).toBe(true);
  });

  it("keeps $and clauses that contain operators", () => {
    const normalized = normalizeDocument({ $and: [{ $or: [{ a: 1 }, { b: 2 }] }] });
    expect(normalized).toEqual({ $or: [{ a: 1 }, { b: 2 }] });
  });

  it("collapses single-element $in", () => {
    expect(match({ a: { $in: [1] } }, { a: 1 })).toBe(true);
  });

  it("does not collapse multi-element $in", () => {
    expect(match({ a: { $in: [1, 2] } }, { a: 1 })).toBe(false);
  });

  it("collapses $eq to a bare value", () => {
    expect(match({ a: { $eq: 5 } }, { a: 5 })).toBe(true);
  });

  it("treats numbers regardless of form", () => {
    expect(match({ a: 30 }, { a: 30.0 })).toBe(true);
  });

  it("normalizes regex flag ordering", () => {
    expect(deepEqual(normalize(new MongoRegex("x", "ig")), normalize(new MongoRegex("x", "gi")))).toBe(
      true,
    );
    expect(deepEqual(normalize(new MongoRegex("x", "i")), normalize(new MongoRegex("y", "i")))).toBe(
      false,
    );
  });

  it("preserves $or semantics", () => {
    expect(match({ $or: [{ a: 1 }, { b: 2 }] }, { $or: [{ b: 2 }, { a: 1 }] })).toBe(true);
    expect(match({ $or: [{ a: 1 }, { b: 2 }] }, { a: 1, b: 2 })).toBe(false);
  });

  it("compares arrays element-wise", () => {
    expect(match({ tags: ["a", "b"] }, { tags: ["a", "b"] })).toBe(true);
    expect(match({ tags: ["a", "b"] }, { tags: ["b", "a"] })).toBe(false);
  });
});
