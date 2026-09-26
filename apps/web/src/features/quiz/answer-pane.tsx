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
import { SyntaxFeedback } from "./syntax-feedback";

interface AnswerPaneProps {
  problem: Problem;
  result: GradeResult | undefined;
  bestScore: number | undefined;
  answerRevealed: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onSubmit: (input: string) => void;
  onToggleAnswer: () => void;
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
  onToggleAnswer,
  onPrevious,
  onNext,
}: AnswerPaneProps) {
  const [input, setInput] = useState("");
  // Snapshot of the text the last result came from, so syntax guidance keeps pointing at the
  // submission that failed even after editing starts again.
  const [submittedInput, setSubmittedInput] = useState("");

  useEffect(() => {
    setInput("");
    setSubmittedInput("");
  }, [problem.id]);

  const handleSubmit = () => {
    setSubmittedInput(input);
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
          <Button variant="outline" onClick={onToggleAnswer}>
            {answerRevealed ? "Hide answer" : "Show answer"}
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
          {result && !result.ok ? <SyntaxFeedback input={submittedInput} result={result} /> : null}

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
