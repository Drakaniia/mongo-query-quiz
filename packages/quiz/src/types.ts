export type Difficulty = "easy" | "moderate" | "difficult";
export type OperationKind = "find" | "update";

export type MongoMethod = "find" | "findOne" | "updateOne" | "updateMany";

/** A regex literal authored in a problem or parsed from a submission. */
export class MongoRegex {
  readonly kind = "regex";
  constructor(
    public readonly pattern: string,
    public readonly flags: string,
  ) {}
}

/**
 * An opaque constructor-style value such as `ObjectId("...")` or `ISODate("...")`.
 * Compared by constructor name plus its literal argument(s).
 */
export class MongoTypedValue {
  readonly kind = "typed";
  constructor(
    public readonly ctor: string,
    public readonly literal: string,
  ) {}
}

export type MongoValue =
  | null
  | boolean
  | number
  | string
  | MongoValue[]
  | MongoRegex
  | MongoTypedValue
  | { [key: string]: MongoValue };

export type NormalizedDocument = { [key: string]: MongoValue };

export interface ParsedStatement {
  collection: string;
  method: MongoMethod;
  args: MongoValue[];
}

export type ParseResult =
  | { ok: true; statement: ParsedStatement }
  | { ok: false; error: string; position: number };

/** A single gradable facet of the expected query. */
export interface RubricItem {
  id: string;
  /** Human-readable label, e.g. "Filter condition" or "Update operators". */
  label: string;
  /** Weight in points; category defaults applied when omitted. */
  weight?: number;
  /** Machine-checkable expectation for this facet. */
  expectation: Expectation;
}

export type Expectation =
  | { kind: "collection"; name: string }
  | { kind: "method"; method: MongoMethod; equivalents?: MongoMethod[] }
  | { kind: "filter"; doc: NormalizedDocument; variants?: NormalizedDocument[] }
  | { kind: "projection"; doc: NormalizedDocument; variants?: NormalizedDocument[] }
  | { kind: "update"; doc: NormalizedDocument; variants?: NormalizedDocument[] }
  | { kind: "options"; doc: NormalizedDocument; variants?: NormalizedDocument[] };

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  operation: OperationKind;
  /** The real-world task shown to the user. */
  statement: string;
  /**
   * Substrings of `statement` that encode the operator clues — the conditions and the
   * requested output fields. Each entry must appear verbatim in `statement` so the UI can
   * highlight it in place.
   */
  clues: string[];
  /** Equivalent SQL for the task, translated into MongoDB shell syntax. */
  sql?: string;
  /** Source collection name, e.g. "users". */
  collection: string;
  /** Illustrative documents; used for display only, never executed. */
  sampleDocuments: Record<string, unknown>[];
  /** Ordered, progressively revealed hints (2-3). */
  hints: string[];
  /** The canonical reference answer in shell syntax (shown on demand). */
  referenceAnswer: string;
  /** Weighted rubric. */
  rubric: RubricItem[];
}

export interface ItemResult {
  itemId: string;
  label: string;
  passed: boolean;
  /** Points awarded. */
  earned: number;
  /** Maximum points (resolved weight). */
  max: number;
  /** Pretty-printed expected value/description. */
  expected: string;
  /** What the submission contained, or "missing". */
  actual: string;
}

export interface GradeResult {
  /** false = could not parse. */
  ok: boolean;
  /** 0-100, rounded. */
  score: number;
  /** All rubric items when ok; empty otherwise. */
  itemResults: ItemResult[];
  parseError?: string;
  parseErrorPosition?: number;
  /** Total points earned across the rubric. */
  earned: number;
  /** Total points available across the rubric. */
  total: number;
}

/** A configured run of the quiz. */
export interface QuizSessionConfig {
  /** Chosen difficulty mix; empty means "All". */
  difficulties: Difficulty[];
  /** Requested number of items (5 | 10 | 15). */
  count: number;
}

/** The resolved run: concrete problems in the order they will be presented. */
export interface QuizSession {
  config: QuizSessionConfig;
  problems: Problem[];
  /** True when the bank had fewer matches than config.count. */
  capped: boolean;
  availableCount: number;
}
