import { describe, expect, it } from "vitest";

import { parse } from "./parser/parse.js";
import { explainSyntaxError, SYNTAX_CHECKLIST } from "./syntax-guide.js";

/** Run a broken statement through the parser and explain whatever it reported. */
function explain(input: string) {
  const result = parse(input);
  if (result.ok) throw new Error(`expected a parse failure for: ${input}`);
  return explainSyntaxError(input, result.error, result.position);
}

describe("explainSyntaxError", () => {
  it("points at the line and column of the failure", () => {
    const guidance = explain(
      ["db.orders.find({", '  status: "shipped"', "  total: { $gte: 200 }", "})"].join("\n"),
    );
    expect(guidance.line).toBe(3);
    expect(guidance.lineText).toBe("  total: { $gte: 200 }");
    expect(guidance.column).toBe(3);
    expect(guidance.highlight).toEqual({ start: 2, end: 8 });
  });

  it("keeps the highlight inside the reported line", () => {
    const guidance = explain(["db.orders.find({", '  status: "shipped"'].join("\n"));
    expect(guidance.highlight.start).toBeLessThanOrEqual(guidance.lineText.length);
    expect(guidance.highlight.end).toBeLessThanOrEqual(guidance.lineText.length);
    expect(guidance.highlight.end).toBeGreaterThanOrEqual(guidance.highlight.start);
  });

  it("clamps a position that runs past the end of the input", () => {
    const guidance = explainSyntaxError("db.users.find()", 'Expected "}"', 5000);
    expect(guidance.line).toBe(1);
    expect(guidance.highlight.end).toBeLessThanOrEqual(guidance.lineText.length);
  });

  it("handles an empty submission", () => {
    const guidance = explain("");
    expect(guidance.lineText).toBe("");
    expect(guidance.summary).toMatch(/nothing to grade/i);
    expect(guidance.hints.length).toBeGreaterThan(0);
  });

  const cases: { input: string; summary: RegExp; fix: RegExp }[] = [
    {
      input: 'db.users.find({ status: "shipped })',
      summary: /closing quote/i,
      fix: /Close the string/,
    },
    { input: "db.users.find({ a = 1 })", summary: /not part of the shell syntax/i, fix: /Use `:`/ },
    { input: "db.users.find({ a: 1 b: 2 })", summary: /never closed/i, fix: /comma/i },
    { input: "db.users.find({ status: shipped })", summary: /bare value/i, fix: /quotes/i },
    { input: "users.find({})", summary: /start with `db`/i, fix: /db\.<collection>/ },
    {
      input: "db.users.countDocuments({})",
      summary: /not one of the methods/i,
      fix: /find` or `findOne/,
    },
    { input: "db.users.updateOne({})", summary: /two documents/i, fix: /filter first/i },
    { input: "db.users.find(1)", summary: /not a document/i, fix: /wrap it in braces/i },
    {
      input: "db.users.find({ a: 1 }, { b: 1 }, { c: 1 }, { d: 1 })",
      summary: /more arguments/i,
      fix: /projection/i,
    },
    { input: "db.users.find({ a: [1, 2 })", summary: /never closed/i, fix: /bracket/i },
    {
      input: "db.users.find({ a: 1 }); db.users.find({})",
      summary: /extra content/i,
      fix: /single statement/i,
    },
  ];

  for (const { input, summary, fix } of cases) {
    it(`explains ${JSON.stringify(input)}`, () => {
      const guidance = explain(input);
      expect(guidance.summary).toMatch(summary);
      const copy = guidance.hints.map((item) => `${item.text} ${item.example ?? ""}`).join(" ");
      expect(copy).toMatch(fix);
      expect(guidance.template.length).toBeGreaterThan(0);
      expect(guidance.checklist.length).toBe(SYNTAX_CHECKLIST.length);
    });
  }

  it("falls back to generic advice for unknown messages", () => {
    const guidance = explainSyntaxError("db.users.find({})", "Something new went wrong", 0);
    expect(guidance.summary).toMatch(/does not parse/i);
    expect(guidance.hints.length).toBeGreaterThan(0);
  });
});
