import { formatStatement } from "@mongo/quiz";
import { Button } from "@mongo/ui/components/button";
import { useMemo, useState } from "react";

export function AnswerDisplay({ referenceAnswer }: { referenceAnswer: string }) {
  const [mode, setMode] = useState<"json" | "line">("json");

  const formatted = useMemo(
    () => formatStatement(referenceAnswer) ?? referenceAnswer,
    [referenceAnswer],
  );

  return (
    <div className="animate-materialize flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="type-overline text-muted-foreground">Reference answer</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setMode((current) => (current === "json" ? "line" : "json"))}
        >
          {mode === "json" ? "One line" : "JSON"}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs">
        {mode === "json" ? formatted : referenceAnswer}
      </pre>
    </div>
  );
}
