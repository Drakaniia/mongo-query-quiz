import type { Difficulty, OperationKind, QuizSessionConfig } from "@mongo/quiz";
import {
  OPERATION_KINDS,
  QUERY_OPERATOR_ORDER,
  UPDATE_OPERATOR_ORDER,
  collectQueryOperators,
  collectUpdateOperators,
  countMatching,
} from "@mongo/quiz";
import { PROBLEM_BANK } from "@mongo/quiz/problems";
import { useMemo, useState } from "react";

import { DIFFICULTY_ORDER } from "./constants";

export interface SessionFilters {
  operations: OperationKind[];
  queryOperators: string[];
  updateOperators: string[];
}

export const EMPTY_FILTERS: SessionFilters = {
  operations: [],
  queryOperators: [],
  updateOperators: [],
};

export interface SessionFiltersApi {
  filters: SessionFilters;
  availableByDifficulty: Record<Difficulty, number>;
  availableByOperation: Record<OperationKind, number>;
  availableByQueryOperator: Record<string, number>;
  availableByUpdateOperator: Record<string, number>;
  matchingCount: number;
  setOperations: (next: OperationKind[]) => void;
  toggleQueryOperator: (operator: string) => void;
  toggleUpdateOperator: (operator: string) => void;
  clearQueryOperators: () => void;
  clearUpdateOperators: () => void;
  setAllQueryOperators: () => void;
  setAllUpdateOperators: () => void;
  reset: () => void;
}

const PROBE_COUNT = 30;

function countWith(filters: SessionFilters, overrides: Partial<QuizSessionConfig> = {}): number {
  return countMatching(PROBLEM_BANK, {
    difficulties: [],
    count: PROBE_COUNT,
    ...filters,
    ...overrides,
  });
}

function countsBy<K extends string>(
  keys: readonly K[],
  count: (key: K) => number,
): Record<K, number> {
  const counts = {} as Record<K, number>;
  for (const key of keys) {
    counts[key] = count(key);
  }
  return counts;
}

/** Curated order, narrowed to the operators the bank actually exercises. */
function operatorKeys(ordered: readonly string[], inBank: readonly string[]): readonly string[] {
  const present = new Set(inBank);
  return [
    ...ordered.filter((operator) => present.has(operator)),
    ...inBank.filter((operator) => !ordered.includes(operator)),
  ];
}

/** The query operators offered in the UI. */
export const QUERY_OPERATORS = operatorKeys(
  QUERY_OPERATOR_ORDER,
  collectQueryOperators(PROBLEM_BANK),
);

/** The update operators offered in the UI. */
export const UPDATE_OPERATORS = operatorKeys(
  UPDATE_OPERATOR_ORDER,
  collectUpdateOperators(PROBLEM_BANK),
);

/**
 * Operation and operator filter state for the setup screen, with every badge counted over the
 * whole bank so a dimension never shrinks itself as its own checkboxes are ticked. Only
 * `matchingCount` narrows to the currently selected difficulties — it is the number the run will
 * actually draw from.
 */
export function useSessionFilters(
  defaults: SessionFilters,
  difficulties: readonly Difficulty[] = [],
): SessionFiltersApi {
  const [operations, setOperations] = useState<OperationKind[]>(() => [...defaults.operations]);
  const [queryOperators, setQueryOperators] = useState<string[]>(() => [
    ...defaults.queryOperators,
  ]);
  const [updateOperators, setUpdateOperators] = useState<string[]>(() => [
    ...defaults.updateOperators,
  ]);

  const filters = useMemo<SessionFilters>(
    () => ({ operations, queryOperators, updateOperators }),
    [operations, queryOperators, updateOperators],
  );

  const availableByDifficulty = useMemo(
    () =>
      countsBy(DIFFICULTY_ORDER, (difficulty) =>
        countWith(filters, { difficulties: [difficulty] }),
      ),
    [filters],
  );

  const availableByOperation = useMemo(
    () => countsBy(OPERATION_KINDS, (kind) => countWith(filters, { operations: [kind] })),
    [filters],
  );

  const availableByQueryOperator = useMemo(
    () =>
      countsBy(QUERY_OPERATORS, (operator) => countWith(filters, { queryOperators: [operator] })),
    [filters],
  );

  const availableByUpdateOperator = useMemo(
    () =>
      countsBy(UPDATE_OPERATORS, (operator) => countWith(filters, { updateOperators: [operator] })),
    [filters],
  );

  const matchingCount = useMemo(
    () => countWith(filters, { difficulties: [...difficulties] }),
    [difficulties, filters],
  );

  const toggleQueryOperator = (operator: string) => {
    setQueryOperators((current) =>
      current.includes(operator)
        ? current.filter((entry) => entry !== operator)
        : [...current, operator],
    );
  };

  const toggleUpdateOperator = (operator: string) => {
    setUpdateOperators((current) =>
      current.includes(operator)
        ? current.filter((entry) => entry !== operator)
        : [...current, operator],
    );
  };

  const reset = () => {
    setOperations([...defaults.operations]);
    setQueryOperators([...defaults.queryOperators]);
    setUpdateOperators([...defaults.updateOperators]);
  };

  return {
    filters,
    availableByDifficulty,
    availableByOperation,
    availableByQueryOperator,
    availableByUpdateOperator,
    matchingCount,
    setOperations,
    toggleQueryOperator,
    toggleUpdateOperator,
    clearQueryOperators: () => setQueryOperators([]),
    clearUpdateOperators: () => setUpdateOperators([]),
    setAllQueryOperators: () => setQueryOperators([...QUERY_OPERATORS]),
    setAllUpdateOperators: () => setUpdateOperators([...UPDATE_OPERATORS]),
    reset,
  };
}
