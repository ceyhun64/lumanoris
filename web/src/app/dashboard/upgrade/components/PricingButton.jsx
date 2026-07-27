import { cn } from "@/lib/utils";

/**
 * Pricing-card action button. Visually distinct from the app-wide
 * shared/ui/button.jsx (different variant palette tuned for this page's
 * violet/fuchsia pricing cards) — kept page-local rather than merged into
 * the shared Button to avoid changing either component's appearance.
 */
export default function PricingButton({
  children,
  className,
  variant = "default",
  disabled,
  onClick,
  ...props
}) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    default:
      "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-400/30",
    primary:
      "bg-gradient-btn hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 text-white shadow-glow border border-fuchsia-400/40",
    secondary:
      "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50",
    outline:
      "bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:border-zinc-500",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
