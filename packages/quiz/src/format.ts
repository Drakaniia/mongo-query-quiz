import { parse } from "./parser/parse.js";
import { MongoRegex, MongoTypedValue, type MongoValue, type ParsedStatement } from "./types.js";

function toJsonLike(value: MongoValue): unknown {
  if (value instanceof MongoRegex) {
    return `/${value.pattern}/${value.flags}`;
  }
  if (value instanceof MongoTypedValue) {
    return `${value.ctor}(${JSON.stringify(value.literal)})`;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toJsonLike(entry));
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = toJsonLike(entry);
    }
    return out;
  }
  return value;
}

/** Render a value as pretty-printed, JSON-like text. */
export function formatValue(value: MongoValue): string {
  if (value instanceof MongoRegex) return `/${value.pattern}/${value.flags}`;
  if (value instanceof MongoTypedValue) {
    return `${value.ctor}(${JSON.stringify(value.literal)})`;
  }
  if (typeof value === "string") return JSON.stringify(value);
  return JSON.stringify(toJsonLike(value), null, 2) ?? String(value);
}

function indentBlock(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

/** Render a parsed statement as multi-line, JSON-formatted shell syntax. */
export function formatParsedStatement(statement: ParsedStatement): string {
  const opening = `db.${statement.collection}.${statement.method}(`;
  if (statement.args.length === 0) return `${opening})`;
  const body = statement.args.map((arg) => indentBlock(formatValue(arg), 2)).join(",\n");
  return `${opening}\n${body}\n)`;
}

/** Format a shell statement as multi-line JSON, or undefined when it does not parse. */
export function formatStatement(input: string): string | undefined {
  const parsed = parse(input);
  if (!parsed.ok) return undefined;
  return formatParsedStatement(parsed.statement);
}
