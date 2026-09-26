import { previewQuery, type Problem } from "@mongo/quiz";
import { Checkbox } from "@mongo/ui/components/checkbox";
import { Label } from "@mongo/ui/components/label";
import { useMemo, useState } from "react";

interface MatchPreviewProps {
  problem: Problem;
  input: string;
}

function PreviewBody({ problem, input }: MatchPreviewProps) {
  const result = useMemo(
    () => (input.trim().length === 0 ? null : previewQuery(input, problem.sampleDocuments)),
    [input, problem.sampleDocuments],
  );

  if (result === null) {
    return <p className="text-xs text-muted-foreground">Type a query to preview its matches.</p>;
  }
  if (result.status === "error") {
    return <p className="text-xs text-destructive">{result.error}</p>;
  }
  if (result.status === "unsupported") {
    return <p className="text-xs text-muted-foreground">{result.reason}</p>;
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {result.total} match{result.total === 1 ? "" : "es"}
        {result.limitedToOne && result.total > 1 ? " (findOne returns the first)" : ""} ·
        illustrative only
      </p>
      <pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs">
        {JSON.stringify(result.matched, null, 2)}
      </pre>
    </>
  );
}

/**
 * Opt-in, illustrative execution: applies the user's find/findOne filter to the problem's
 * sample documents. This never touches a database and does not affect grading.
 */
export function MatchPreview({ problem, input }: MatchPreviewProps) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 border-t pt-3.5">
      <Label className="cursor-pointer">
        <Checkbox checked={enabled} onCheckedChange={() => setEnabled((value) => !value)} />
        <span className="text-xs font-medium" onClick={() => setEnabled((value) => !value)}>
          Preview matches against the sample documents
        </span>
      </Label>

      <div className="animate-materialize flex flex-col gap-2" aria-live="polite">
        {enabled ? <PreviewBody problem={problem} input={input} /> : null}
      </div>
    </div>
  );
}
