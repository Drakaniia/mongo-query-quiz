import { COUNT_PRESETS, DIFFICULTIES } from "./session.js";
import { MongoRegex, MongoTypedValue } from "./types.js";
import type {
  Difficulty,
  MongoValue,
  NormalizedDocument,
  OperationKind,
  Problem,
  QuizSessionConfig,
} from "./types.js";

/** ["find", "update"] — canonical operation order for the UI. */
export const OPERATION_KINDS: readonly OperationKind[] = ["find", "update"];

const DEFAULT_COUNT = 30;

/** Curated order for the operators the UI renders; unknown ones sort after these, A-Z. */
export const QUERY_OPERATOR_ORDER: readonly string[] = [
  "$eq",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$nin",
  "$all",
  "$elemMatch",
  "$size",
  "$exists",
  "$type",
  "$mod",
  "$regex",
  "$options",
  "$not",
  "$or",
  "$and",
  "$nor",
  "$expr",
];

/** Curated order for update operators; unknown ones sort after these, A-Z. */
export const UPDATE_OPERATOR_ORDER: readonly string[] = [
  "$set",
  "$unset",
  "$inc",
  "$mul",
  "$min",
  "$max",
  "$rename",
  "$currentDate",
  "$setOnInsert",
  "$push",
  "$addToSet",
  "$pop",
  "$pull",
  "$pullAll",
];

function isDocument(value: MongoValue): value is NormalizedDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof MongoRegex) &&
    !(value instanceof MongoTypedValue)
  );
}

/** Collect every `$`-prefixed key reachable from a value; arrays and documents recurse. */
function collectKeys(value: MongoValue, found: Set<string>, seen: Set<NormalizedDocument>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, found, seen);
    return;
  }
  if (!isDocument(value) || seen.has(value)) return;
  seen.add(value);
  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith("$")) found.add(key);
    collectKeys(entry, found, seen);
  }
}

function operatorsFor(problem: Problem, kind: "filter" | "update"): string[] {
  const found = new Set<string>();
  const seen = new Set<NormalizedDocument>();
  for (const item of problem.rubric) {
    const expectation = item.expectation;
    if (expectation.kind !== kind) continue;
    collectKeys(expectation.doc, found, seen);
    for (const variant of expectation.variants ?? []) collectKeys(variant, found, seen);
  }
  return [...found];
}

function ordered(operators: Iterable<string>, curated: readonly string[]): string[] {
  const rank = new Map(curated.map((operator, index) => [operator, index]));
  return [...new Set(operators)].sort((a, b) => {
    const left = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const right = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (left !== right) return left - right;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/** Query operators used by this problem, deduped, sorted by QUERY_OPERATOR_ORDER then A-Z. */
export function queryOperatorsOf(problem: Problem): string[] {
  return ordered(operatorsFor(problem, "filter"), QUERY_OPERATOR_ORDER);
}

/** Update operators used by this problem, same ordering rule with UPDATE_OPERATOR_ORDER. */
export function updateOperatorsOf(problem: Problem): string[] {
  return ordered(operatorsFor(problem, "update"), UPDATE_OPERATOR_ORDER);
}

/** Every query operator that occurs anywhere in the bank, same ordering rule. */
export function collectQueryOperators(bank: readonly Problem[]): string[] {
  return ordered(
    bank.flatMap((problem) => operatorsFor(problem, "filter")),
    QUERY_OPERATOR_ORDER,
  );
}

/** Every update operator that occurs anywhere in the bank, same ordering rule. */
export function collectUpdateOperators(bank: readonly Problem[]): string[] {
  return ordered(
    bank.flatMap((problem) => operatorsFor(problem, "update")),
    UPDATE_OPERATOR_ORDER,
  );
}

/** True when the problem satisfies the difficulty, operation and operator constraints. */
export function matchesConfig(problem: Problem, config: QuizSessionConfig): boolean {
  if (config.difficulties.length > 0 && !config.difficulties.includes(problem.difficulty)) {
    return false;
  }
  if (config.operations.length > 0 && !config.operations.includes(problem.operation)) return false;
  if (config.queryOperators.length > 0 && problem.operation === "find") {
    if (!queryOperatorsOf(problem).some((operator) => config.queryOperators.includes(operator))) {
      return false;
    }
  }
  if (config.updateOperators.length > 0 && problem.operation === "update") {
    if (!updateOperatorsOf(problem).some((operator) => config.updateOperators.includes(operator))) {
      return false;
    }
  }
  return true;
}

/** Number of problems in the bank that satisfy the config. */
export function countMatching(bank: readonly Problem[], config: QuizSessionConfig): number {
  let total = 0;
  for (const problem of bank) {
    if (matchesConfig(problem, config)) total += 1;
  }
  return total;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function operatorList(value: unknown): string[] {
  return stringList(value).filter((operator) => operator.startsWith("$"));
}

/** Parse an unknown value (e.g. restored localStorage state) into a valid config. Never throws. */
export function normalizeConfig(value: unknown): QuizSessionConfig {
  const source = isRecord(value) ? value : {};
  const count = source["count"];
  return {
    difficulties: stringList(source["difficulties"]).filter((entry): entry is Difficulty =>
      DIFFICULTIES.includes(entry as Difficulty),
    ),
    count: COUNT_PRESETS.includes(count as (typeof COUNT_PRESETS)[number])
      ? (count as number)
      : DEFAULT_COUNT,
    operations: stringList(source["operations"]).filter((entry): entry is OperationKind =>
      OPERATION_KINDS.includes(entry as OperationKind),
    ),
    queryOperators: operatorList(source["queryOperators"]),
    updateOperators: operatorList(source["updateOperators"]),
  };
}
