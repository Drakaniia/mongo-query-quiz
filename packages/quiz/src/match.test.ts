import { describe, expect, it } from "vitest";

import { previewQuery } from "./match.js";
import { PROBLEM_BANK } from "./problems/index.js";

const users = [
  { _id: "u1", name: "Ada", status: "active", age: 34, tags: ["admin", "beta"] },
  { _id: "u2", name: "Ben", status: "inactive", age: 16, tags: [] },
  { _id: "u3", name: "Cleo", status: "active", age: 41, tags: ["beta"] },
];

function matched(input: string, documents: Record<string, unknown>[] = users): unknown[] {
  const result = previewQuery(input, documents);
  if (result.status !== "ok") throw new Error(`preview failed: ${JSON.stringify(result)}`);
  return result.matched;
}

describe("previewQuery", () => {
  it("matches equality filters", () => {
    expect(matched('db.users.find({ status: "active" })')).toHaveLength(2);
  });

  it("matches comparison operators", () => {
    expect(matched("db.users.find({ age: { $gte: 18 } })")).toHaveLength(2);
    expect(matched("db.users.find({ age: { $lt: 18 } })")).toHaveLength(1);
  });

  it("matches implicit $and", () => {
    expect(matched('db.users.find({ status: "active", age: { $lt: 40 } })')).toHaveLength(1);
  });

  it("matches $or and $and clauses", () => {
    expect(
      matched('db.users.find({ $or: [{ status: "inactive" }, { age: { $gt: 40 } }] })'),
    ).toHaveLength(2);
  });

  it("matches array membership and $in/$nin", () => {
    expect(matched('db.users.find({ tags: "beta" })')).toHaveLength(2);
    expect(matched('db.users.find({ age: { $in: [16, 41] } })')).toHaveLength(2);
    expect(matched("db.users.find({ age: { $nin: [16] } })")).toHaveLength(2);
  });

  it("matches regex literals and $regex", () => {
    expect(matched("db.users.find({ name: /^a/i })")).toHaveLength(1);
    expect(matched('db.users.find({ name: { $regex: "^B", $options: "i" } })')).toHaveLength(1);
  });

  it("matches all three $not forms", () => {
    expect(matched('db.users.find({ status: { $not: "active" } })')).toHaveLength(1);
    expect(matched('db.users.find({ tags: { $not: "beta" } })')).toHaveLength(1);
    expect(matched("db.users.find({ name: { $not: /^A/ } })")).toHaveLength(2);
  });

  it("matches dotted field paths", () => {
    const orders = [
      { _id: "o1", shipping: { city: "Berlin", country: "Germany" }, total: 240 },
      { _id: "o2", shipping: { city: "Berlin", country: "Austria" }, total: 40 },
    ];
    expect(
      matched('db.orders.find({ "shipping.city": "Berlin", "shipping.country": "Germany" })', orders),
    ).toHaveLength(1);
  });

  it("matches $elemMatch", () => {
    const orders = [
      { _id: "o1", items: [{ name: "Keyboard", qty: 3 }] },
      { _id: "o2", items: [{ name: "Keyboard", qty: 1 }] },
    ];
    expect(
      matched('db.orders.find({ items: { $elemMatch: { name: "Keyboard", qty: { $gte: 2 } } } })', orders),
    ).toHaveLength(1);
  });

  it("treats ObjectId literals as equal to their string form", () => {
    expect(matched('db.users.findOne({ _id: ObjectId("u1") })')).toHaveLength(1);
  });

  it("applies projections", () => {
    const result = previewQuery('db.users.find({ status: "active" }, { name: 1 })', users);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.matched[0]).toEqual({ _id: "u1", name: "Ada" });
  });

  it("caps findOne to a single result and reports the total", () => {
    const result = previewQuery('db.users.findOne({ status: "active" })', users);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.matched).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.limitedToOne).toBe(true);
  });

  it("reports parse errors", () => {
    const result = previewQuery("db.users.find({", users);
    expect(result.status).toBe("error");
  });

  it("reports update statements as unsupported", () => {
    const result = previewQuery('db.users.updateOne({}, { $set: { a: 1 } })', users);
    expect(result.status).toBe("unsupported");
  });

  it("reports unknown operators as unsupported", () => {
    const result = previewQuery("db.users.find({ age: { $mod: [2, 0] } })", users);
    expect(result.status).toBe("unsupported");
  });

  it("matches every find problem's reference answer against its sample documents", () => {
    for (const problem of PROBLEM_BANK) {
      if (problem.operation !== "find") continue;
      const result = previewQuery(problem.referenceAnswer, problem.sampleDocuments);
      expect(result.status, `${problem.id}: ${JSON.stringify(result)}`).toBe("ok");
      if (result.status !== "ok") continue;
      expect(result.total, `${problem.id} should match sample documents`).toBeGreaterThan(0);
    }
  });
});
