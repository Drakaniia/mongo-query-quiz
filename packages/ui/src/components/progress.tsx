import { cn } from "@mongo/ui/lib/utils";
import * as React from "react";

function Progress({
  value = 0,
  className,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300 ease-out-quint"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  );
}

export { Progress };
