import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold font-display tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-500/20 text-indigo-300",
        secondary:
          "border-transparent bg-cyan-500/15 text-cyan-300",
        destructive:
          "border-transparent bg-rose-500/20 text-rose-400",
        outline:
          "border-indigo-400/25 text-indigo-300",
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
