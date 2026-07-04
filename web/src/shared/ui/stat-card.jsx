import { cn } from "@/lib/utils";

/**
 * Reusable metric tile: label + value + optional icon/trend.
 * `trend` is a signed number (e.g. 12 or -4) rendered as a % delta badge.
 */
function StatCard({ icon: Icon, label, value, trend, className }) {
  const trendPositive = typeof trend === "number" && trend >= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-indigo-400/10 bg-gradient-card p-5 shadow-card",
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-400/15">
          <Icon className="w-5 h-5 text-indigo-300" strokeWidth={1.75} />
        </div>
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[12px] text-white/45 font-sans">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-display font-bold text-white leading-tight">{value}</span>
          {typeof trend === "number" && (
            <span
              className={cn(
                "text-[11px] font-semibold font-sans px-1.5 py-0.5 rounded-md",
                trendPositive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
              )}
            >
              {trendPositive ? "+" : ""}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { StatCard };
