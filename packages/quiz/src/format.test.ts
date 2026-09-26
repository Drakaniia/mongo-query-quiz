import { describe, expect, it } from "vitest";

import { formatStatement } from "./format.js";
import { PROBLEM_BANK } from "./problems/index.js";

describe("formatStatement", () => {
  it("formats arguments as multi-line JSON", () => {
    const formatted = formatStatement('db.products.find({ stock: { $gt: 5 } }, { name: 1 })');
    expect(formatted).toBe(
      [
        "db.products.find(",
        "  {",
        '    "stock": {',
        '      "$gt": 5',
        "    }",
        "  },",
        "  {",
        '    "name": 1',
        "  }",
        ")",
      ].join("\n"),
    );
  });

  it("handles zero-argument calls", () => {
    expect(formatStatement("db.products.find()")).toBe("db.products.find()");
  });

  it("returns undefined for unparseable input", () => {
    expect(formatStatement("db.products.find({")).toBeUndefined();
  });

  it("formats every problem's reference answer", () => {
    for (const problem of PROBLEM_BANK) {
      const formatted = formatStatement(problem.referenceAnswer);
      expect(formatted, problem.id).toBeTruthy();
      expect(formatted, problem.id).toContain(problem.collection);
    }
  });
});
