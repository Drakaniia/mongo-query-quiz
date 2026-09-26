import type { Difficulty } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";
import { cn } from "@mongo/ui/lib/utils";

import { DIFFICULTY_BADGE, DIFFICULTY_LABELS } from "./constants";

const DOT: Record<Difficulty, string> = {
  easy: "bg-emerald-500",
  moderate: "bg-amber-500",
  difficult: "bg-red-500",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant={DIFFICULTY_BADGE[difficulty]} className="gap-1.5">
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[difficulty])} />
      {DIFFICULTY_LABELS[difficulty]}
    </Badge>
  );
}
