import {
  grade,
  sampleProblems,
  type GradeResult,
  type Problem,
  type QuizSession,
  type QuizSessionConfig,
} from "@mongo/quiz";
import { PROBLEM_BANK, getProblemById } from "@mongo/quiz/problems";
import { useCallback, useMemo, useState } from "react";

import type { QuizProgressApi } from "./use-quiz-progress";

export interface QuizSessionApi {
  session: QuizSession | null;
  position: number;
  current: Problem | null;
  results: Record<string, GradeResult>;
  canResume: boolean;
  start: (config: QuizSessionConfig) => void;
  resume: () => void;
  goTo: (position: number) => void;
  next: () => void;
  previous: () => void;
  submit: (input: string) => GradeResult | null;
}

export function useQuizSession(progress: QuizProgressApi): QuizSessionApi {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [position, setPosition] = useState(0);
  const [results, setResults] = useState<Record<string, GradeResult>>({});

  const { setLastConfig, setSession: persistSession, setLastProblemId, recordScore, progress: stored } =
    progress;

  const start = useCallback(
    (config: QuizSessionConfig) => {
      const nextSession = sampleProblems(PROBLEM_BANK, config);
      setSession(nextSession);
      setPosition(0);
      setResults({});
      setLastConfig(config);
      persistSession(
        nextSession.problems.map((problem) => problem.id),
        new Date().toISOString(),
      );
    },
    [persistSession, setLastConfig],
  );

  const resume = useCallback(() => {
    const ids = stored.sessionProblemIds ?? [];
    const problems = ids
      .map((id) => getProblemById(id))
      .filter((problem): problem is Problem => problem !== undefined);
    if (problems.length === 0) return;
    const config: QuizSessionConfig = stored.lastConfig ?? {
      difficulties: [],
      count: problems.length,
    };
    setSession({ config, problems, capped: false, availableCount: problems.length });
    const lastIndex = stored.lastProblemId
      ? problems.findIndex((problem) => problem.id === stored.lastProblemId)
      : 0;
    setPosition(lastIndex > 0 ? lastIndex : 0);
  }, [stored.lastConfig, stored.lastProblemId, stored.sessionProblemIds]);

  const goTo = useCallback(
    (index: number) => {
      if (!session) return;
      const clamped = Math.max(0, Math.min(session.problems.length - 1, index));
      setPosition(clamped);
      const problem = session.problems[clamped];
      if (problem) setLastProblemId(problem.id);
    },
    [session, setLastProblemId],
  );

  const next = useCallback(() => goTo(position + 1), [goTo, position]);
  const previous = useCallback(() => goTo(position - 1), [goTo, position]);

  const current = useMemo(() => {
    if (!session) return null;
    return session.problems[position] ?? null;
  }, [position, session]);

  const submit = useCallback(
    (input: string): GradeResult | null => {
      if (!session || !current) return null;
      const result = grade(current, input);
      setResults((currentResults) => ({ ...currentResults, [current.id]: result }));
      if (result.ok) recordScore(current.id, result.score);
      return result;
    },
    [current, recordScore, session],
  );

  const canResume = (stored.sessionProblemIds?.length ?? 0) > 0;

  return {
    session,
    position,
    current,
    results,
    canResume,
    start,
    resume,
    goTo,
    next,
    previous,
    submit,
  };
}
