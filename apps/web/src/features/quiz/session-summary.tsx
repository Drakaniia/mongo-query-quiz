import type { GradeResult, Problem, QuizSession } from "@mongo/quiz";
import { Button } from "@mongo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";
import { useMemo } from "react";

interface SessionSummaryProps {
  session: QuizSession;
  results: Record<string, GradeResult>;
  onNewSession: () => void;
  onReview: (problemId: string) => void;
}

export function SessionSummary({ session, results, onNewSession, onReview }: SessionSummaryProps) {
  const graded = useMemo(
    () =>
      session.problems
        .map((problem) => ({ problem, result: results[problem.id] }))
        .filter(
          (entry): entry is { problem: Problem; result: GradeResult } => Boolean(entry.result?.ok),
        ),
    [results, session.problems],
  );

  const average =
    graded.length > 0
      ? Math.round(graded.reduce((sum, entry) => sum + entry.result.score, 0) / graded.length)
      : 0;
  const best = graded.reduce((max, entry) => Math.max(max, entry.result.score), 0);

  const weakItems = useMemo(() => {
    const failures = new Map<string, { label: string; count: number }>();
    for (const { result } of graded) {
      for (const item of result.itemResults) {
        if (item.passed) continue;
        const current = failures.get(item.itemId) ?? { label: item.label, count: 0 };
        current.count += 1;
        failures.set(item.itemId, current);
      }
    }
    return [...failures.values()].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [graded]);

  const firstWeakProblem = session.problems.find((problem) => {
    const result = results[problem.id];
    return result?.ok && result.score < 100;
  });

  return (
    <div className="animate-materialize mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="type-title">Session complete</h1>
        <p className="type-body text-muted-foreground">
          {graded.length} of {session.problems.length} problems graded.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="type-overline text-muted-foreground">Average</span>
            <span className="type-title tabular-nums">{average}%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="type-overline text-muted-foreground">Best</span>
            <span className="type-title tabular-nums">{best}%</span>
          </div>
        </CardContent>
      </Card>

      {weakItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Weakest rubric items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {weakItems.map((item) => (
                <li key={item.label} className="type-body flex items-baseline justify-between gap-3">
                  <span>{item.label}</span>
                  <span className="type-caption tabular-nums text-muted-foreground">
                    missed {item.count}×
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onNewSession}>New session</Button>
        {firstWeakProblem ? (
          <Button variant="outline" onClick={() => onReview(firstWeakProblem.id)}>
            Review missed problems
          </Button>
        ) : null}
      </div>
    </div>
  );
}
