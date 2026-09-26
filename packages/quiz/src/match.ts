import { parse } from "./parser/parse.js";
import { MongoRegex, MongoTypedValue, type MongoValue, type ParsedStatement } from "./types.js";

/**
 * Thrown when the query uses an operator the illustrative matcher cannot evaluate.
 * Surfaced as an honest "unsupported" preview rather than a wrong answer.
 */
class UnsupportedOperatorError extends Error {
  constructor(operation: string) {
    super(`Preview does not support ${operation}`);
    this.name = "UnsupportedOperatorError";
  }
}

function isObject(value: unknown): value is { [key: string]: MongoValue } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof MongoRegex) &&
    !(value instanceof MongoTypedValue)
  );
}

function isRegex(value: unknown): value is MongoRegex {
  return value instanceof MongoRegex;
}

function isTyped(value: unknown): value is MongoTypedValue {
  return value instanceof MongoTypedValue;
}

function isArray(value: unknown): value is MongoValue[] {
  return Array.isArray(value);
}

/** Cast an arbitrary parsed/document value into the matcher's value space. */
function asValue(value: unknown): MongoValue {
  return value as MongoValue;
}

function hasOperatorKey(value: unknown): value is { [key: string]: MongoValue } {
  return isObject(value) && Object.keys(value).some((key) => key.startsWith("$"));
}

function toRegex(value: MongoValue, options: string | undefined): RegExp {
  if (isRegex(value)) {
    const flags = options ? [...new Set([...value.flags, ...options])].join("") : value.flags;
    return new RegExp(value.pattern, flags);
  }
  if (typeof value === "string") {
    return new RegExp(value, options ?? "");
  }
  throw new UnsupportedOperatorError("$regex with a non-string pattern");
}

/** Equality that treats opaque typed values as equal to their literal representation. */
function valuesEqual(a: MongoValue, b: MongoValue): boolean {
  if (a === b) return true;
  if (isRegex(a) || isRegex(b)) {
    if (isRegex(a) && typeof b === "string") return safeTest(a, b);
    return isRegex(a) && isRegex(b) && a.pattern === b.pattern && a.flags === b.flags;
  }
  if (isTyped(a) && isTyped(b)) return a.ctor === b.ctor && a.literal === b.literal;
  if (isTyped(a)) return literalEquals(a.literal, b);
  if (isTyped(b)) return literalEquals(b.literal, a);
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    return a.length === b.length && a.every((entry, index) => valuesEqual(entry, b[index] as MongoValue));
  }
  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => key in b && valuesEqual(a[key] as MongoValue, b[key] as MongoValue));
  }
  return false;
}

function literalEquals(literal: string, other: MongoValue): boolean {
  if (typeof other === "string") return literal === other;
  if (typeof other === "number") return literal === String(other);
  return false;
}

function safeTest(regex: MongoRegex, value: string): boolean {
  try {
    return new RegExp(regex.pattern, regex.flags).test(value);
  } catch {
    return false;
  }
}

/** All values reachable at a (possibly dotted) field path, expanding array traversal. */
function resolvePath(document: MongoValue, path: string): MongoValue[] {
  const segments = path.split(".");
  let current: MongoValue[] = [document];
  for (const segment of segments) {
    const next: MongoValue[] = [];
    for (const value of current) {
      const bags = Array.isArray(value) ? value : [value];
      for (const bag of bags) {
        if (isObject(bag) && segment in bag) next.push(bag[segment] as MongoValue);
      }
    }
    current = next;
  }
  return current;
}

/** Include both the raw values and the elements of any arrays among them. */
function candidates(values: MongoValue[]): MongoValue[] {
  const out: MongoValue[] = [];
  for (const value of values) {
    out.push(value);
    if (Array.isArray(value)) out.push(...value);
  }
  return out;
}

function comparable(value: MongoValue): number | string | boolean | undefined {
  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (isTyped(value)) return value.literal;
  return undefined;
}

