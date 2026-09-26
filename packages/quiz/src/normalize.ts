import { formatValue } from "./format.js";
import { MongoRegex, MongoTypedValue, type MongoValue, type NormalizedDocument } from "./types.js";

function isObject(value: MongoValue): value is { [key: string]: MongoValue } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof MongoRegex) &&
    !(value instanceof MongoTypedValue)
  );
}

function sortFlags(flags: string): string {
  return [...flags].sort().join("");
}

function isPlainClause(value: MongoValue): value is { [key: string]: MongoValue } {
  if (!isObject(value)) return false;
  return Object.keys(value).every((key) => !key.startsWith("$"));
}

/**
 * Canonicalize a value so provably-equivalent forms compare equal:
 * sorted object keys, flattened `$and`, collapsed single-element `$in` and `$eq`,
 * and canonical regex flags. Conservative by construction.
 */
export function normalize(value: MongoValue): MongoValue {
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry));
  }
  if (value instanceof MongoRegex) {
    return new MongoRegex(value.pattern, sortFlags(value.flags));
  }
  if (value instanceof MongoTypedValue) {
    return new MongoTypedValue(value.ctor, value.literal);
  }
  if (isObject(value)) {
    return normalizeObject(value);
  }
  return value;
}

function normalizeObject(input: { [key: string]: MongoValue }): NormalizedDocument {
  const entries: { [key: string]: MongoValue } = {};
  for (const [key, raw] of Object.entries(input)) {
    entries[key] = normalize(raw);
  }

  // `$and`/`$or`/`$nor` are sets: order does not change meaning.
  for (const key of ["$and", "$or", "$nor"]) {
    const value = entries[key];
    if (Array.isArray(value)) {
      entries[key] = [...value].sort((a, b) => (formatValue(a) < formatValue(b) ? -1 : 1));
    }
  }

  // Flatten and merge `$and` clauses that can be expressed as an implicit AND.
  const andValue = entries["$and"];
  if (Array.isArray(andValue)) {
    const flattened = flattenAnd(andValue);
    const rest: MongoValue[] = [];
    for (const clause of flattened) {
      if (isPlainClause(clause) || (flattened.length === 1 && isObject(clause))) {
        for (const [key, value] of Object.entries(clause)) {
          // Existing explicit keys win over merged ones.
          if (!(key in entries)) entries[key] = value;
        }
      } else {
        rest.push(clause);
      }
    }
    if (rest.length === 0) {
      delete entries["$and"];
    } else {
      entries["$and"] = rest;
    }
  }

  // Collapse `$eq: x` to `x`.
  for (const [key, value] of Object.entries(entries)) {
    if (isObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === "$eq" && "$eq" in value) {
        entries[key] = value["$eq"] as MongoValue;
      }
    }
  }

  // Collapse `$in: [x]` to `$eq`/bare equality.
  for (const [key, value] of Object.entries(entries)) {
    if (isObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === "$in" && Array.isArray(value["$in"])) {
        const list = value["$in"] as MongoValue[];
        if (list.length === 1) entries[key] = list[0] as MongoValue;
      }
    }
  }

  const sorted: NormalizedDocument = {};
  for (const key of Object.keys(entries).sort()) {
    sorted[key] = entries[key] as MongoValue;
  }
  return sorted;
}

function flattenAnd(list: MongoValue[]): MongoValue[] {
  const out: MongoValue[] = [];
  for (const item of list) {
    if (isObject(item)) {
      const keys = Object.keys(item);
      if (keys.length === 1 && keys[0] === "$and" && Array.isArray(item["$and"])) {
        out.push(...flattenAnd(item["$and"] as MongoValue[]));
        continue;
      }
    }
    out.push(item);
  }
  return out;
}

/** Normalize a document (top-level object). */
export function normalizeDocument(doc: NormalizedDocument): NormalizedDocument {
  const normalized = normalize(doc);
  return isObject(normalized) ? normalized : {};
}

/** Deep structural equality over normalized values. */
export function deepEqual(a: MongoValue, b: MongoValue): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;

  if (typeof a === "number" && typeof b === "number") {
    return a === b;
  }

  if (a instanceof MongoRegex || b instanceof MongoRegex) {
    return (
      a instanceof MongoRegex &&
      b instanceof MongoRegex &&
      a.pattern === b.pattern &&
      a.flags === b.flags
    );
  }

  if (a instanceof MongoTypedValue || b instanceof MongoTypedValue) {
    return (
      a instanceof MongoTypedValue &&
      b instanceof MongoTypedValue &&
      a.ctor === b.ctor &&
      a.literal === b.literal
    );
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((entry, index) => deepEqual(entry, b[index] as MongoValue));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((key, index) => key === bKeys[index])) return false;
    return aKeys.every((key) =>
      deepEqual((a as { [key: string]: MongoValue })[key] as MongoValue, (b as { [key: string]: MongoValue })[key] as MongoValue),
    );
  }

  return false;
}

/** True when two documents match after normalization. */
export function documentsMatch(
  actual: Record<string, MongoValue>,
  expected: NormalizedDocument,
): boolean {
  return deepEqual(normalizeDocument(actual), normalizeDocument(expected));
}
