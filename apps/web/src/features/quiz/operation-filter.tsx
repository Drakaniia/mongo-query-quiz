import type { OperationKind } from "@mongo/quiz";
import { OPERATION_KINDS } from "@mongo/quiz";
import { Badge } from "@mongo/ui/components/badge";
import { Checkbox } from "@mongo/ui/components/checkbox";
import { Label } from "@mongo/ui/components/label";

import { cn } from "@mongo/ui/lib/utils";

export interface OperationFilterProps {
  operations: readonly OperationKind[];
  counts: Record<OperationKind, number>;
  labels: Record<OperationKind, string>;
  onChange: (next: OperationKind[]) => void;
}

export function OperationFilter({ operations, counts, labels, onChange }: OperationFilterProps) {
  const allSelected =
    operations.length === 0 || OPERATION_KINDS.every((kind) => operations.includes(kind));

  const toggleAll = () => {
    onChange(allSelected ? [] : [...OPERATION_KINDS]);
  };

  const toggle = (kind: OperationKind) => {
    onChange(
      operations.includes(kind)
        ? operations.filter((entry) => entry !== kind)
        : [...operations, kind],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <Label className="cursor-pointer">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        <span className="type-headline" onClick={toggleAll}>
          All
        </span>
      </Label>
      {OPERATION_KINDS.map((kind) => {
        const available = counts[kind];
        return (
          <Label
            key={kind}
            className={cn(
              "-mx-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors duration-150 ease-out-quint hover:bg-muted/60",
              available === 0 && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
          >
            <Checkbox
              checked={operations.includes(kind)}
              disabled={available === 0}
              onCheckedChange={() => toggle(kind)}
            />
            <span onClick={() => toggle(kind)}>{labels[kind]}</span>
            <Badge variant="outline">{available}</Badge>
          </Label>
        );
      })}
    </div>
  );
}