function compare(left: MongoValue, right: MongoValue, operator: string): boolean {
  const a = comparable(left);
  const b = comparable(right);
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) {
    // Dates arrive as typed literals; compare them as strings against strings.
    if (typeof a === "string" || typeof b === "string") {
      const as = String(a);
      const bs = String(b);
      return relational(as, bs, operator);
    }
    return false;
  }
  return relational(a, b, operator);
}

function relational(
  a: number | string | boolean,
  b: number | string | boolean,
  operator: string,
): boolean {
  switch (operator) {
    case "$gt":
      return a > b;
    case "$gte":
      return a >= b;
    case "$lt":
      return a < b;
    case "$lte":
      return a <= b;
    default:
      return false;
  }
}

function matchOperatorObject(
  values: MongoValue[],
  condition: { [key: string]: MongoValue },
): boolean {
  const options = typeof condition["$options"] === "string" ? (condition["$options"] as string) : undefined;
  for (const [operator, operand] of Object.entries(condition)) {
    if (operator === "$options") continue;
    const ok = matchOperator(values, operator, operand, options);
    if (!ok) return false;
  }
  return true;
}

function matchOperator(
  values: MongoValue[],
  operator: string,
  operand: MongoValue,
  options: string | undefined,
): boolean {
  const pool = candidates(values);
  switch (operator) {
    case "$eq":
      return pool.some((value) => valuesEqual(value, operand));
    case "$ne":
      return !pool.some((value) => valuesEqual(value, operand));
    case "$gt":
    case "$gte":
    case "$lt":
    case "$lte":
      return pool.some((value) => compare(value, operand, operator));
    case "$in": {
      if (!isArray(operand)) throw new UnsupportedOperatorError("$in without an array");
      return pool.some((value) => operand.some((item) => valuesEqual(value, item)));
    }
    case "$nin": {
      if (!isArray(operand)) throw new UnsupportedOperatorError("$nin without an array");
      return !pool.some((value) => operand.some((item) => valuesEqual(value, item)));
    }
    case "$exists": {
      const want = Boolean(operand);
      return (values.length > 0) === want;
    }
    case "$regex": {
      const regex = toRegex(operand, options);
      return pool.some((value) => typeof value === "string" && regex.test(value));
    }
    case "$size": {
      if (typeof operand !== "number") throw new UnsupportedOperatorError("$size with a non-number");
      return values.some((value) => Array.isArray(value) && value.length === operand);
    }
    case "$all": {
      if (!isArray(operand)) throw new UnsupportedOperatorError("$all without an array");
      return values.some(
        (value) =>
          Array.isArray(value) && operand.every((item) => value.some((el) => valuesEqual(el, item))),
      );
    }
    case "$elemMatch": {
      if (!isObject(operand)) throw new UnsupportedOperatorError("$elemMatch without a document");
      return values.some(
        (value) => Array.isArray(value) && value.some((element) => matchElement(element, operand)),
      );
    }
    case "$not": {
      if (isRegex(operand)) {
        return !pool.some((value) => typeof value === "string" && safeTest(operand, value));
      }
      if (isObject(operand)) return !matchOperatorObject(values, operand);
      if (isArray(operand)) throw new UnsupportedOperatorError("$not with an array");
      // Bare-value shorthand, equivalent to $ne.
      return !pool.some((value) => valuesEqual(value, operand));
    }
    default:
      throw new UnsupportedOperatorError(operator);
  }
}

function matchElement(element: MongoValue, condition: { [key: string]: MongoValue }): boolean {
  if (isObject(element) && !hasOperatorKey(condition)) {
    return matchesFilter(element, condition);
  }
  return matchOperatorObject([element], condition);
}

function matchField(document: MongoValue, path: string, condition: MongoValue): boolean {
  const values = resolvePath(document, path);
  if (hasOperatorKey(condition)) {
    return matchOperatorObject(values, condition);
  }
  if (isRegex(condition)) {
    return candidates(values).some((value) => typeof value === "string" && safeTest(condition, value));
  }
  return candidates(values).some((value) => valuesEqual(value, condition));
}

const UNSUPPORTED_TOP_LEVEL = new Set(["$expr", "$where", "$text", "$jsonSchema", "$comment"]);

