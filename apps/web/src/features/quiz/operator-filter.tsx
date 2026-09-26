import { Button } from "@mongo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mongo/ui/components/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export interface OperatorFilterProps {
  label: string;
  description?: string;
  operators: readonly string[];
  counts: Record<string, number>;
  selected: readonly string[];
  onToggle: (operator: string) => void;
  onClear: () => void;
  onSelectAll: () => void;
  disabled?: boolean;
}

export function OperatorFilter({
  label,
  description,
  operators,
  counts,
  selected,
  onToggle,
  onClear,
  onSelectAll,
  disabled = false,
}: OperatorFilterProps) {
  const summary = selected.length === 0 ? "Everything" : `${selected.length} selected`;
  const subject = label.replace(/\s+operators$/i, "");
  const caption = disabled ? `Enable ${subject} above to filter by operators` : description;

  return (
    <div className="flex flex-col gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={<Button variant="outline" className="w-full" />}
        >
          <span>{label}</span>
          <span className="ml-auto tabular-nums text-muted-foreground">{summary}</span>
          <ChevronDownIcon className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuItem onClick={onSelectAll}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={onClear}>Clear</DropdownMenuItem>
            <DropdownMenuSeparator />
            {operators.map((operator) => {
              const available = counts[operator] ?? 0;
              return (
                <DropdownMenuCheckboxItem
                  key={operator}
                  checked={selected.includes(operator)}
                  disabled={available === 0}
                  onCheckedChange={() => onToggle(operator)}
                >
                  <span className="font-mono">{operator}</span>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {available}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {caption ? <p className="type-caption text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
