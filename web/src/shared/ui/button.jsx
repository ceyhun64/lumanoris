import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold font-display tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-btn text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-luma-card border border-white/10 text-white/80 hover:bg-white/10 hover:text-white",
        ghost:
          "text-white/70 hover:bg-white/5 hover:text-white",
        outline:
          "border border-indigo-400/25 bg-transparent text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400/50",
        destructive:
          "bg-rose-500/90 text-white hover:bg-rose-500 shadow-sm",
        link:
          "text-indigo-400 underline-offset-4 hover:underline hover:text-cyan-400",
        gradient:
          "bg-gradient-luma text-white shadow-glow-cyan hover:brightness-110 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm:      "h-8 rounded-lg px-4 text-xs",
        lg:      "h-12 rounded-xl px-8 text-base",
        xl:      "h-14 rounded-2xl px-10 text-base",
        icon:    "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
