import { explainSyntaxError, type GradeResult, type SyntaxGuidance } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";
import { useMemo } from "react";

/** Render `backticked` spans in guidance copy as inline code. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="rounded bg-background/70 px-1 py-px font-mono text-[0.9em]">
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

/** The failing line with the error offset marked and a caret underneath it. */
function ErrorFrame({ guidance }: { guidance: SyntaxGuidance }) {
  const { lineText, highlight, line, column } = guidance;
  const start = Math.min(highlight.start, lineText.length);
  const end = Math.max(start, Math.min(highlight.end, lineText.length));
  const gutter = `${String(line).padStart(2, " ")} | `;
  const caretIndent = lineText.slice(0, start).replace(/[^\t]/g, " ");
  const caret = "^".repeat(Math.max(1, end - start));

  return (
    <div className="flex flex-col gap-1.5">
      <span className="type-caption tabular-nums text-muted-foreground">
        Line {line}, column {column}
      </span>
      <pre className="overflow-x-auto rounded-lg border border-amber-500/30 bg-background/70 px-2.5 py-2 font-mono text-xs leading-relaxed whitespace-pre">
        <span aria-hidden className="select-none text-muted-foreground">
          {gutter}
        </span>
        <span>{lineText.slice(0, start)}</span>
        {end > start ? (
          <mark className="rounded-[3px] bg-amber-500/25 px-0.5 font-semibold text-foreground">
            {lineText.slice(start, end)}
          </mark>
        ) : null}
        <span>{lineText.slice(end)}</span>
        {"\n"}
        <span aria-hidden className="select-none">
          {`${" ".repeat(gutter.length)}${caretIndent}`}
        </span>
        <span aria-hidden className="font-semibold text-amber-600 dark:text-amber-400">
          {caret}
        </span>
      </pre>
    </div>
  );
}

interface SyntaxFeedbackProps {
  /** The exact submission the result came from. */
  input: string;
  result: GradeResult;
}

/**
 * Replaces the bare parse error with a guide: what failed, the exact line and column, targeted
 * fixes, and the canonical shell shapes. Nothing here is graded, so it reads as advisory rather
 * than destructive.
 */
export function SyntaxFeedback({ input, result }: SyntaxFeedbackProps) {
  const parseError = result.parseError;
  const position = result.parseErrorPosition ?? 0;
  const guidance = useMemo(
    () => explainSyntaxError(input, parseError ?? "", position),
    [input, parseError, position],
  );

  if (result.ok || parseError === undefined) return null;

  return (
    <section
      aria-label="Syntax guidance"
      className="animate-materialize flex flex-col gap-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 dark:border-amber-400/30 dark:bg-amber-400/10"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Not graded</Badge>
        <h3 className="type-headline">
          <RichText text={guidance.summary} />
        </h3>
      </div>

      {guidance.lineText.length > 0 ? <ErrorFrame guidance={guidance} /> : null}

      <ul className="flex flex-col gap-2">
        {guidance.hints.map((item) => (
          <li key={item.text} className="type-caption flex flex-col gap-1">
            <span>
              <span className="mr-1 font-semibold">Hint:</span>
              <RichText text={item.text} />
            </span>
            {item.example ? (
              <code className="w-fit rounded bg-background/70 px-1.5 py-0.5 font-mono text-[0.7rem]">
                {item.example}
              </code>
            ) : null}
          </li>
        ))}
      </ul>

      <details className="rounded-lg border border-amber-500/30 bg-background/60">
        <summary className="type-caption cursor-pointer px-3 py-2 font-semibold select-none">
          MongoDB shell syntax guide
        </summary>
        <div className="flex flex-col gap-3.5 border-t border-amber-500/30 px-3 py-3">
          <div className="flex flex-col gap-1.5">
            <span className="type-overline text-muted-foreground">Statement shape</span>
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-xs whitespace-pre">
              {guidance.template}
            </pre>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="type-overline text-muted-foreground">Checklist</span>
            <ul className="type-caption flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
              {guidance.checklist.map((item) => (
                <li key={item}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          </div>
          <p className="type-caption text-muted-foreground">
            Parser message: <code className="font-mono">{parseError}</code>
          </p>
        </div>
      </details>
    </section>
  );
}
