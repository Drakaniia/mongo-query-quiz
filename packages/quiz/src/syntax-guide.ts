/**
 * Learner-facing explanation of a parse failure. The parser reports terse messages and a
 * character offset; this module turns them into a friendly summary, the exact line and column,
 * targeted fixes, and a syntax cheat-sheet the UI can show instead of a bare error string.
 */

export interface SyntaxHint {
  /** One actionable sentence. Backticked spans render as inline code in the UI. */
  text: string;
  /** A corrected fragment the learner can copy into their answer. */
  example?: string;
}

export interface SyntaxGuidance {
  /** Friendly restatement of the failure, without parser jargon. */
  summary: string;
  /** 1-based line the parser stopped on. */
  line: number;
  /** 1-based column the parser stopped on. */
  column: number;
  /** The source line the parser stopped on; empty for an empty submission. */
  lineText: string;
  /** Character range inside `lineText` to emphasise; empty only at the end of a line. */
  highlight: { start: number; end: number };
  /** Targeted tips for this failure, most relevant first. */
  hints: SyntaxHint[];
  /** Canonical statement shapes to copy from. */
  template: string;
  /** Universal syntax checklist shown alongside any failure. */
  checklist: string[];
}

/** Canonical shell shapes, mirroring the reference answers in the problem bank. */
export const SYNTAX_TEMPLATE = [
  "db.collection.find({ field: value })",
  "db.collection.updateOne({ field: value }, { $set: { field: value } })",
].join("\n");

/** The mistakes that sink most first attempts. */
export const SYNTAX_CHECKLIST: readonly string[] = [
  "Start with `db.<collection>.<method>(...)`.",
  "`find` and `findOne` read documents; `updateOne` and `updateMany` change them.",
  "Every argument is a document in `{ }`, and fields inside it are separated by commas.",
  "A field and its value are joined by `:`, never `=`.",
  'Text values go in quotes (`"shipped"`); numbers and `true`/`false`/`null` stay bare.',
  "Close everything you open: `{ }`, `[ ]`, `( )`.",
  "Submit one statement; a trailing `;` is optional.",
];

interface Explanation {
  summary: string;
  hints: SyntaxHint[];
}

function hint(text: string, example?: string): SyntaxHint {
  return example === undefined ? { text } : { text, example };
}

const BRACKET_PAIRS: Record<string, { open: string; label: string }> = {
  "}": { open: "{", label: "document" },
  "]": { open: "[", label: "array" },
  ")": { open: "(", label: "call" },
};

const SMART_QUOTES = new Set(["“", "”", "‘", "’"]);

