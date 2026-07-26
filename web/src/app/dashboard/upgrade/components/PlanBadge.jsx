import { cn } from "@/lib/utils";

/**
 * Small pill badge for a plan's "Önerilen" tag. Visually distinct from the
 * app-wide shared/ui/badge.jsx (pill shape + glow vs. its rounded-rect,
 * no-glow look) — kept page-local so neither component's appearance changes.
 */
export default function PlanBadge({ children, variant = "default", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variant === "default"
          ? "bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(192,38,211,0.15)]"
          : "bg-zinc-800 text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
