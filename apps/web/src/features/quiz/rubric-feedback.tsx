import type { GradeResult, ItemResult } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";

function ItemRow({ item }: { item: ItemResult }) {
  return (
    <li className="flex flex-col gap-2.5 border-t py-3.5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={item.passed ? "success" : "destructive"}>
            {item.passed ? "Correct" : "Incorrect"}
          </Badge>
          <span className="type-body font-semibold">{item.label}</span>
        </div>
        <span className="type-caption tabular-nums text-muted-foreground">
          {item.earned}/{item.max} pts
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="type-overline text-muted-foreground">Expected</span>
          <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
            {item.expected}
          </pre>
        </div>
        <div className="flex flex-col gap-1">
          <span className="type-overline text-muted-foreground">Your answer</span>
          <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
            {item.actual}
          </pre>
        </div>
      </div>
    </li>
  );
}

export function RubricFeedback({ result }: { result: GradeResult }) {
  if (!result.ok) return null;
  return (
    <div className="animate-materialize flex flex-col gap-2">
      <h3 className="type-headline">Rubric feedback</h3>
      <ul className="flex flex-col">
        {result.itemResults.map((item) => (
          <ItemRow key={item.itemId} item={item} />
        ))}
      </ul>
    </div>
  );
}
