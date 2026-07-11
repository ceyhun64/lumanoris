import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold font-display tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-fuchsia-500/20 text-fuchsia-300",
        secondary:
          "border-transparent bg-violet-500/15 text-violet-300",
        destructive:
          "border-transparent bg-rose-500/20 text-rose-400",
        outline:
          "border-fuchsia-400/25 text-fuchsia-300",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-400",
        warning:
          "border-transparent bg-amber-500/15 text-amber-400",
        sold:
          "border-transparent bg-rose-500/15 text-rose-400",
        produced:
          "border-transparent bg-emerald-500/15 text-emerald-400",
        rented:
          "border-transparent bg-amber-500/15 text-amber-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
