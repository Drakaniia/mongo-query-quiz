import { cn } from "@mongo/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline: "border-border text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        danger: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
