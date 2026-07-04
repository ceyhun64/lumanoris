import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-indigo-400/8",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