/** Match one document against a Mongo query filter. */
export function matchesFilter(document: MongoValue, filter: { [key: string]: MongoValue }): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    if (key === "$and") {
      if (!isArray(condition)) throw new UnsupportedOperatorError("$and without an array");
      if (!condition.every((clause) => matchesFilter(document, requireObject(clause)))) return false;
      continue;
    }
    if (key === "$or") {
      if (!isArray(condition)) throw new UnsupportedOperatorError("$or without an array");
      if (!condition.some((clause) => matchesFilter(document, requireObject(clause)))) return false;
      continue;
    }
    if (key === "$nor") {
      if (!isArray(condition)) throw new UnsupportedOperatorError("$nor without an array");
      if (condition.some((clause) => matchesFilter(document, requireObject(clause)))) return false;
      continue;
    }
    if (UNSUPPORTED_TOP_LEVEL.has(key)) throw new UnsupportedOperatorError(key);
    if (key.startsWith("$")) throw new UnsupportedOperatorError(key);
    if (!matchField(document, key, condition)) return false;
  }
  return true;
}

function requireObject(value: MongoValue): { [key: string]: MongoValue } {
  if (!isObject(value)) throw new UnsupportedOperatorError("a non-document filter clause");
  return value;
}

function applyProjection(
  document: { [key: string]: MongoValue },
  projection: { [key: string]: MongoValue },
): { [key: string]: MongoValue } {
  const inclusion = Object.entries(projection).some(
    ([key, value]) => key !== "_id" && Boolean(value),
  );
  if (inclusion) {
    const out: { [key: string]: MongoValue } = {};
    for (const [key, value] of Object.entries(projection)) {
      if (value && key in document) out[key] = document[key] as MongoValue;
    }
    if (projection["_id"] === undefined && "_id" in document) out["_id"] = document["_id"] as MongoValue;
    return out;
  }
  const out: { [key: string]: MongoValue } = { ...document };
  for (const [key, value] of Object.entries(projection)) {
    if (!value) delete out[key];
  }
  return out;
}

export interface QueryPreviewOk {
  status: "ok";
  /** Matches after projection (capped to 1 for findOne). */
  matched: Record<string, unknown>[];
  /** Total matches before projection/capping. */
  total: number;
  /** True when the statement used findOne. */
  limitedToOne: boolean;
}

export type QueryPreview =
  | { status: "error"; error: string; position: number }
  | { status: "unsupported"; reason: string }
  | QueryPreviewOk;

/** Apply a parsed find/findOne statement to illustrative documents. Never touches a database. */
export function previewStatement(
  statement: ParsedStatement,
  documents: Record<string, unknown>[],
): QueryPreview {
  if (statement.method !== "find" && statement.method !== "findOne") {
    return { status: "unsupported", reason: "Preview only executes find/findOne queries." };
  }
  const filterValue = statement.args[0] ?? {};
  if (!isObject(filterValue)) return { status: "unsupported", reason: "Filter is not a document." };
  const projection = statement.args[1];
  if (projection !== undefined && !isObject(projection)) {
    return { status: "unsupported", reason: "Projection is not a document." };
  }

  try {
    const matches = documents.filter((document) => matchesFilter(asValue(document), filterValue));
    const limited = statement.method === "findOne" ? matches.slice(0, 1) : matches;
    const projected = projection
      ? limited.map((document) => applyProjection(asValue(document) as { [key: string]: MongoValue }, projection))
      : limited;
    return {
      status: "ok",
      matched: projected as Record<string, unknown>[],
      total: matches.length,
      limitedToOne: statement.method === "findOne",
    };
  } catch (error) {
    if (error instanceof UnsupportedOperatorError) {
      return { status: "unsupported", reason: error.message };
    }
    throw error;
  }
}

/** Parse a shell statement and preview its matches against sample documents. */
export function previewQuery(input: string, documents: Record<string, unknown>[]): QueryPreview {
  const parsed = parse(input);
  if (!parsed.ok) return { status: "error", error: parsed.error, position: parsed.position };
  return previewStatement(parsed.statement, documents);
}
