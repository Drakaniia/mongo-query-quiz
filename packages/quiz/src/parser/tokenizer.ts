export type TokenType = "ident" | "number" | "string" | "regex" | "punct" | "eof";

export interface Token {
  type: TokenType;
  /** Raw source text for the token (for punctuators, the punctuator itself). */
  value: string;
  /** For strings/regex: the decoded body, or regex pattern. */
  decoded?: string;
  /** For regex tokens: trailing flags. */
  flags?: string;
  /** Index of the first character of the token. */
  start: number;
  /** Index one past the last character of the token. */
  end: number;
}

export class TokenizeError extends Error {
  constructor(
    message: string,
    public readonly position: number,
  ) {
    super(message);
    this.name = "TokenizeError";
  }
}

const PUNCTUATORS = new Set(["(", ")", "{", "}", "[", "]", ",", ":", ".", ";"]);

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v";
}

/**
 * Tokenize MongoDB shell syntax. Unlike JavaScript, division never appears in this
 * grammar, so any `/` outside a string or comment starts a regex literal.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i] as string;

    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }

    // Line comment.
    if (ch === "/" && input[i + 1] === "/") {
      i += 2;
      while (i < len && input[i] !== "\n") i += 1;
      continue;
    }

    // Block comment.
    if (ch === "/" && input[i + 1] === "*") {
      const startComment = i;
      i += 2;
      let closed = false;
      while (i < len) {
        if (input[i] === "*" && input[i + 1] === "/") {
          i += 2;
          closed = true;
          break;
        }
        i += 1;
      }
      if (!closed) {
        throw new TokenizeError("Unterminated block comment", startComment);
      }
      continue;
    }

    // Strings.
    if (ch === '"' || ch === "'") {
      const start = i;
      const quote = ch;
      i += 1;
      let decoded = "";
      let closed = false;
      while (i < len) {
        const c = input[i] as string;
        if (c === "\\") {
          const next = input[i + 1];
          if (next === undefined) break;
          decoded += decodeEscape(next);
          i += 2;
          continue;
        }
        if (c === quote) {
          i += 1;
          closed = true;
          break;
        }
        decoded += c;
        i += 1;
      }
      if (!closed) {
        throw new TokenizeError("Unterminated string literal", start);
      }
      tokens.push({ type: "string", value: input.slice(start, i), decoded, start, end: i });
      continue;
    }

    // Regex literal.
    if (ch === "/") {
      const start = i;
      i += 1;
      let pattern = "";
      let closed = false;
      while (i < len) {
        const c = input[i] as string;
        if (c === "\\") {
          const next = input[i + 1];
          if (next === undefined) break;
          pattern += c + next;
          i += 2;
          continue;
        }
        if (c === "/") {
          i += 1;
          closed = true;
          break;
        }
        if (c === "\n") break;
        pattern += c;
        i += 1;
      }
      if (!closed) {
        throw new TokenizeError("Unterminated regular expression literal", start);
      }
      let flags = "";
      while (i < len && /[a-z]/i.test(input[i] as string)) {
        flags += input[i] as string;
        i += 1;
      }
      tokens.push({ type: "regex", value: input.slice(start, i), decoded: pattern, flags, start, end: i });
      continue;
    }

    // Numbers (optionally signed).
    if (isDigit(ch) || (ch === "-" && isDigit(input[i + 1] ?? ""))) {
      const start = i;
      if (ch === "-") i += 1;
      while (i < len && isDigit(input[i] as string)) i += 1;
      if (input[i] === ".") {
        i += 1;
        while (i < len && isDigit(input[i] as string)) i += 1;
      }
      if (input[i] === "e" || input[i] === "E") {
        i += 1;
        if (input[i] === "+" || input[i] === "-") i += 1;
        while (i < len && isDigit(input[i] as string)) i += 1;
      }
      tokens.push({ type: "number", value: input.slice(start, i), start, end: i });
      continue;
    }

    // Identifiers / keywords.
    if (isIdentStart(ch)) {
      const start = i;
      i += 1;
      while (i < len && isIdentPart(input[i] as string)) i += 1;
      tokens.push({ type: "ident", value: input.slice(start, i), start, end: i });
      continue;
    }

    // Punctuation.
    if (PUNCTUATORS.has(ch)) {
      tokens.push({ type: "punct", value: ch, start: i, end: i + 1 });
      i += 1;
      continue;
    }

    throw new TokenizeError(`Unexpected character ${JSON.stringify(ch)}`, i);
  }

  tokens.push({ type: "eof", value: "", start: len, end: len });
  return tokens;
}

function decodeEscape(ch: string): string {
  switch (ch) {
    case "n":
      return "\n";
    case "t":
      return "\t";
    case "r":
      return "\r";
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "v":
      return "\v";
    case "0":
      return "\0";
    default:
      return ch;
  }
}
