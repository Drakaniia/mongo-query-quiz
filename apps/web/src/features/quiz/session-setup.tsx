import type { Difficulty, QuizSessionConfig } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";
import { Button } from "@mongo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@mongo/ui/components/card";
import { Checkbox } from "@mongo/ui/components/checkbox";
import { Label } from "@mongo/ui/components/label";
import { useMemo, useState } from "react";

import { cn } from "@mongo/ui/lib/utils";

import { COUNT_PRESETS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "./constants";

interface SessionSetupProps {
  availableByDifficulty: Record<Difficulty, number>;
  defaultConfig: QuizSessionConfig;
  canResume: boolean;
  onStart: (config: QuizSessionConfig) => void;
  onResume: () => void;
  onResetProgress: () => void;
}

export function SessionSetup({
  availableByDifficulty,
  defaultConfig,
  canResume,
  onStart,
  onResume,
  onResetProgress,
}: SessionSetupProps) {
  const [selected, setSelected] = useState<Difficulty[]>(defaultConfig.difficulties);
  const [count, setCount] = useState<number>(defaultConfig.count);

  const allSelected = DIFFICULTY_ORDER.every((difficulty) => selected.includes(difficulty));
  const noneSelected = selected.length === 0;

  const availableCount = useMemo(
    () => selected.reduce((sum, difficulty) => sum + availableByDifficulty[difficulty], 0),
    [availableByDifficulty, selected],
  );

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

  const capped = !noneSelected && count > availableCount;

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
            {availableCount} available for this mix.
            {capped ? ` Only ${availableCount} available — the run will be capped.` : ""}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={noneSelected}
          onClick={() => onStart({ difficulties: selected, count })}
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
