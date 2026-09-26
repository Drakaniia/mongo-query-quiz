import type { QuizSessionConfig } from "@mongo/quiz";
import { normalizeConfig } from "@mongo/quiz";
import { PROBLEM_BANK } from "@mongo/quiz/problems";
import { Button } from "@mongo/ui/components/button";
import { Skeleton } from "@mongo/ui/components/skeleton";
import { useMemo, useState } from "react";

import { AnswerPane } from "./answer-pane";
import { DIFFICULTY_LABELS } from "./constants";
import { ProblemNav } from "./problem-nav";
import { ProblemPane } from "./problem-pane";
import { SessionSetup } from "./session-setup";
import { SessionSummary } from "./session-summary";
import { useQuizProgress } from "./use-quiz-progress";
import { useQuizSession } from "./use-quiz-session";

type View = "setup" | "run" | "summary";

const DEFAULT_CONFIG: QuizSessionConfig = {
  difficulties: [],
  count: 30,
  operations: [],
  queryOperators: [],
  updateOperators: [],
};

/** One short type-filter suffix for the run header; empty when every type is in play. */
function typeFilterSuffix(config: QuizSessionConfig): string {
  if (config.operations.length === 1) {
    return config.operations[0] === "update" ? "Updates only" : "Queries only";
  }
  if (config.queryOperators.length > 0) {
    return `Query operators: ${config.queryOperators.join(", ")}`;
  }
  if (config.updateOperators.length > 0) {
    return `Update operators: ${config.updateOperators.join(", ")}`;
  }
  return "";
}

export function QuizPage() {
  const progress = useQuizProgress();
  const quiz = useQuizSession(progress);
  const [view, setView] = useState<View>("setup");

  const defaultConfig = useMemo<QuizSessionConfig>(
    () => normalizeConfig(progress.progress.lastConfig ?? DEFAULT_CONFIG),
    [progress.progress.lastConfig],
  );

  if (!progress.hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (view === "setup" || !quiz.session) {
    return (
      <SessionSetup
        defaultConfig={defaultConfig}
        defaultFilters={{
          operations: defaultConfig.operations,
          queryOperators: defaultConfig.queryOperators,
          updateOperators: defaultConfig.updateOperators,
        }}
        canResume={quiz.canResume}
        onStart={(config) => {
          quiz.start(config);
          setView("run");
        }}
        onResume={() => {
          quiz.resume();
          setView("run");
        }}
        onResetProgress={() => {
          progress.reset();
          setView("setup");
        }}
      />
    );
  }

  if (view === "summary") {
    return (
      <SessionSummary
        session={quiz.session}
        results={quiz.results}
        onNewSession={() => setView("setup")}
        onReview={(problemId) => {
          const index =
            quiz.session?.problems.findIndex((problem) => problem.id === problemId) ?? -1;
          if (index >= 0) quiz.goTo(index);
          setView("run");
        }}
      />
    );
  }

  const { session, current, position, results } = quiz;
  const problem = current;

  const typeSuffix = typeFilterSuffix(session.config);
  const sessionLabel = `${session.config.difficulties.length === 0 ? "All" : session.config.difficulties.map((d) => DIFFICULTY_LABELS[d]).join(", ")}${typeSuffix ? ` · ${typeSuffix}` : ""} · ${session.problems.length} problems${
    session.capped ? ` (capped from ${session.availableCount} available)` : ""
  }`;

  const answered = session.problems.map((entry) => results[entry.id]?.ok ?? false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProblemNav
        position={position}
        count={session.problems.length}
        sessionLabel={sessionLabel}
        answered={answered}
        onGoTo={quiz.goTo}
        onNewSession={() => setView("setup")}
      />

      {problem ? (
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-2">
          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            <ProblemPane
              problem={problem}
              revealedHints={progress.progress.revealedHints[problem.id] ?? 0}
              onRevealHint={() => progress.revealHint(problem.id)}
            />
          </div>
          <div className="min-h-0 overflow-y-auto border-t bg-muted/20 p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <AnswerPane
              problem={problem}
              result={results[problem.id]}
              bestScore={progress.progress.bestScores[problem.id]}
              answerRevealed={progress.progress.showAnswerRevealed[problem.id] ?? false}
              canPrevious={position > 0}
              canNext={position < session.problems.length - 1}
              onSubmit={(input) => {
                const result = quiz.submit(input);
                if (result?.ok) progress.revealAnswer(problem.id);
              }}
              onToggleAnswer={() => progress.toggleAnswer(problem.id)}
              onPrevious={quiz.previous}
              onNext={quiz.next}
            />
          </div>
        </div>
      ) : null}

      <div className="material-thin flex items-center justify-between gap-2 border-t px-4 py-3">
        <span className="type-caption tabular-nums text-muted-foreground">
          {PROBLEM_BANK.length} problems in the bank
        </span>
        <Button variant="outline" size="sm" onClick={() => setView("summary")}>
          Finish session
        </Button>
      </div>
    </div>
  );
}
