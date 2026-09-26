import { Button } from "@mongo/ui/components/button";
import { Progress } from "@mongo/ui/components/progress";

import { cn } from "@mongo/ui/lib/utils";

interface ProblemNavProps {
  position: number;
  count: number;
  sessionLabel: string;
  answered: boolean[];
  onGoTo: (position: number) => void;
  onNewSession: () => void;
}

export function ProblemNav({
  position,
  count,
  sessionLabel,
  answered,
  onGoTo,
  onNewSession,
}: ProblemNavProps) {
  return (
    <div className="material-thin flex flex-col gap-3 border-b px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="type-headline tabular-nums">
            Problem {position + 1} of {count}
          </span>
          <span className="type-caption text-muted-foreground">{sessionLabel}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onNewSession}>
          New session
        </Button>
      </div>
      <Progress value={((position + 1) / count) * 100} />
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onGoTo(index)}
            aria-label={`Go to problem ${index + 1}`}
            aria-current={index === position ? "step" : undefined}
            className={cn(
              "size-7 rounded-lg border text-xs font-medium tabular-nums transition-[transform,color,background-color,border-color] duration-150 ease-out-quint active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              index === position
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : answered[index]
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
