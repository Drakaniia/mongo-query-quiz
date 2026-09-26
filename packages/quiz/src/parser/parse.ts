import {
  MongoRegex,
  MongoTypedValue,
  type MongoMethod,
  type MongoValue,
  type ParseResult,
} from "../types.js";
import { tokenize, TokenizeError, type Token } from "./tokenizer.js";

class ParseError extends Error {
  constructor(
    message: string,
    public readonly position: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

const METHODS: readonly MongoMethod[] = ["find", "findOne", "updateOne", "updateMany"];

function isMethod(value: string): value is MongoMethod {
  return (METHODS as readonly string[]).includes(value);
}

function isPlainObject(
  value: MongoValue,
): value is { [key: string]: MongoValue } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof MongoRegex) &&
    !(value instanceof MongoTypedValue)
  );
}

class Parser {
  private readonly tokens: Token[];
  private pos = 0;

  constructor(input: string) {
    this.tokens = tokenize(input);
  }

  private peek(): Token {
    return this.tokens[this.pos] as Token;
  }

  private next(): Token {
    const token = this.tokens[this.pos] as Token;
    if (token.type !== "eof") this.pos += 1;
    return token;
  }

  private atPunct(value: string): boolean {
    const token = this.peek();
    return token.type === "punct" && token.value === value;
  }

  private expectPunct(value: string): Token {
    const token = this.peek();
    if (token.type !== "punct" || token.value !== value) {
      throw new ParseError(`Expected "${value}"`, token.start);
    }
    return this.next();
  }

  parseStatement(): { collection: string; method: MongoMethod; args: MongoValue[] } {
    const result = this.parseEnvelope();
    if (this.peek().type !== "eof") {
      throw new ParseError("Unexpected content after the statement", this.peek().start);
    }
    return result;
  }

  private parseEnvelope(): { collection: string; method: MongoMethod; args: MongoValue[] } {
    const dbToken = this.peek();
    if (dbToken.type !== "ident" || dbToken.value !== "db") {
      throw new ParseError('Expected a statement starting with "db"', dbToken.start);
    }
    this.next();

    this.expectPunct(".");

    const collToken = this.peek();
    if (collToken.type !== "ident") {
      throw new ParseError("Expected a collection name after db.", collToken.start);
    }
    this.next();

    this.expectPunct(".");

    const methodToken = this.peek();
    if (methodToken.type !== "ident") {
      throw new ParseError("Expected a method name", methodToken.start);
    }
    this.next();
    if (!isMethod(methodToken.value)) {
      throw new ParseError(
        `Unknown method "${methodToken.value}"; expected find, findOne, updateOne or updateMany`,
        methodToken.start,
      );
    }

    this.expectPunct("(");
    const args = this.parseArguments();
    this.expectPunct(")");

    // Optional trailing semicolon.
    if (this.atPunct(";")) this.next();

    const method = methodToken.value;
    this.validateArity(method, args, methodToken.start);

    return { collection: collToken.value, method, args };
  }

  private parseArguments(): MongoValue[] {
    const args: MongoValue[] = [];
    if (this.atPunct(")")) return args;
    for (;;) {
      args.push(this.parseValue());
      if (this.atPunct(",")) {
        this.next();
        continue;
      }
      break;
    }
    return args;
  }

  private validateArity(method: MongoMethod, args: MongoValue[], position: number): void {
    if (args.length > 3) {
      throw new ParseError(
        `Too many arguments for ${method}() (expected at most 3)`,
        position,
      );
    }
    if ((method === "updateOne" || method === "updateMany") && args.length < 2) {
      throw new ParseError(
        `${method}() requires a filter and an update document`,
        position,
      );
    }
    for (let i = 0; i < args.length; i += 1) {
      const arg = args[i] as MongoValue;
      if (!isPlainObject(arg)) {
        throw new ParseError(`Argument ${i + 1} of ${method}() must be an object`, position);
      }
    }
  }

  private parseValue(): MongoValue {
    const token = this.peek();

    if (token.type === "punct") {
      if (token.value === "{") return this.parseObject();
      if (token.value === "[") return this.parseArray();
      throw new ParseError(`Unexpected token "${token.value}"`, token.start);
    }

    if (token.type === "string") {
      this.next();
      return token.decoded ?? "";
    }

    if (token.type === "number") {
      this.next();
      return Number(token.value);
    }

    if (token.type === "regex") {
      this.next();
      return new MongoRegex(token.decoded ?? "", token.flags ?? "");
    }

    if (token.type === "ident") {
      if (token.value === "true") {
        this.next();
        return true;
      }
      if (token.value === "false") {
        this.next();
        return false;
      }
      if (token.value === "null") {
        this.next();
        return null;
      }
      // Constructor-style value, e.g. ObjectId("...").
      const nextToken = this.tokens[this.pos + 1];
      if (nextToken && nextToken.type === "punct" && nextToken.value === "(") {
        return this.parseTypedValue();
      }
      throw new ParseError(`Unexpected identifier "${token.value}"`, token.start);
    }

    throw new ParseError("Expected a value", token.start);
  }

  private parseTypedValue(): MongoTypedValue {
    const ctorToken = this.next();
    this.expectPunct("(");
    const args: MongoValue[] = [];
    if (!this.atPunct(")")) {
      for (;;) {
        args.push(this.parseValue());
        if (this.atPunct(",")) {
          this.next();
          continue;
        }
        break;
      }
    }
    this.expectPunct(")");
    return new MongoTypedValue(ctorToken.value, literalOf(args));
  }

  private parseObject(): { [key: string]: MongoValue } {
    this.expectPunct("{");
    const result: { [key: string]: MongoValue } = {};
    if (this.atPunct("}")) {
      this.next();
      return result;
    }
    for (;;) {
      const keyToken = this.peek();
      let key: string;
      if (keyToken.type === "ident") key = keyToken.value;
      else if (keyToken.type === "string") key = keyToken.decoded ?? "";
      else if (keyToken.type === "number") key = keyToken.value;
      else throw new ParseError("Expected an object key", keyToken.start);
      this.next();

      this.expectPunct(":");
      result[key] = this.parseValue();

      if (this.atPunct(",")) {
        this.next();
        if (this.atPunct("}")) {
          this.next();
          return result;
        }
        continue;
      }
      this.expectPunct("}");
      return result;
    }
  }

  private parseArray(): MongoValue[] {
    this.expectPunct("[");
    const result: MongoValue[] = [];
    if (this.atPunct("]")) {
      this.next();
      return result;
    }
    for (;;) {
      result.push(this.parseValue());
      if (this.atPunct(",")) {
        this.next();
        if (this.atPunct("]")) {
          this.next();
          return result;
        }
        continue;
      }
      this.expectPunct("]");
      return result;
    }
  }
}

function literalOf(args: MongoValue[]): string {
  if (args.length === 1 && typeof args[0] === "string") return args[0];
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) return JSON.stringify(arg);
      return String(arg);
    })
    .join(",");
}

/** Parse a MongoDB shell statement into a structured AST. */
export function parse(input: string): ParseResult {
  if (input.trim().length === 0) {
    return { ok: false, error: "Enter a query", position: 0 };
  }
  try {
    const parser = new Parser(input);
    const statement = parser.parseStatement();
    return { ok: true, statement };
  } catch (error) {
    if (error instanceof ParseError) {
      return { ok: false, error: error.message, position: error.position };
    }
    if (error instanceof TokenizeError) {
      return { ok: false, error: error.message, position: error.position };
    }
    return { ok: false, error: "Could not parse the query", position: 0 };
  }
}
