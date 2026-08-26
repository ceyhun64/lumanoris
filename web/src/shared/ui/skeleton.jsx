import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-fuchsia-400/10",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
