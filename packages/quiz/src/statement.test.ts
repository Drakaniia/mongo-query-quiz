import { describe, expect, it } from "vitest";

import { splitStatement } from "./statement.js";

function text(segments: { text: string; highlighted: boolean }[]): string {
  return segments.map((segment) => segment.text).join("");
}

describe("splitStatement", () => {
  it("returns the whole statement when there are no clues", () => {
    expect(splitStatement("Find all orders.", [])).toEqual([
      { text: "Find all orders.", highlighted: false },
    ]);
  });

  it("highlights a clue in place", () => {
    expect(splitStatement("Find products whose stock is not greater than 10.", ["stock is not greater than 10"])).toEqual([
      { text: "Find products whose ", highlighted: false },
      { text: "stock is not greater than 10", highlighted: true },
      { text: ".", highlighted: false },
    ]);
  });

  it("highlights multiple clues and preserves the original text", () => {
    const statement = "Find products whose stock is not greater than 10, and show only the name and stock.";
    const segments = splitStatement(statement, ["stock is not greater than 10", "only the name and stock"]);
    expect(text(segments)).toBe(statement);
    expect(segments.filter((segment) => segment.highlighted).map((segment) => segment.text)).toEqual([
      "stock is not greater than 10",
      "only the name and stock",
    ]);
  });

  it("highlights every occurrence of a repeated clue", () => {
    const segments = splitStatement("ship it, ship it now", ["ship it"]);
    expect(segments.filter((segment) => segment.highlighted)).toHaveLength(2);
    expect(text(segments)).toBe("ship it, ship it now");
  });

  it("keeps the longest clue when a shorter one is nested inside it", () => {
    const segments = splitStatement("whose name and stock", ["name and stock", "name"]);
    expect(segments.filter((segment) => segment.highlighted).map((segment) => segment.text)).toEqual([
      "name and stock",
    ]);
    expect(text(segments)).toBe("whose name and stock");
  });

  it("ignores clues that do not occur in the statement", () => {
    const segments = splitStatement("Find books.", ["notebooks"]);
    expect(segments).toEqual([{ text: "Find books.", highlighted: false }]);
  });

  it("ignores empty clues", () => {
    expect(splitStatement("Find books.", [""])).toEqual([{ text: "Find books.", highlighted: false }]);
  });
});
