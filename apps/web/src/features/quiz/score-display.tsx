import type { GradeResult } from "@mongo/quiz";
import { Progress } from "@mongo/ui/components/progress";
import { useEffect, useRef, useState } from "react";

/**
 * Eases the displayed score from its previous value to the new one over a few
 * frames, so a fresh grade lands rather than appearing. Honours reduced motion.
 */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;

    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function ScoreDisplay({ result }: { result: GradeResult }) {
  const displayed = useCountUp(result.ok ? result.score : 0);
  if (!result.ok) return null;
  const tone =
    result.score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : result.score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="animate-materialize flex flex-col gap-2" aria-live="polite">
      <div className="flex items-baseline justify-between">
        <span className="type-overline text-muted-foreground">Score</span>
        <span className={`type-title tabular-nums ${tone}`}>{displayed}%</span>
      </div>
      <Progress value={result.score} />
      <p className="type-caption tabular-nums text-muted-foreground">
        {result.earned} / {result.total} points
      </p>
    </div>
  );
}
