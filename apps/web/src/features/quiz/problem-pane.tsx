import { splitStatement, type Problem } from "@mongo/quiz";
import { Button } from "@mongo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";

import { DifficultyBadge } from "./difficulty-badge";
import { SampleDocuments } from "./sample-documents";

interface HighlightedStatementProps {
  statement: string;
  clues: string[];
}

/** Renders the statement with its operator clues emphasised in place. */
function HighlightedStatement({ statement, clues }: HighlightedStatementProps) {
  return (
    <p className="type-body">
      {splitStatement(statement, clues).map((segment, index) =>
        segment.highlighted ? (
          <mark
            key={index}
            className="rounded-[3px] bg-primary/15 px-0.5 font-semibold text-foreground ring-1 ring-primary/30 ring-inset"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

interface ProblemPaneProps {
  problem: Problem;
  revealedHints: number;
  onRevealHint: () => void;
}

export function ProblemPane({ problem, revealedHints, onRevealHint }: ProblemPaneProps) {
  const shown = Math.min(revealedHints, problem.hints.length);

  return (
    <Card className="animate-materialize min-h-0 overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="type-headline">{problem.title}</CardTitle>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="type-overline text-muted-foreground">Collection</span>
          <span className="font-mono text-sm font-medium">{problem.collection}</span>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-5 overflow-y-auto">
        <HighlightedStatement statement={problem.statement} clues={problem.clues} />

        {problem.sql ? (
          <figure className="flex flex-col gap-1.5 rounded-lg border bg-muted/40 p-3">
            <figcaption className="type-overline text-muted-foreground">
              SQL to translate
            </figcaption>
            <pre className="font-mono text-sm font-semibold whitespace-pre-wrap">
              {problem.sql}
            </pre>
          </figure>
        ) : null}

        <section className="flex flex-col gap-2">
          <h3 className="type-headline">Sample documents</h3>
          <SampleDocuments documents={problem.sampleDocuments} />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="type-headline">Hints</h3>
            <span className="type-caption tabular-nums text-muted-foreground">
              {shown}/{problem.hints.length} revealed
            </span>
          </div>
          <ol className="flex flex-col gap-2">
            {problem.hints.slice(0, shown).map((hint, index) => (
              <li
                key={hint}
                className="animate-materialize type-caption rounded-lg border bg-muted/40 p-2.5"
              >
                <span className="mr-1 font-semibold">Hint {index + 1}:</span>
                {hint}
              </li>
            ))}
          </ol>
          {shown < problem.hints.length ? (
            <Button variant="outline" size="sm" onClick={onRevealHint}>
              Reveal hint
            </Button>
          ) : (
            <p className="type-caption text-muted-foreground">
              All hints revealed. (No score penalty.)
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