function explainError(message: string): Explanation {
  if (message === "Enter a query") {
    return {
      summary: "There is nothing to grade yet — the answer box is empty.",
      hints: [
        hint(
          "Write the statement you want graded, then submit again.",
          'db.products.find({ category: "books" })',
        ),
      ],
    };
  }

  if (/Unterminated string literal/.test(message)) {
    return {
      summary: "A quoted string is missing its closing quote.",
      hints: [
        hint(
          "Close the string with the same quote character you opened it with.",
          'db.orders.find({ status: "shipped" })',
        ),
        hint("Only values need quotes — field names can stay bare.", '{ category: "books" }'),
      ],
    };
  }

  if (/Unterminated regular expression/.test(message)) {
    return {
      summary: "A `/regex/` literal is missing its closing `/`.",
      hints: [hint("Add the closing slash, then any flags.", "/@gmail\\.com$/i")],
    };
  }

  if (/Unterminated block comment/.test(message)) {
    return {
      summary: "A `/* ... */` comment is never closed.",
      hints: [hint("Add `*/` where the comment ends.")],
    };
  }

  const unexpectedChar = /^Unexpected character "(.)"$/.exec(message);
  if (unexpectedChar) {
    const character = unexpectedChar[1] as string;
    const hints: SyntaxHint[] = [];
    if (character === "=") {
      hints.push(hint("Use `:` between a field and its value, not `=`.", "{ price: { $lt: 20 } }"));
    } else if (SMART_QUOTES.has(character)) {
      hints.push(
        hint("Typographic quotes are not shell syntax — use a straight quote.", '"shipped"'),
      );
    }
    hints.push(hint("Valid punctuation is `{ } [ ] ( ) , : . ;` — remove anything else."));
    return {
      summary: `The character \`${character}\` is not part of the shell syntax.`,
      hints,
    };
  }

  if (/starting with "db"/.test(message)) {
    return {
      summary: "A statement has to start with `db`.",
      hints: [
        hint("Open with `db.<collection>.<method>(...)`.", 'db.orders.find({ status: "shipped" })'),
        hint("`db` is the shell's handle for the current database; it is always lowercase."),
      ],
    };
  }

  if (/collection name/.test(message)) {
    return {
      summary: "`db.` is not followed by a collection name.",
      hints: [
        hint(
          "Name the collection directly after `db.`, using the collection from the task.",
          "db.orders",
        ),
      ],
    };
  }

  const unknownMethod = /^Unknown method "([^"]+)"/.exec(message);
  if (unknownMethod) {
    return {
      summary: `\`${unknownMethod[1]}\` is not one of the methods this quiz grades.`,
      hints: [
        hint("Reads use `find` or `findOne`; writes use `updateOne` or `updateMany`."),
        hint(
          "Update methods take two documents: the filter and the update.",
          'db.orders.updateOne({ _id: 102 }, { $set: { status: "delivered" } })',
        ),
      ],
    };
  }

  if (/Expected a method name/.test(message)) {
    return {
      summary: "A method name is missing after the collection.",
      hints: [
        hint(
          "Use one of `find`, `findOne`, `updateOne` or `updateMany`.",
          'db.orders.find({ status: "shipped" })',
        ),
      ],
    };
  }

  if (/requires a filter and an update/.test(message)) {
    return {
      summary: "`updateOne` and `updateMany` need two documents, but only one was given.",
      hints: [
        hint(
          "Pass the filter first, then the update document.",
          'db.orders.updateOne({ _id: 102 }, { $set: { status: "delivered" } })',
        ),
      ],
    };
  }

  if (/must be an object/.test(message)) {
    return {
      summary: "An argument is not a document wrapped in `{ }`.",
      hints: [
        hint(
          "Every argument is a document — wrap it in braces.",
          'db.products.find({ category: "books" })',
        ),
      ],
    };
  }

  if (/Too many arguments/.test(message)) {
    return {
      summary: "The call passes more arguments than the method accepts.",
      hints: [
        hint(
          "`find` and `findOne` take a filter, then an optional projection; update methods take a filter and an update.",
        ),
      ],
    };
  }

  if (/^Expected ":"$/.test(message)) {
    return {
      summary: "A field name is not followed by `:`.",
      hints: [hint("Join each field to its value with a colon.", '{ category: "books" }')],
    };
  }

  const missingBracket = /^Expected "([}\]])"$/.exec(message);
  if (missingBracket) {
    const closer = missingBracket[1] as string;
    const pair = BRACKET_PAIRS[closer] as { open: string; label: string };
    return {
      summary: `A \`${pair.open}\` is never closed by \`${closer}\`, or a comma between fields is missing.`,
      hints: [
        hint(`Add the matching \`${closer}\` where the ${pair.label} ends.`),
        hint("Check the commas between entries — `{ a: 1, b: 2 }`."),
        hint("Every bracket has a partner: `{ }`, `[ ]`, `( )`."),
      ],
    };
  }

  if (/Expected a value/.test(message)) {
    return {
      summary: "A field or array slot is waiting for a value.",
      hints: [hint("Give every field a value after its colon.", "{ price: { $lt: 20 } }")],
    };
  }

  if (/Expected an object key/.test(message)) {
    return {
      summary: "A document expects a field name here.",
      hints: [
        hint(
          "Documents are `{ field: value }` pairs — look for a stray comma or bracket.",
          '{ status: "shipped" }',
        ),
      ],
    };
  }

  const bareIdentifier = /^Unexpected identifier "([^"]+)"$/.exec(message);
  if (bareIdentifier) {
    return {
      summary: `\`${bareIdentifier[1]}\` is a bare value the shell cannot read.`,
      hints: [
        hint(
          'Wrap text in quotes (`"shipped"`); numbers, `true`, `false` and `null` stay bare.',
          'db.orders.find({ status: "shipped" })',
        ),
        hint(
          "If it is a constructor such as `ObjectId`, call it with parentheses.",
          'ObjectId("66f1a2b3c4d5e6f7a8b9c0da")',
        ),
      ],
    };
  }

  const strayToken = /^Unexpected token "([^"]+)"$/.exec(message);
  if (strayToken) {
    return {
      summary: `There is a stray \`${strayToken[1]}\` here.`,
      hints: [hint("Remove it, or replace it with the punctuation this spot needs.")],
    };
  }

  if (/Unexpected content after the statement/.test(message)) {
    return {
      summary: "There is extra content after the end of the statement.",
      hints: [
        hint("Submit a single statement; a trailing `;` is fine, a second `db.…` call is not."),
      ],
    };
  }

  return {
    summary: "The statement does not parse yet.",
    hints: [hint("Compare it with the template below and check the brackets, commas and quotes.")],
  };
}

interface Location {
  line: number;
  column: number;
  lineText: string;
}

/** Map a 0-based character offset onto a 1-based line and 0-based column. */
function locate(input: string, position: number): Location {
  const safePosition = Number.isFinite(position) ? Math.round(position) : 0;
  const offset = Math.max(0, Math.min(input.length, safePosition));
  const before = input.slice(0, offset);
  const lines = input.split("\n");
  const lineIndex = before.split("\n").length - 1;
  const lineStart = before.lastIndexOf("\n") + 1;
  return {
    line: lineIndex + 1,
    column: offset - lineStart,
    lineText: lines[lineIndex] ?? "",
  };
}

/** Emphasise the run of non-space characters at the error offset, staying inside the line. */
function highlightRange(lineText: string, column: number): { start: number; end: number } {
  const start = Math.max(0, Math.min(lineText.length, column));
  let end = start;
  while (end < lineText.length && !/\s/.test(lineText[end] as string)) end += 1;
  if (end === start && start < lineText.length) end = start + 1;
  return { start, end };
}

/**
 * Explain a parse failure in learner-facing terms. `error` and `position` are exactly the values
 * `parse()` (and therefore `grade()`) reports; the returned location is always inside `input`.
 */
export function explainSyntaxError(input: string, error: string, position: number): SyntaxGuidance {
  const location = locate(input, position);
  const explanation = explainError(error);
  const highlight = highlightRange(location.lineText, location.column);

  return {
    summary: explanation.summary,
    line: location.line,
    column: Math.min(location.column, location.lineText.length) + 1,
    lineText: location.lineText,
    highlight,
    hints: explanation.hints,
    template: SYNTAX_TEMPLATE,
    checklist: [...SYNTAX_CHECKLIST],
  };
}
