import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full resize-none rounded-xl border border-indigo-400/14 bg-luma-input px-4 py-3 text-sm text-white font-sans placeholder:text-indigo-300/40 transition-all duration-200 focus:outline-none focus:border-indigo-500/55 focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
