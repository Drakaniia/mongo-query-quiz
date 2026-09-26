import type { GradeResult, Problem } from "@mongo/quiz";
import { Button } from "@mongo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";
import { Label } from "@mongo/ui/components/label";
import { Textarea } from "@mongo/ui/components/textarea";
import { useEffect, useState } from "react";

import { AnswerDisplay } from "./answer-display";
import { MatchPreview } from "./match-preview";
import { RubricFeedback } from "./rubric-feedback";
import { ScoreDisplay } from "./score-display";

interface AnswerPaneProps {
  problem: Problem;
  result: GradeResult | undefined;
  bestScore: number | undefined;
  answerRevealed: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onSubmit: (input: string) => void;
  onRevealAnswer: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function AnswerPane({
  problem,
  result,
  bestScore,
  answerRevealed,
  canPrevious,
  canNext,
  onSubmit,
  onRevealAnswer,
  onPrevious,
  onNext,
}: AnswerPaneProps) {
  const [input, setInput] = useState("");

  useEffect(() => {
    setInput("");
  }, [problem.id]);

  const handleSubmit = () => {
    onSubmit(input);
  };

  return (
    <Card className="animate-materialize min-h-0 overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="type-headline">Your answer</CardTitle>
          {bestScore !== undefined ? (
            <span className="type-caption tabular-nums text-muted-foreground">
              Best: {bestScore}%
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <Label htmlFor="quiz-answer">MongoDB shell statement</Label>
          <Textarea
            id="quiz-answer"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-28 font-mono"
            spellCheck={false}
          />
          <p className="type-caption text-muted-foreground">
            Graded on the query you wrote, not on execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSubmit}>Submit</Button>
          <Button variant="outline" onClick={onRevealAnswer} disabled={answerRevealed}>
            {answerRevealed ? "Answer shown" : "Show answer"}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onPrevious} disabled={!canPrevious}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
              Next
            </Button>
          </div>
        </div>

        {answerRevealed ? <AnswerDisplay referenceAnswer={problem.referenceAnswer} /> : null}

        <div aria-live="polite" className="flex flex-col gap-4">
          {result && !result.ok ? (
            <div
              role="alert"
              className="animate-materialize rounded-lg border border-destructive/40 bg-destructive/10 p-3 type-caption text-destructive"
            >
              <p className="font-medium">Could not parse your statement</p>
              <p>{result.parseError}</p>
              {typeof result.parseErrorPosition === "number" ? (
                <p className="mt-1 font-mono opacity-80">
                  at position {result.parseErrorPosition}
                </p>
              ) : null}
            </div>
          ) : null}

          {result && result.ok ? (
            <>
              <ScoreDisplay result={result} />
              <RubricFeedback result={result} />
            </>
          ) : null}

          {problem.operation === "find" ? <MatchPreview problem={problem} input={input} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
