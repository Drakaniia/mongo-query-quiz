import type { Difficulty, QuizSessionConfig } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";
import { Button } from "@mongo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";
import { Checkbox } from "@mongo/ui/components/checkbox";
import { Label } from "@mongo/ui/components/label";
import { useState } from "react";

import { cn } from "@mongo/ui/lib/utils";

import {
  COUNT_PRESETS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  OPERATION_HINTS,
  OPERATION_LABELS,
} from "./constants";
import { OperationFilter } from "./operation-filter";
import { OperatorFilter } from "./operator-filter";
import type { SessionFilters } from "./session-filters";
import {
  EMPTY_FILTERS,
  QUERY_OPERATORS,
  UPDATE_OPERATORS,
  useSessionFilters,
} from "./session-filters";

interface SessionSetupProps {
  defaultConfig: QuizSessionConfig;
  defaultFilters?: SessionFilters;
  canResume: boolean;
  onStart: (config: QuizSessionConfig) => void;
  onResume: () => void;
  onResetProgress: () => void;
}

export function SessionSetup({
  defaultConfig,
  defaultFilters,
  canResume,
  onStart,
  onResume,
  onResetProgress,
}: SessionSetupProps) {
  const [selected, setSelected] = useState<Difficulty[]>(defaultConfig.difficulties);
  const [count, setCount] = useState<number>(defaultConfig.count);

  const {
    filters,
    availableByDifficulty,
    availableByOperation,
    availableByQueryOperator,
    availableByUpdateOperator,
    matchingCount,
    setOperations,
    toggleQueryOperator,
    toggleUpdateOperator,
    clearQueryOperators,
    clearUpdateOperators,
    setAllQueryOperators,
    setAllUpdateOperators,
  } = useSessionFilters(defaultFilters ?? EMPTY_FILTERS, selected);

  const allSelected = DIFFICULTY_ORDER.every((difficulty) => selected.includes(difficulty));
  const noneSelected = selected.length === 0;

  const queryOperatorsDisabled =
    filters.operations.length > 0 && !filters.operations.includes("find");
  const updateOperatorsDisabled =
    filters.operations.length > 0 && !filters.operations.includes("update");

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelected((current) =>
      current.includes(difficulty)
        ? current.filter((entry) => entry !== difficulty)
        : [...current, difficulty],
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : [...DIFFICULTY_ORDER]);
  };

  const capped = count > matchingCount;

  return (
    <div className="animate-materialize mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="type-title">MongoDB Practice Quiz</h1>
        <p className="type-body text-muted-foreground">
          Write MongoDB shell statements and get structural feedback on the query itself.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty mix</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label className="cursor-pointer">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span className="type-headline" onClick={toggleAll}>
                All
              </span>
            </Label>
            {DIFFICULTY_ORDER.map((difficulty) => {
              const available = availableByDifficulty[difficulty];
              return (
                <Label
                  key={difficulty}
                  className={cn(
                    "-mx-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors duration-150 ease-out-quint hover:bg-muted/60",
                    available === 0 && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <Checkbox
                    checked={selected.includes(difficulty)}
                    disabled={available === 0}
                    onCheckedChange={() => toggleDifficulty(difficulty)}
                  />
                  <span onClick={() => toggleDifficulty(difficulty)}>
                    {DIFFICULTY_LABELS[difficulty]}
                  </span>
                  <Badge variant="outline">{available}</Badge>
                </Label>
              );
            })}
          </div>
          {noneSelected ? (
            <p role="alert" className="type-caption text-destructive">
              Select at least one difficulty to start.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problem type</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <OperationFilter
            operations={filters.operations}
            counts={availableByOperation}
            labels={OPERATION_LABELS}
            onChange={setOperations}
          />
          <div className="flex flex-col gap-3">
            <OperatorFilter
              label="Query operators"
              description={OPERATION_HINTS.find}
              operators={QUERY_OPERATORS}
              counts={availableByQueryOperator}
              selected={filters.queryOperators}
              onToggle={toggleQueryOperator}
              onClear={clearQueryOperators}
              onSelectAll={setAllQueryOperators}
              disabled={queryOperatorsDisabled}
            />
            <OperatorFilter
              label="Update operators"
              description={OPERATION_HINTS.update}
              operators={UPDATE_OPERATORS}
              counts={availableByUpdateOperator}
              selected={filters.updateOperators}
              onToggle={toggleUpdateOperator}
              onClear={clearUpdateOperators}
              onSelectAll={setAllUpdateOperators}
              disabled={updateOperatorsDisabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Number of problems</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label="Number of problems"
            className="inline-flex w-fit items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1"
          >
            {COUNT_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant="ghost"
                size="sm"
                role="radio"
                aria-checked={preset === count}
                onClick={() => setCount(preset)}
                className={cn(
                  "rounded-full tabular-nums transition-[transform,background-color,box-shadow] duration-200 ease-out-quint",
                  preset === count
                    ? "bg-background text-foreground shadow-sm hover:bg-background"
                    : "text-muted-foreground hover:bg-transparent",
                )}
              >
                {preset}
              </Button>
            ))}
          </div>
          <p className="type-caption text-muted-foreground">
            {matchingCount} available for this mix.
            {capped ? ` Only ${matchingCount} available — the run will be capped.` : ""}
          </p>
          {matchingCount === 0 ? (
            <p role="alert" className="type-caption text-destructive">
              No problems match these filters — try widening the difficulty mix or clearing
              operators.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={noneSelected || matchingCount === 0}
          onClick={() =>
            onStart({
              difficulties: selected,
              count,
              operations: filters.operations,
              queryOperators: filters.queryOperators,
              updateOperators: filters.updateOperators,
            })
          }
        >
          Start session
        </Button>
        {canResume ? (
          <Button variant="outline" onClick={onResume}>
            Resume last session
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            if (window.confirm("Reset all quiz progress? This cannot be undone.")) {
              onResetProgress();
            }
          }}
        >
          Reset progress
        </Button>
      </div>
    </div>
  );
}
