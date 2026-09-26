import { describe, expect, it } from "vitest";

import { parse } from "./parse.js";
import { MongoRegex, MongoTypedValue } from "../types.js";

function parseOk(input: string) {
  const result = parse(input);
  if (!result.ok) throw new Error(`expected parse to succeed: ${result.error}`);
  return result.statement;
}

function parseErr(input: string) {
  const result = parse(input);
  if (result.ok) throw new Error("expected parse to fail");
  return result;
}

describe("parse envelope", () => {
  it("parses all four supported methods", () => {
    expect(parseOk("db.users.find({})").method).toBe("find");
    expect(parseOk("db.users.findOne({})").method).toBe("findOne");
    expect(parseOk("db.users.updateOne({}, { $set: { a: 1 } })").method).toBe("updateOne");
    expect(parseOk("db.users.updateMany({}, { $set: { a: 1 } })").method).toBe("updateMany");
  });

  it("captures the collection name", () => {
    expect(parseOk('db.sales_orders_v2.find({})').collection).toBe("sales_orders_v2");
  });

  it("accepts a trailing semicolon", () => {
    expect(parseOk('db.users.find({ status: "active" });').collection).toBe("users");
  });

  it("rejects a malformed envelope", () => {
    expect(parseErr("users.find({})").error).toMatch(/starting with "db"/);
    expect(parseErr("db..find({})").error).toMatch(/collection name/);
  });

  it("rejects unknown methods", () => {
    expect(parseErr("db.users.countDocuments({})").error).toMatch(/Unknown method/);
  });

  it("rejects multiple statements", () => {
    expect(parseErr("db.users.find({}); db.users.find({})").error).toMatch(/after the statement/);
  });

  it("treats empty or whitespace input as an error", () => {
    expect(parseErr("").error).toBe("Enter a query");
    expect(parseErr("   \n").error).toBe("Enter a query");
  });

  it("reports an accurate error position", () => {
    const result = parseErr("db.users.find({ a: 1 }");
    expect(result.position).toBe("db.users.find({ a: 1 }".length);
  });
});

describe("parse relaxed JSON", () => {
  it("accepts unquoted keys, single quotes and trailing commas", () => {
    const statement = parseOk("db.users.find({ name: 'Ada', age: 34, })");
    expect(statement.args[0]).toEqual({ name: "Ada", age: 34 });
  });

  it("parses numbers, booleans and null", () => {
    const statement = parseOk("db.users.find({ a: 1.5, b: true, c: false, d: null, e: -3 })");
    expect(statement.args[0]).toEqual({ a: 1.5, b: true, c: false, d: null, e: -3 });
  });

  it("parses arrays", () => {
    const statement = parseOk("db.users.find({ tags: ['a', 'b'] })");
    expect(statement.args[0]).toEqual({ tags: ["a", "b"] });
  });

  it("parses regex literals with flags", () => {
    const statement = parseOk("db.users.find({ email: /@gmail\\.com$/i })");
    expect(statement.args[0]).toEqual({ email: new MongoRegex("@gmail\\.com$", "i") });
  });

  it("parses ObjectId values opaquely", () => {
    const statement = parseOk('db.users.findOne({ _id: ObjectId("abc123") })');
    expect(statement.args[0]).toEqual({ _id: new MongoTypedValue("ObjectId", "abc123") });
  });

  it("ignores comments", () => {
    const statement = parseOk("db.users.find({ a: 1 // trailing\n })\n/* block */");
    expect(statement.args[0]).toEqual({ a: 1 });
  });

  it("distinguishes dotted keys", () => {
    const statement = parseOk('db.orders.find({ "shipping.city": "Berlin" })');
    expect(statement.args[0]).toEqual({ "shipping.city": "Berlin" });
  });
});

describe("parse arity", () => {
  it("allows 0 to 3 args for find", () => {
    expect(parseOk("db.users.find()").args).toHaveLength(0);
    expect(parseOk("db.users.find({}, { name: 1 })").args).toHaveLength(2);
    expect(parseOk("db.users.find({}, { name: 1 }, { limit: 5 })").args).toHaveLength(3);
  });

  it("requires filter and update for updateOne/updateMany", () => {
    expect(parseErr("db.users.updateOne({})").error).toMatch(/requires a filter and an update/);
    expect(parseErr("db.users.updateMany({})").error).toMatch(/requires a filter and an update/);
  });

  it("rejects too many arguments", () => {
    expect(parseErr("db.users.find({}, {}, {}, {})").error).toMatch(/Too many arguments/);
  });

  it("rejects non-object arguments", () => {
    expect(parseErr("db.users.find(1)").error).toMatch(/must be an object/);
  });
});
