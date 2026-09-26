import type { QuizSessionConfig } from "@mongo/quiz";
import { normalizeConfig } from "@mongo/quiz";
import { useCallback, useEffect, useRef, useState } from "react";

import { STORAGE_KEY } from "./constants";

export interface QuizProgress {
  version: 1;
  /** problemId -> best score 0-100 (global). */
  bestScores: Record<string, number>;
  /** problemId -> count of hints revealed (global). */
  revealedHints: Record<string, number>;
  /** problemId -> whether the answer was revealed. */
  showAnswerRevealed: Record<string, boolean>;
  lastConfig?: QuizSessionConfig;
  lastProblemId?: string;
  sessionProblemIds?: string[];
  sessionStartedAt?: string;
}

const EMPTY_PROGRESS: QuizProgress = {
  version: 1,
  bestScores: {},
  revealedHints: {},
  showAnswerRevealed: {},
};

function readProgress(): QuizProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { ...EMPTY_PROGRESS };
    const value = parsed as Partial<QuizProgress>;
    return {
      version: 1,
      bestScores: isNumberRecord(value.bestScores) ? value.bestScores : {},
      revealedHints: isNumberRecord(value.revealedHints) ? value.revealedHints : {},
      showAnswerRevealed: isBooleanRecord(value.showAnswerRevealed) ? value.showAnswerRevealed : {},
      ...(value.lastConfig ? { lastConfig: normalizeConfig(value.lastConfig) } : {}),
      ...(typeof value.lastProblemId === "string" ? { lastProblemId: value.lastProblemId } : {}),
      ...(Array.isArray(value.sessionProblemIds)
        ? {
            sessionProblemIds: value.sessionProblemIds.filter(
              (id): id is string => typeof id === "string",
            ),
          }
        : {}),
      ...(typeof value.sessionStartedAt === "string"
        ? { sessionStartedAt: value.sessionStartedAt }
        : {}),
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "number")
  );
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "boolean")
  );
}

export interface QuizProgressApi {
  progress: QuizProgress;
  hydrated: boolean;
  recordScore: (problemId: string, score: number) => void;
  revealHint: (problemId: string) => void;
  revealAnswer: (problemId: string) => void;
  toggleAnswer: (problemId: string) => void;
  setLastConfig: (config: QuizSessionConfig) => void;
  setSession: (problemIds: string[], startedAt?: string) => void;
  setLastProblemId: (problemId: string) => void;
  clearSession: () => void;
  reset: () => void;
}

/** Progress persists globally; reading is defensive and writes degrade gracefully. */
export function useQuizProgress(): QuizProgressApi {
  const [progress, setProgress] = useState<QuizProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setProgress(readProgress());
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // localStorage unavailable (private mode): degrade to in-memory.
    }
  }, [progress]);

  const recordScore = useCallback((problemId: string, score: number) => {
    setProgress((current) => {
      const previous = current.bestScores[problemId] ?? 0;
      if (score <= previous) return current;
      return { ...current, bestScores: { ...current.bestScores, [problemId]: score } };
    });
  }, []);

  const revealHint = useCallback((problemId: string) => {
    setProgress((current) => {
      const previous = current.revealedHints[problemId] ?? 0;
      return {
        ...current,
        revealedHints: { ...current.revealedHints, [problemId]: previous + 1 },
      };
    });
  }, []);

  const revealAnswer = useCallback((problemId: string) => {
    setProgress((current) => ({
      ...current,
      showAnswerRevealed: { ...current.showAnswerRevealed, [problemId]: true },
    }));
  }, []);

  const toggleAnswer = useCallback((problemId: string) => {
    setProgress((current) => ({
      ...current,
      showAnswerRevealed: {
        ...current.showAnswerRevealed,
        [problemId]: !(current.showAnswerRevealed[problemId] ?? false),
      },
    }));
  }, []);

  const setLastConfig = useCallback((config: QuizSessionConfig) => {
    setProgress((current) => ({ ...current, lastConfig: config }));
  }, []);

  const setSession = useCallback((problemIds: string[], startedAt?: string) => {
    setProgress((current) => ({
      ...current,
      sessionProblemIds: problemIds,
      sessionStartedAt: startedAt ?? new Date().toISOString(),
      lastProblemId: problemIds[0],
    }));
  }, []);

  const setLastProblemId = useCallback((problemId: string) => {
    setProgress((current) => ({ ...current, lastProblemId: problemId }));
  }, []);

  const clearSession = useCallback(() => {
    setProgress((current) => {
      const next = { ...current };
      delete next.sessionProblemIds;
      delete next.sessionStartedAt;
      delete next.lastProblemId;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setProgress({ ...EMPTY_PROGRESS, bestScores: {}, revealedHints: {}, showAnswerRevealed: {} });
  }, []);

  return {
    progress,
    hydrated,
    recordScore,
    revealHint,
    revealAnswer,
    toggleAnswer,
    setLastConfig,
    setSession,
    setLastProblemId,
    clearSession,
    reset,
  };
}
