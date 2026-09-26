import { formatValue } from "./format.js";
import { deepEqual, normalizeDocument } from "./normalize.js";
import { parse } from "./parser/parse.js";
import {
  MongoRegex,
  MongoTypedValue,
  type Expectation,
  type GradeResult,
  type ItemResult,
  type MongoValue,
  type NormalizedDocument,
  type ParsedStatement,
  type Problem,
  type RubricItem,
} from "./types.js";

const DEFAULT_WEIGHTS: Record<Expectation["kind"], number> = {
  collection: 20,
  method: 30,
  filter: 40,
  update: 45,
  projection: 10,
  options: 10,
};

export function resolveWeight(item: RubricItem): number {
  return item.weight ?? DEFAULT_WEIGHTS[item.expectation.kind];
}

function isPlainObject(value: MongoValue | undefined): value is { [key: string]: MongoValue } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof MongoRegex) &&
    !(value instanceof MongoTypedValue)
  );
}

function argumentFor(kind: Expectation["kind"], statement: ParsedStatement): MongoValue | undefined {
  switch (kind) {
    case "filter":
      return statement.args[0];
    case "projection":
    case "update":
      return statement.args[1];
    case "options":
      return statement.args[2];
    default:
      return undefined;
  }
}

function documentMatchesExpectation(
  actual: { [key: string]: MongoValue },
  doc: NormalizedDocument,
  variants: NormalizedDocument[] | undefined,
): boolean {
  const normalizedActual = normalizeDocument(actual);
  const matches = (candidate: NormalizedDocument) =>
    deepEqual(normalizedActual, normalizeDocument(candidate));
  if (matches(doc)) return true;
  return (variants ?? []).some((variant) => matches(variant));
}

function evaluate(
  item: RubricItem,
  statement: ParsedStatement,
): { passed: boolean; expected: string; actual: string } {
  const expectation = item.expectation;

  if (expectation.kind === "collection") {
    return {
      passed: statement.collection === expectation.name,
      expected: `db.${expectation.name}`,
      actual: `db.${statement.collection}`,
    };
  }

  if (expectation.kind === "method") {
    const equivalents = expectation.equivalents ?? [];
    const expectedLabel =
      equivalents.length > 0
        ? `${expectation.method} (or ${equivalents.join(", ")})`
        : expectation.method;
    return {
      passed: statement.method === expectation.method || equivalents.includes(statement.method),
      expected: expectedLabel,
      actual: statement.method,
    };
  }

  const raw = argumentFor(expectation.kind, statement);
  const expectedLabel =
    (expectation.variants && expectation.variants.length > 0
      ? `${formatValue(expectation.doc)}\n— or —\n${expectation.variants
          .map((variant) => formatValue(variant))
          .join("\n— or —\n")}`
      : formatValue(expectation.doc));

  if (!isPlainObject(raw)) {
    return { passed: false, expected: expectedLabel, actual: "missing" };
  }

  return {
    passed: documentMatchesExpectation(raw, expectation.doc, expectation.variants),
    expected: expectedLabel,
    actual: formatValue(normalizeDocument(raw)),
  };
}

/**
 * Grade a submission structurally against a problem's rubric. Never executes the query.
 * Unparseable input blocks scoring and yields no item results.
 */
export function grade(problem: Problem, input: string): GradeResult {
  const parsed = parse(input);
  if (!parsed.ok) {
    return {
      ok: false,
      score: 0,
      itemResults: [],
      parseError: parsed.error,
      parseErrorPosition: parsed.position,
      earned: 0,
      total: 0,
    };
  }

  const statement = parsed.statement;
  const itemResults: ItemResult[] = problem.rubric.map((item) => {
    const weight = resolveWeight(item);
    const outcome = evaluate(item, statement);
    return {
      itemId: item.id,
      label: item.label,
      passed: outcome.passed,
      earned: outcome.passed ? weight : 0,
      max: weight,
      expected: outcome.expected,
      actual: outcome.actual,
    };
  });

  const total = itemResults.reduce((sum, item) => sum + item.max, 0);
  const earned = itemResults.reduce((sum, item) => sum + item.earned, 0);
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  return { ok: true, score, itemResults, earned, total };
}
